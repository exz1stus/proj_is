// src/routes/auth.ts
import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { type JWTPayload, tokenOptions } from "../lib/jwt.js";
import ENV from "../env.js";

const router = Router();

const AuthBodySchema = z.object({
    username: z
        .string({ required_error: "username is required" })
        .min(3, "username must be at least 3 characters"),
    password: z
        .string({ required_error: "password is required" })
        .min(8, "password must be at least 8 characters"),
});

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
    const parsed = AuthBodySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: parsed.error.errors[0].message });
        return;
    }

    const { username, password } = parsed.data;

    try {
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            res.status(409).json({ message: "Username is already taken" });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: { username, passwordHash },
        });

        res.status(201).json({
            message: "User registered successfully!",
            userId: newUser.id,
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Server error during registration" });
    }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
    const parsed = AuthBodySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: parsed.error.errors[0].message });
        return;
    }

    const { username, password } = parsed.data;

    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            res.status(401).json({ message: "Invalid username or password" });
            return;
        }

        const passwordVerified = await bcrypt.compare(
            password,
            user.passwordHash,
        );
        if (!passwordVerified) {
            res.status(401).json({ message: "Invalid username or password" });
            return;
        }

        const token = jwt.sign(
            { id: user.id, username: user.username } as JWTPayload,
            ENV.JWT_SECRET,
            tokenOptions,
        );

        res.status(200).json({
            message: "Login successful!",
            token,
            username: user.username,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
});

export default router;
