import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import app from "./app.js";
dotenv.config();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    process.exit(1);
});
process.on("unhandledRejection", (error) => {
    console.error("Unhandled Rejection:", error);
    process.exit(1);
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
