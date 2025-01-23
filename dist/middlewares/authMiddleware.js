import { getSession } from "@auth/express";
import { authConfig } from "../config/auth.config.js";
export async function authSession(req, res, next) {
    const session = await getSession(req, authConfig);
    res.locals.session = session;
    next();
}
export async function requireAuth(req, res, next) {
    const session = res.locals.session ?? (await getSession(req, authConfig));
    if (!session?.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = session.user;
    next();
}
export async function optionalAuth(req, res, next) {
    const session = res.locals.session ?? (await getSession(req, authConfig));
    if (session?.user) {
        req.user = session.user;
    }
    next();
}
