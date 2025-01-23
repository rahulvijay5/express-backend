import { Router, Request, Response } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { PrismaClient, RoomType, RoomStatus } from "@prisma/client";
import { z } from "zod";
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createRoomSchema = z.object({
  hotelId: z.string().uuid(),
  roomNumber: z.string(),
  type: z.enum(["STANDARD", "DELUXE", "SUITE", "PRESIDENTIAL"]),
  price: z.number().positive(),
  capacity: z.number().min(1),
  amenities: z.array(z.string()),
  images: z.array(z.string()).optional()
});

const updateRoomSchema = z.object({
  type: z.enum(["STANDARD", "DELUXE", "SUITE"]).optional(),
  price: z.number().positive().optional(),
});

type CreateRoomBody = z.infer<typeof createRoomSchema>;
type UpdateRoomBody = z.infer<typeof updateRoomSchema>;

function generateRoomCode(): string {
  const counter = Date.now().toString();
  const hash = crypto.createHash('sha256').update(counter).digest('hex');
  return hash.substring(0, 6);
}

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Add a new room
 *     tags: [Rooms]
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
 *               - roomNumber
 *               - type
 *               - price
 *             properties:
 *               hotelId:
 *                 type: string
 *               roomNumber:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [STANDARD, DELUXE, SUITE]
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Room created successfully
 */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const body = createRoomSchema.parse(req.body);
    
    // Generate unique room code
    const roomCode = generateRoomCode();
    
    const room = await prisma.room.create({
      data: {
        roomNumber: body.roomNumber,
        type: body.type,
        price: body.price,
        capacity: body.capacity,
        amenities: body.amenities,
        images: body.images || [],
        roomCode,
        status: RoomStatus.AVAILABLE,
        hotel: {
          connect: {
            id: body.hotelId
          }
        }
      },
      include: {
        hotel: {
          include: {
            owner: true,
            managers: true
          }
        }
      }
    });

    res.status(201).json(room);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(400).json({ error: "Failed to create room" });
  }
});

/**
 * @swagger
 * /api/rooms/hotel/{hotelId}:
 *   get:
 *     summary: Get all rooms for a hotel
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of rooms
 */
router.get(
  "/hotel/:hotelId",
  async (req: Request<{ hotelId: string }>, res: Response) => {
    try {
      const rooms = await prisma.room.findMany({
        where: {
          hotelId: req.params.hotelId,
        },
        include: {
          bookings: {
            select: {
              checkIn: true,
              checkOut: true,
              status: true,
            },
          },
        },
      });

      return res.json(rooms);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch rooms" });
    }
  }
);

/**
 * @swagger
 * /api/rooms/{id}:
 *   put:
 *     summary: Update room details
 *     tags: [Rooms]
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
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [STANDARD, DELUXE, SUITE]
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Room updated successfully
 */
router.put("/:id", requireAuth, async (req: any, res: Response) => {
  try {
    const validatedData = updateRoomSchema.parse(req.body);

    // Verify room ownership
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: { hotel: true },
    });

    if (!room || room.hotel.ownerId !== req.user!.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updatedRoom = await prisma.room.update({
      where: { id: req.params.id },
      data: {
        ...(validatedData.type && { type: validatedData.type as RoomType }),
        ...(validatedData.price && { price: validatedData.price }),
      },
    });

    return res.json(updatedRoom);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update room" });
  }
});

export default router;