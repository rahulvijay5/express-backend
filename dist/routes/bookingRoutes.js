import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { PrismaClient, BookingStatus } from "@prisma/client";
const router = express.Router();
const prisma = new PrismaClient();
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
 *               documents:
 *                 type: object
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post("/", requireAuth, async (req, res) => {
    try {
        const { hotelId, roomId, checkIn, checkOut, documents } = req.body;
        // Check if room is available for the given dates
        const existingBooking = await prisma.booking.findFirst({
            where: {
                roomId,
                status: {
                    in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN],
                },
                OR: [
                    {
                        AND: [
                            { checkIn: { lte: new Date(checkIn) } },
                            { checkOut: { gte: new Date(checkIn) } },
                        ],
                    },
                    {
                        AND: [
                            { checkIn: { lte: new Date(checkOut) } },
                            { checkOut: { gte: new Date(checkOut) } },
                        ],
                    },
                ],
            },
        });
        if (existingBooking) {
            return res.status(400).json({ error: "Room not available for these dates" });
        }
        const booking = await prisma.booking.create({
            data: {
                hotelId,
                roomId,
                userId: req.user.id,
                checkIn: new Date(checkIn),
                checkOut: new Date(checkOut),
                documents: documents || {},
                status: BookingStatus.PENDING,
            },
        });
        res.status(201).json(booking);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create booking" });
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
router.get("/user", requireAuth, async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: {
                userId: req.user.id,
            },
            include: {
                hotel: true,
                room: true,
            },
        });
        res.json(bookings);
    }
    catch (error) {
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
router.put("/:id/status", requireAuth, async (req, res) => {
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
        if (booking.hotel.ownerId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized" });
        }
        const updatedBooking = await prisma.booking.update({
            where: { id: req.params.id },
            data: {
                status: status,
            },
        });
        res.json(updatedBooking);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update booking status" });
    }
});
export default router;
