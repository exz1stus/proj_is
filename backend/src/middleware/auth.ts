// src/middleware/auth.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JWTPayload } from "../lib/jwt.js";
import ENV from "../env.js";

export interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
}

export function requireAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): void {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({
            message: "Missing or malformed Authorization header",
        });
        return;
    }

    const token = authHeader.slice(7);

    try {
        const payload = jwt.verify(token, ENV.JWT_SECRET) as JWTPayload;
        req.user = payload;
        next();
    } catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
}
