import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { ExpressAuth } from "@auth/express";
import { authConfig } from "./config/auth.config.js";
import { swaggerDocument } from "./docs/swagger.js";
import { authSession } from "./middlewares/authMiddleware.js";

// Import routes
import hotelRoutes from "./routes/hotelRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.set("trust proxy", true);

// Auth session middleware
app.use(authSession);

// Auth routes
app.use("/auth/*", ExpressAuth(authConfig));

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes
app.use("/api/hotels", hotelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/rooms", roomRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "server is running" });
});

export default app;
