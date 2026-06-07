import dotenv from "dotenv";

// dotenv.config();

const ENV = {
    PORT: process.env.PORT ?? "3000",
    JWT_SECRET: process.env.JWT_SECRET ?? "",
    DATABASE_URL: process.env.DATABASE_URL ?? "",
    EXCHANGE_RATE_API_KEY: process.env.EXCHANGE_RATE_API_KEY ?? "",
};

export default ENV;
