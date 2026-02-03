import jwt from "jsonwebtoken";
import User from "../models/Users/User.js";
import Admin from "../models/Admin/Admin.js";
import Technician from "../models/Technician/Technician.js";

export async function authenticateUser(req, res, next) {
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
        req.userId = userId;
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
}

export async function authenticateAdmin(req, res, next) {
    try {
        let token = null;
        if (typeof req.cookies?.adminToken === "string") {
            token = req.cookies.adminToken.trim();
        } else if (typeof req.headers.authorization === "string" &&
            req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.slice(7).trim();
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

        req.adminId = adminId;
        req.admin = admin;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
}

export async function authenticateTechnician(req, res, next) {
    try {
        let token = null;
        if (typeof req.cookies?.techToken === "string") {
            token = req.cookies.techToken.trim();
        } else if (typeof req.headers.authorization === "string" &&
            req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.slice(7).trim();
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

        req.technicianId = technicianId;
        req.technician = technician;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
}