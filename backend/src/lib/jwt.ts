import type { SignOptions } from "jsonwebtoken";

export interface JWTPayload {
    id: string;
    username: string;
}

export const tokenOptions: SignOptions = {
    expiresIn: "7d",
};
