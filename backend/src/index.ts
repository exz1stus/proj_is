// src/index.ts
import express from "express";
import ENV from "./env.js";
import authRouter from "./routes/auth.js";
import inventoryRouter from "./routes/inventory.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/inventory", inventoryRouter);

app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
    res.status(404).json({ message: "Route not found" });
});

const PORT = Number(ENV.PORT);
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
