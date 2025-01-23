import { AuthConfig } from "../types/auth.js";
import GitHub from "@auth/express/providers/github";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET must be set in environment variables");
}

export const authConfig: AuthConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
  ],
}; 