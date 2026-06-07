import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    // Demo user
    const passwordHash = await bcrypt.hash("password123", 10);
    await prisma.user.upsert({
        where: { username: "admin" },
        update: {},
        create: { username: "admin", passwordHash },
    });

    // Sample inventory items
    const items = [
        {
            name: "Bezprzewodowa mysz",
            quantity: 3,
            minStockLevel: 5,
            price: 25.0,
            currency: "USD",
            location: "Magazyn A, Regał 2",
        },
        {
            name: "Klawiatura Mechaniczna",
            quantity: 15,
            minStockLevel: 5,
            price: 80.0,
            currency: "USD",
            location: "Magazyn B",
        },
        {
            name: 'Monitor 27"',
            quantity: 8,
            minStockLevel: 3,
            price: 350.0,
            currency: "EUR",
            location: "Magazyn A, Regał 1",
        },
        {
            name: "Kabel USB-C",
            quantity: 2,
            minStockLevel: 10,
            price: 5.5,
            currency: "PLN",
            location: "Magazyn C",
        },
        {
            name: "Laptop Stand",
            quantity: 20,
            minStockLevel: 5,
            price: 45.0,
            currency: "USD",
            location: "Magazyn B, Regał 3",
        },
    ];

    for (const item of items) {
        await prisma.inventoryItem.create({ data: item });
    }

    console.log("Seed complete");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
