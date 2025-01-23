import { PrismaClient, UserRole, RoomType, BookingStatus } from '@prisma/client'

const prisma = new PrismaClient()

const seed = async () => {
  // Delete existing records (for development)
  await prisma.booking.deleteMany()
  await prisma.room.deleteMany()
  await prisma.hotel.deleteMany()
  await prisma.user.deleteMany()

  // Seed users individually so we can use their IDs for hotels
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      image: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
  })

  const hotelOwner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      name: 'Hotel Owner',
      role: UserRole.OWNER,
      image: 'https://randomuser.me/api/portraits/men/2.jpg',
    },
  })

  const guestUser = await prisma.user.upsert({
    where: { email: 'guest@example.com' },
    update: {},
    create: {
      email: 'guest@example.com',
      name: 'Guest User',
      role: UserRole.GUEST,
      image: 'https://randomuser.me/api/portraits/men/3.jpg',
    },
  })

  console.log(`Created or found users: ${adminUser.id}, ${hotelOwner.id}, ${guestUser.id}`)

  // Seed hotels and capture the created hotel records
  const hotels = await prisma.hotel.createMany({
    data: [
      {
        name: 'Grand Hotel',
        location: 'New York, USA',
        hotelCode: 'NYC001',
        images: ['https://via.placeholder.com/300', 'https://via.placeholder.com/300'],
        ownerId: hotelOwner.id, // Use the valid ownerId
      },
      {
        name: 'Beach Resort',
        location: 'Miami, USA',
        hotelCode: 'MIA001',
        images: ['https://via.placeholder.com/300', 'https://via.placeholder.com/300'],
        ownerId: hotelOwner.id, // Use the valid ownerId
      },
    ],
  })

  console.log(`Created ${hotels.count} hotels`)

  // Fetch created hotels to use their IDs for rooms
  const allHotels = await prisma.hotel.findMany()

  // Seed rooms using the valid hotel IDs from the database (Create rooms one by one)
  const room1 = await prisma.room.create({
    data: {
      roomNumber: '101',
      type: RoomType.STANDARD,
      price: 100,
      hotelId: allHotels[0].id, // Use the actual hotel ID from the database
    },
  })

  const room2 = await prisma.room.create({
    data: {
      roomNumber: '102',
      type: RoomType.DELUXE,
      price: 200,
      hotelId: allHotels[0].id, // Use the actual hotel ID from the database
    },
  })

  const room3 = await prisma.room.create({
    data: {
      roomNumber: '201',
      type: RoomType.SUITE,
      price: 500,
      hotelId: allHotels[1].id, // Use the actual hotel ID from the database
    },
  })

  const room4 = await prisma.room.create({
    data: {
      roomNumber: '202',
      type: RoomType.STANDARD,
      price: 120,
      hotelId: allHotels[1].id, // Use the actual hotel ID from the database
    },
  })

  console.log(`Created rooms: ${room1.id}, ${room2.id}, ${room3.id}, ${room4.id}`)

  // Seed bookings using the correct roomId and hotelId
  const bookings = await prisma.booking.createMany({
    data: [
      {
        userId: guestUser.id, // Using the guest user ID
        hotelId: allHotels[0].id, // Grand Hotel
        roomId: room1.id, // Room 101
        checkIn: new Date('2025-02-01T14:00:00Z'),
        checkOut: new Date('2025-02-05T12:00:00Z'),
        status: BookingStatus.PENDING,
        documents: { passport: 'passport-12345' },
      },
      {
        userId: guestUser.id,
        hotelId: allHotels[1].id, // Beach Resort
        roomId: room3.id, // Room 201
        checkIn: new Date('2025-03-01T14:00:00Z'),
        checkOut: new Date('2025-03-07T12:00:00Z'),
        status: BookingStatus.CONFIRMED,
        documents: { passport: 'passport-67890' },
      },
    ],
  })

  console.log(`Created ${bookings.count} bookings`)

  await prisma.$disconnect()
}

seed()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
