import { User } from "@prisma/client";

export interface Session {
  user?: User;
  expires: Date;
}

export interface AuthConfig {
  secret: string;
  trustHost: boolean;
  providers: any[];
}

declare module "express-serve-static-core" {
  interface Request {
    session?: Session;
    user?: User;
  }
} 