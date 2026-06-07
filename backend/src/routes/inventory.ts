// src/routes/inventory.ts
import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import type { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../lib/prisma.js";
import { convertCurrency } from "../lib/currency.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import type {
    InventoryItemWithTotal,
    InventorySummaryResponse,
} from "../types.js";

const router = Router();

router.use(requireAuth);

// ─── Schemas ──────────────────────────────────────────────────────────────────

const SearchQuerySchema = z.object({
    name: z.string().optional(),
    location: z.string().optional(),
    displayCurrency: z.string().min(3).max(3).toUpperCase(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
});

const CreateItemSchema = z.object({
    name: z.string().min(1, "name is required"),
    quantity: z.coerce.number().int().nonnegative(),
    minStockLevel: z.coerce.number().int().nonnegative(),
    price: z.coerce.number().nonnegative(),
    currency: z.string().min(3).max(3).toUpperCase().default("USD"),
    location: z.string().min(1, "location is required"),
});

const UpdateItemSchema = CreateItemSchema.partial();

// ─── Helper ───────────────────────────────────────────────────────────────────

type PrismaItem = {
    id: string;
    name: string;
    quantity: number;
    minStockLevel: number;
    price: Decimal;
    currency: string;
    location: string;
    updatedAt: Date;
    createdAt: Date;
};

function toPlain(item: PrismaItem) {
    return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        minStockLevel: item.minStockLevel,
        price: Number(item.price),
        currency: item.currency,
        location: item.location,
        updatedAt: item.updatedAt,
    };
}

// ─── GET /api/inventory/search ────────────────────────────────────────────────

router.get("/search", async (req: AuthenticatedRequest, res: Response) => {
    const parsed = SearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({ message: parsed.error.errors[0].message });
        return;
    }

    const { name, location, displayCurrency, minPrice, maxPrice, page, limit } =
        parsed.data;

    try {
        const where = {
            ...(name && {
                name: { contains: name, mode: "insensitive" as const },
            }),
            ...(location && {
                location: { contains: location, mode: "insensitive" as const },
            }),
            ...(minPrice !== undefined || maxPrice !== undefined
                ? {
                      price: {
                          ...(minPrice !== undefined ? { gte: minPrice } : {}),
                          ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
                      },
                  }
                : {}),
        };

        const [rawPage, totalItems, allRaw] = await Promise.all([
            prisma.inventoryItem.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { updatedAt: "desc" },
            }),
            prisma.inventoryItem.count({ where }),
            prisma.inventoryItem.findMany({ where }),
        ]);

        const items: InventoryItemWithTotal[] = await Promise.all(
            rawPage.map(async (raw) => {
                const plain = toPlain(raw);
                const totalValueBase = plain.price * plain.quantity;
                const totalValueTarget = await convertCurrency(
                    totalValueBase,
                    plain.currency,
                    displayCurrency,
                );
                return {
                    ...plain,
                    totalValueBase,
                    totalValueTarget,
                    targetCurrency: displayCurrency,
                };
            }),
        );

        const lowStockAlerts = allRaw.filter(
            (i) => i.quantity < i.minStockLevel,
        ).length;

        const sumParts = await Promise.all(
            allRaw.map(async (raw) => {
                const plain = toPlain(raw);
                return convertCurrency(
                    plain.price * plain.quantity,
                    plain.currency,
                    displayCurrency,
                );
            }),
        );
        const totalValueSum =
            Math.round(sumParts.reduce((a, b) => a + b, 0) * 100) / 100;

        const response: InventorySummaryResponse = {
            items,
            pagination: {
                totalItems,
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
            },
            summary: {
                totalItemsCount: allRaw.length,
                totalValueSum,
                lowStockAlerts,
                targetCurrency: displayCurrency,
            },
        };

        res.json(response);
    } catch (error) {
        console.error("Inventory search error:", error);
        res.status(500).json({ message: "Failed to fetch inventory" });
    }
});

// ─── POST /api/inventory ──────────────────────────────────────────────────────

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
    const parsed = CreateItemSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: parsed.error.errors[0].message });
        return;
    }

    try {
        const item = await prisma.inventoryItem.create({ data: parsed.data });
        res.status(201).json(toPlain(item));
    } catch (error) {
        console.error("Create inventory item error:", error);
        res.status(500).json({ message: "Failed to create inventory item" });
    }
});

// ─── PUT /api/inventory/:id ───────────────────────────────────────────────────

router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
    const id = String(req.params["id"]);

    const parsed = UpdateItemSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: parsed.error.errors[0].message });
        return;
    }
    if (Object.keys(parsed.data).length === 0) {
        res.status(400).json({ message: "No fields provided for update" });
        return;
    }

    try {
        const existing = await prisma.inventoryItem.findUnique({
            where: { id },
        });
        if (!existing) {
            res.status(404).json({ message: "Item not found" });
            return;
        }

        const updated = await prisma.inventoryItem.update({
            where: { id },
            data: parsed.data,
        });
        res.json(toPlain(updated));
    } catch (error) {
        console.error("Update inventory item error:", error);
        res.status(500).json({ message: "Failed to update inventory item" });
    }
});

// ─── DELETE /api/inventory/:id ────────────────────────────────────────────────

router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
    const id = String(req.params["id"]);

    try {
        const existing = await prisma.inventoryItem.findUnique({
            where: { id },
        });
        if (!existing) {
            res.status(404).json({ message: "Item not found" });
            return;
        }

        await prisma.inventoryItem.delete({ where: { id } });
        res.json({ success: true, id });
    } catch (error) {
        console.error("Delete inventory item error:", error);
        res.status(500).json({ message: "Failed to delete inventory item" });
    }
});

export default router;
