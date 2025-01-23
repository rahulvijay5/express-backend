import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export const generateToken = (id: number) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: "1d" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};
