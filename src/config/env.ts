import dotenv from "dotenv";
dotenv.config();

function requiredEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env: ${name}`);
    return v;
}

export const ENV = {
    PORT: requiredEnv("PORT"),
    NODE_ENV: requiredEnv("NODE_ENV"),
    CLOUDINARY_API_KEY: requiredEnv("CLOUDINARY_API_KEY"),
    CLOUDINARY_API_SECRET: requiredEnv("CLOUDINARY_API_SECRET"),
    CLOUDINARY_CLOUD_NAME: requiredEnv("CLOUDINARY_CLOUD_NAME"),
    DBURI: requiredEnv("DBURI"),
    FIREBASE_SERVICE_ACCOUNT_BASE64: requiredEnv("FIREBASE_SERVICE_ACCOUNT_BASE64"),
    WEB_URL: requiredEnv("WEB_URL"),
    JWT_SECRET: requiredEnv("JWT_SECRET"),
}