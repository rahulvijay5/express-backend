import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";
const router = Router();
const prisma = new PrismaClient();
// Validation schemas
const createRoomSchema = z.object({
    hotelId: z.string(),
    roomNumber: z.string(),
    type: z.enum(["STANDARD", "DELUXE", "SUITE"]),
    price: z.number().positive(),
});
const updateRoomSchema = z.object({
    type: z.enum(["STANDARD", "DELUXE", "SUITE"]).optional(),
    price: z.number().positive().optional(),
});
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
router.post("/", requireAuth, async (req, res) => {
    try {
        const validatedData = createRoomSchema.parse(req.body);
        // Verify hotel ownership
        const hotel = await prisma.hotel.findUnique({
            where: { id: validatedData.hotelId },
        });
        if (!hotel || hotel.ownerId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized" });
        }
        const room = await prisma.room.create({
            data: {
                roomNumber: validatedData.roomNumber,
                type: validatedData.type,
                price: validatedData.price,
                hotelId: validatedData.hotelId,
            },
        });
        return res.status(201).json(room);
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                return res.status(400).json({ error: "Room number already exists in this hotel" });
            }
        }
        return res.status(500).json({ error: "Failed to create room" });
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
router.get("/hotel/:hotelId", async (req, res) => {
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
    }
    catch (error) {
        return res.status(500).json({ error: "Failed to fetch rooms" });
    }
});
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
router.put("/:id", requireAuth, async (req, res) => {
    try {
        const validatedData = updateRoomSchema.parse(req.body);
        // Verify room ownership
        const room = await prisma.room.findUnique({
            where: { id: req.params.id },
            include: { hotel: true },
        });
        if (!room || room.hotel.ownerId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized" });
        }
        const updatedRoom = await prisma.room.update({
            where: { id: req.params.id },
            data: {
                ...(validatedData.type && { type: validatedData.type }),
                ...(validatedData.price && { price: validatedData.price }),
            },
        });
        return res.json(updatedRoom);
    }
    catch (error) {
        return res.status(500).json({ error: "Failed to update room" });
    }
});
export default router;
