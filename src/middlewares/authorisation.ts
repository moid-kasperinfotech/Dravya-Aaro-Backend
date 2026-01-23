import jwt from "jsonwebtoken";
import User from "../models/Users/User.js";
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