import { UserRole, RoomType, RoomStatus, BookingStatus, PaymentStatus } from '@prisma/client';

export interface FamilyMember {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  relationship: string;
}

export interface HotelRules {
  maxGuestsPerRoom?: number;
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: string;
  allowedAgeGroups?: {
    min: number;
    max: number;
  };
  maxBookingsPerUser?: number;
  customRules?: string[];
}

export interface CreateHotelRequest {
  name: string;
  location: string;
  description: string;
  rules?: HotelRules;
}

export interface CreateRoomRequest {
  roomNumber: string;
  type: RoomType;
  price: number;
  capacity: number;
  amenities: string[];
}

export interface CreateBookingRequest {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  members: FamilyMember[];
}

export interface UpdateBookingStatusRequest {
  status: BookingStatus;
  paymentStatus?: PaymentStatus;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  role: UserRole;
  image?: string;
}

export interface HotelResponse {
  id: string;
  name: string;
  location: string;
  description: string;
  hotelCode: string;
  images: string[];
  rules?: HotelRules;
  owner: UserProfile;
  managers: UserProfile[];
}

export interface RoomResponse {
  id: string;
  roomNumber: string;
  roomCode: string;
  type: RoomType;
  price: number;
  capacity: number;
  amenities: string[];
  images: string[];
  status: RoomStatus;
  hotel: HotelResponse;
}

export interface BookingResponse {
  id: string;
  user: UserProfile;
  hotel: HotelResponse;
  room: RoomResponse;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  members: FamilyMember[];
  createdAt: string;
  updatedAt: string;
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
} 