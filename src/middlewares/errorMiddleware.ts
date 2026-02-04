import { Request, Response, NextFunction } from "express";

export class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

// Error Handler Middleware
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
    console.error("❌ Error Handler:", err);
    let statusCode = err.status || 500;
    let message = err.message || "Internal Server Error";
    // Handle Mongoose Validation Error
    if (err.name === "ValidationError" && err.errors) {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((val: any) => val.message)
            .join(", ");
    }
    // Handle Duplicate Key Error (unique fields like email, Aadhaar)
    if (err.code === 11000 && err.keyValue) {
        statusCode = 409;
        const field = Object.keys(err.keyValue);
        message = `Duplicate value for field: ${field}. Please use another one.`;
    }
    // Handle CastError (invalid MongoDB ObjectId)
    if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
        console.log(err);
        let message = "Invalid file type";
        
        return res.status(400).json({
            success: false,
            message,
        });
    }
    return res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" ? err.stack : undefined,
    });
}
