import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { PrismaClient } from "@prisma/client";
const router = express.Router();
const prisma = new PrismaClient();
/**
 * @swagger
 * /api/hotels:
 *   post:
 *     summary: Register a new hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Hotel created successfully
 */
router.post("/", requireAuth, async (req, res) => {
    try {
        const { name, location, images } = req.body;
        const hotelCode = Math.random().toString(36).substring(2, 8);
        const hotel = await prisma.hotel.create({
            data: {
                name,
                location,
                hotelCode,
                images: images || [],
                ownerId: req.user.id,
            },
        });
        res.status(201).json(hotel);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create hotel" });
    }
});
/**
 * @swagger
 * /api/hotels:
 *   get:
 *     summary: Get all hotels
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of hotels
 */
router.get("/", async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const hotels = await prisma.hotel.findMany({
            skip,
            take: limit,
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        const total = await prisma.hotel.count();
        res.json({
            hotels,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                perPage: limit,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch hotels" });
    }
});
/**
 * @swagger
 * /api/hotels/{id}:
 *   get:
 *     summary: Get hotel by ID
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hotel details
 *       404:
 *         description: Hotel not found
 */
router.get("/:id", async (req, res) => {
    try {
        const hotel = await prisma.hotel.findUnique({
            where: { id: req.params.id },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                rooms: true,
            },
        });
        if (!hotel) {
            return res.status(404).json({ error: "Hotel not found" });
        }
        res.json(hotel);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch hotel" });
    }
});
export default router;
