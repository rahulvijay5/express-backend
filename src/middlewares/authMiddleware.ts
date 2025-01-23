import { Request, Response, NextFunction } from "express";
import { getSession } from "@auth/express";
import { authConfig } from "../config/auth.config.js";

export async function authSession(
  req: any,
  res: Response,
  next: NextFunction
) {
  const session = await getSession(req, authConfig);
  res.locals.session = session;
  next();
}

export async function requireAuth(
  req: any,
  res: Response,
  next: NextFunction
) {
  const session = res.locals.session ?? (await getSession(req, authConfig));
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = session.user;
  next();
}

export async function optionalAuth(
  req: any,
  res: Response,
  next: NextFunction
) {
  const session = res.locals.session ?? (await getSession(req, authConfig));
  if (session?.user) {
    req.user = session.user;
  }
  next();
}
