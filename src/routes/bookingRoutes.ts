import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { PrismaClient, BookingStatus, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { FamilyMember } from "../types/index.js";

const router = express.Router();
const prisma = new PrismaClient();

const familyMemberSchema = z.object({
  name: z.string(),
  age: z.number().min(0),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  relationship: z.string()
});

const createBookingSchema = z.object({
  hotelId: z.string().uuid(),
  roomId: z.string().uuid(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  members: z.array(familyMemberSchema),
  documents: z.record(z.unknown()).optional()
});

type CreateBookingBody = z.infer<typeof createBookingSchema>;

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotelId
 *               - roomId
 *               - checkIn
 *               - checkOut
 *               - members
 *             properties:
 *               hotelId:
 *                 type: string
 *               roomId:
 *                 type: string
 *               checkIn:
 *                 type: string
 *                 format: date-time
 *               checkOut:
 *                 type: string
 *                 format: date-time
 *               members:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - age
 *                     - gender
 *                     - relationship
 *                   properties:
 *                     name:
 *                       type: string
 *                     age:
 *                       type: number
 *                     gender:
 *                       type: string
 *                     relationship:
 *                       type: string
 *               documents:
 *                 type: object
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post("/", requireAuth, async (req: express.Request, res) => {
  try {
    const body = createBookingSchema.parse(req.body);
    const checkIn = new Date(body.checkIn);
    const checkOut = new Date(body.checkOut);

    // Check if room is available for the given dates
    const existingBooking = await prisma.booking.findFirst({
      where: {
        roomId: body.roomId,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PENDING]
        },
        OR: [
          {
            AND: [
              { checkIn: { lte: checkIn } },
              { checkOut: { gte: checkIn } }
            ]
          },
          {
            AND: [
              { checkIn: { lte: checkOut } },
              { checkOut: { gte: checkOut } }
            ]
          }
        ]
      }
    });

    if (existingBooking) {
      return res.status(400).json({ error: "Room not available for selected dates" });
    }

    // Calculate total amount (implement your pricing logic)
    const room = await prisma.room.findUnique({
      where: { id: body.roomId }
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = room.price * days;

    const booking = await prisma.booking.create({
      data: {
        checkIn,
        checkOut,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount,
        members: body.members,
        documents: body.documents ? JSON.stringify(body.documents) : undefined,
        user: {
          connect: {
            id: (req as any).user!.id
          }
        },
        hotel: {
          connect: {
            id: body.hotelId
          }
        },
        room: {
          connect: {
            id: body.roomId
          }
        }
      },
      include: {
        user: true,
        hotel: {
          include: {
            owner: true,
            managers: true
          }
        },
        room: true
      }
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(400).json({ error: "Failed to create booking" });
  }
});

/**
 * @swagger
 * /api/bookings/user:
 *   get:
 *     summary: Get user's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's bookings
 */
router.get("/user", requireAuth, async (req: any, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        userId: req.user!.id,
      },
      include: {
        hotel: true,
        room: true,
      },
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   put:
 *     summary: Update booking status
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED]
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 */
router.put("/:id/status", requireAuth, async (req: any, res) => {
  try {
    const { status } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { hotel: true },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Only hotel owner can update booking status
    if (booking.hotel.ownerId !== req.user!.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: status as BookingStatus,
      },
    });

    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ error: "Failed to update booking status" });
  }
});

export default router; 