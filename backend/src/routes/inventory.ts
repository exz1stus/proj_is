import { Router } from "express";
import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../middleware/auth.ts";
import { convertCurrency, isSupportedCurrency } from "../lib/currency.ts";
import type {
    InventoryItemWithTotal,
    InventorySummaryResponse,
} from "../types.ts";

const router = Router();

// All inventory routes require authentication
router.use(requireAuth);

// ---------------------------------------------------------------------------
// GET /api/inventory/search
// ---------------------------------------------------------------------------
router.get("/search", async (req: Request, res: Response) => {
    try {
        const {
            name,
            location,
            displayCurrency,
            minPrice,
            maxPrice,
            page = "1",
            limit = "10",
        } = req.query as Record<string, string | undefined>;

        // Validate required displayCurrency
        if (!displayCurrency) {
            res.status(400).json({
                message: "displayCurrency query param is required",
            });
            return;
        }

        if (!isSupportedCurrency(displayCurrency)) {
            res.status(400).json({
                message: `Unsupported currency: ${displayCurrency}`,
            });
            return;
        }

        const currentPage = Math.max(1, parseInt(page ?? "1", 10));
        const pageSize = Math.min(
            100,
            Math.max(1, parseInt(limit ?? "10", 10)),
        );
        const skip = (currentPage - 1) * pageSize;

        // Build Prisma where clause
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = {};

        if (name) {
            where.name = { contains: name, mode: "insensitive" };
        }

        if (location) {
            where.location = { contains: location, mode: "insensitive" };
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) {
                where.price = { ...where.price, gte: parseFloat(minPrice) };
            }
            if (maxPrice !== undefined) {
                where.price = { ...where.price, lte: parseFloat(maxPrice) };
            }
        }

        // Fetch paginated items + total count + full set for summary (parallel)
        const [paginatedItems, totalItems, allItems] = await Promise.all([
            prisma.inventoryItem.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { updatedAt: "desc" },
            }),
            prisma.inventoryItem.count({ where }),
            // For the summary we need ALL matching items (not just the page)
            prisma.inventoryItem.findMany({ where }),
        ]);

        // Build per-item totals for the paginated result
        const items: InventoryItemWithTotal[] = paginatedItems.map(
            (item: any) => {
                const price = Number(item.price);
                const totalValueBase = price * item.quantity;
                const totalValueTarget = convertCurrency(
                    totalValueBase,
                    item.currency,
                    displayCurrency,
                );

                return {
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    minStockLevel: item.minStockLevel,
                    price,
                    currency: item.currency,
                    location: item.location,
                    updatedAt: item.updatedAt,
                    totalValueBase,
                    totalValueTarget,
                    targetCurrency: displayCurrency.toUpperCase(),
                };
            },
        );

        // Summary calculations over ALL matching items
        let totalValueSum = 0;
        let lowStockAlerts = 0;

        for (const item of allItems) {
            const price = Number(item.price);
            const baseValue = price * item.quantity;
            totalValueSum += await convertCurrency(
                baseValue,
                item.currency,
                displayCurrency,
            );

            if (item.quantity < item.minStockLevel) {
                lowStockAlerts++;
            }
        }

        const response: InventorySummaryResponse = {
            items,
            pagination: {
                totalItems,
                currentPage,
                totalPages: Math.ceil(totalItems / pageSize),
            },
            summary: {
                totalItemsCount: totalItems,
                totalValueSum: Math.round(totalValueSum * 100) / 100,
                lowStockAlerts,
                targetCurrency: displayCurrency.toUpperCase(),
            },
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Inventory search error:", error);
        res.status(500).json({ message: "Server error fetching inventory" });
    }
});

// ---------------------------------------------------------------------------
// POST /api/inventory
// ---------------------------------------------------------------------------
router.post("/", async (req: Request, res: Response) => {
    try {
        const { name, quantity, minStockLevel, price, currency, location } =
            req.body as {
                name?: string;
                quantity?: number;
                minStockLevel?: number;
                price?: number;
                currency?: string;
                location?: string;
            };

        if (
            name === undefined ||
            quantity === undefined ||
            minStockLevel === undefined ||
            price === undefined ||
            currency === undefined ||
            location === undefined
        ) {
            res.status(400).json({
                message:
                    "name, quantity, minStockLevel, price, currency, and location are all required",
            });
            return;
        }

        if (!isSupportedCurrency(currency)) {
            res.status(400).json({
                message: `Unsupported currency: ${currency}`,
            });
            return;
        }

        if (quantity < 0) {
            res.status(400).json({ message: "quantity must be non-negative" });
            return;
        }

        if (price < 0) {
            res.status(400).json({ message: "price must be non-negative" });
            return;
        }

        const item = await prisma.inventoryItem.create({
            data: {
                name,
                quantity,
                minStockLevel,
                price: price,
                currency: currency.toUpperCase(),
                location,
            },
        });

        res.status(201).json({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            minStockLevel: item.minStockLevel,
            price: Number(item.price),
            currency: item.currency,
            location: item.location,
            updatedAt: item.updatedAt,
        });
    } catch (error) {
        console.error("Inventory create error:", error);
        res.status(500).json({
            message: "Server error creating inventory item",
        });
    }
});

// ---------------------------------------------------------------------------
// PUT /api/inventory/:id
// ---------------------------------------------------------------------------
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, quantity, minStockLevel, price, currency, location } =
            req.body as Partial<{
                name: string;
                quantity: number;
                minStockLevel: number;
                price: number;
                currency: string;
                location: string;
            }>;

        // Check item exists
        const existing = await prisma.inventoryItem.findUnique({
            where: { id },
        });
        if (!existing) {
            res.status(404).json({ message: "Item not found" });
            return;
        }

        if (currency !== undefined && !isSupportedCurrency(currency)) {
            res.status(400).json({
                message: `Unsupported currency: ${currency}`,
            });
            return;
        }

        if (quantity !== undefined && quantity < 0) {
            res.status(400).json({ message: "quantity must be non-negative" });
            return;
        }

        if (price !== undefined && price < 0) {
            res.status(400).json({ message: "price must be non-negative" });
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name;
        if (quantity !== undefined) updateData.quantity = quantity;
        if (minStockLevel !== undefined)
            updateData.minStockLevel = minStockLevel;
        if (price !== undefined) updateData.price = price;
        if (currency !== undefined)
            updateData.currency = currency.toUpperCase();
        if (location !== undefined) updateData.location = location;

        const updated = await prisma.inventoryItem.update({
            where: { id },
            data: updateData,
        });

        res.status(200).json({
            id: updated.id,
            name: updated.name,
            quantity: updated.quantity,
            minStockLevel: updated.minStockLevel,
            price: Number(updated.price),
            currency: updated.currency,
            location: updated.location,
            updatedAt: updated.updatedAt,
        });
    } catch (error) {
        console.error("Inventory update error:", error);
        res.status(500).json({
            message: "Server error updating inventory item",
        });
    }
});

// ---------------------------------------------------------------------------
// DELETE /api/inventory/:id
// ---------------------------------------------------------------------------
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const existing = await prisma.inventoryItem.findUnique({
            where: { id },
        });
        if (!existing) {
            res.status(404).json({ message: "Item not found" });
            return;
        }

        await prisma.inventoryItem.delete({ where: { id } });

        res.status(200).json({ success: true, id });
    } catch (error) {
        console.error("Inventory delete error:", error);
        res.status(500).json({
            message: "Server error deleting inventory item",
        });
    }
});

export default router;
