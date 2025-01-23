import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { PrismaClient } from "@prisma/client";
import { CreateHotelRequest } from "../types/index.js";
import { z } from "zod";

const router = express.Router();
const prisma = new PrismaClient();

const createHotelSchema = z.object({
  name: z.string(),
  location: z.string(),
  description: z.string(),
  rules: z.object({
    maxGuestsPerRoom: z.number().optional(),
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional(),
    cancellationPolicy: z.string().optional(),
    allowedAgeGroups: z.object({
      min: z.number(),
      max: z.number()
    }).optional(),
    maxBookingsPerUser: z.number().optional(),
    customRules: z.array(z.string()).optional()
  }).optional(),
  images: z.array(z.string()).optional()
});

type CreateHotelBody = z.infer<typeof createHotelSchema>;

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
router.post("/", requireAuth, async (req: express.Request, res) => {
  try {
    const body = createHotelSchema.parse(req.body) as CreateHotelBody;
    const hotelCode = generateUniqueHotelCode();
    
    const hotel = await prisma.hotel.create({
      data: {
        name: body.name,
        location: body.location,
        description: body.description,
        hotelCode,
        images: body.images || [],
        rules: body.rules || {},
        owner: {
          connect: {
            id: (req as any).user!.id
          }
        }
      },
      include: {
        owner: true,
        managers: true
      }
    });

    res.status(201).json(hotel);
  } catch (error) {
    console.error("Error creating hotel:", error);
    res.status(400).json({ error: "Failed to create hotel" });
  }
});

function generateUniqueHotelCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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
router.get("/", async (req: any, res) => {
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
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch hotel" });
  }
});

export default router; 