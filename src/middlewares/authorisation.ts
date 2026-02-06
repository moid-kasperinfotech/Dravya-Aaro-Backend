import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/Users/User.js";
import Admin from "../models/Admin/Admin.js";
import Technician from "../models/Technician/Technician.js";
import { Request, Response, NextFunction } from "express";
import { ENV } from "../config/env.js";
import mongoose from "mongoose";

type DecodedToken = JwtPayload & {
    id: string;
    role: string;
}

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
    try {
        // 1. Extract token (cookie FIRST, header optional)
        let token = null;
        if (typeof req.cookies?.token === "string") {
            token = req.cookies.token.trim();
        }
        // else if (typeof req.headers.authorization === "string" &&
        //     req.headers.authorization.startsWith("Bearer ")) {
        //     token = req.headers.authorization.slice(7).trim();
        // }
        if (!token || token === null) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        // 2. Verify token
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        // 3. Type safety on decoded payload
        const userId = decoded && typeof decoded === "object" && typeof decoded.id === "string"
            ? decoded.id
            : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        // 4. Fetch user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        // 5. Attach user and continue
        req.userId = new mongoose.Types.ObjectId(userId);
        req.user = user;
        return next();
    }
    catch (err) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
}

export async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        let token = null;
        if (typeof req.cookies?.adminToken === "string") {
            token = req.cookies.adminToken.trim();
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const decodedRaw = jwt.verify(token, ENV.JWT_SECRET);
        if (typeof decodedRaw === "string") {
            throw new Error("Invalid token payload");
        }

        const decoded = decodedRaw as DecodedToken;
        const adminId = decoded && typeof decoded === "object" && typeof decoded.id === "string"
            ? decoded.id
            : null;

        if (!adminId || decoded.role !== "admin") {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - Admin access required",
            });
        }

        const admin = await Admin.findById(adminId);
        if (!admin || !admin.isActive) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        req.adminId = new mongoose.Types.ObjectId(adminId);
        req.admin = admin;
        return next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
}

export async function authenticateTechnician(req: Request, res: Response, next: NextFunction) {
    try {
        let token = null;
        if (typeof req.cookies?.techToken === "string") {
            token = req.cookies.techToken.trim();
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const decodedRaw = jwt.verify(token, ENV.JWT_SECRET);
        if (typeof decodedRaw === "string") {
            throw new Error("Invalid token payload");
        }
        const decoded = decodedRaw as DecodedToken;
        const technicianId = decoded && typeof decoded === "object" && typeof decoded.id === "string"
            ? decoded.id
            : null;

        if (!technicianId || decoded.role !== "technician") {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - Technician access required",
            });
        }

        const technician = await Technician.findById(technicianId);
        if (!technician || !technician.isActive) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        req.technicianId = new mongoose.Types.ObjectId(technicianId);
        req.technician = technician;
        return next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        let token = null;
        if (typeof req.cookies?.techToken === "string") {
            token = req.cookies.techToken.trim();
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const decodedRaw = jwt.verify(token, ENV.JWT_SECRET);
        if (typeof decodedRaw === "string") {
            throw new Error("Invalid token payload");
        }
        const decoded = decodedRaw as DecodedToken;
        const id = decoded && typeof decoded === "object" && typeof decoded.id === "string"
            ? decoded.id
            : null;

        if (!id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - access required",
            });
        }

        let idInfo;
        if (decoded.role === "admin") {
            idInfo = await Admin.findById(id);
        } else if (decoded.role === "technician") {
            idInfo = await Technician.findById(id);
        } else {
            idInfo = await User.findById(id);
        }
        if (!idInfo || !idInfo.isActive) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (decoded.role === "admin") {
            req.adminId = new mongoose.Types.ObjectId(id);
            req.admin = idInfo;
        } else if (decoded.role === "technician") {
            req.technicianId = new mongoose.Types.ObjectId(id);
            req.technician = idInfo;
        } else {
            req.userId = new mongoose.Types.ObjectId(id);
            req.user = idInfo;
        }
        return next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
}