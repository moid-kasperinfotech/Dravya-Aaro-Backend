import Admin from "../../models/Admin/Admin.js";
import bcrypt from "bcryptjs";

export const adminRegister = async (req, res, next) => {
    try {
        const { name, email, mobileNumber, password, role = "admin" } = req.body;

        // Validation
        if (!name || !email || !mobileNumber || !password) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(409).json({
                success: false,
                message: "Email already registered",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate admin ID
        const adminId = `ADM-${Date.now()}`;

        const newAdmin = new Admin({
            adminId,
            name,
            email,
            mobileNumber,
            password: hashedPassword,
            role,
            permissions: ["manage_jobs", "manage_technicians", "manage_inventory"],
        });

        await newAdmin.save();

        const token = newAdmin.generateAuthToken();

        res.status(201).json({
            success: true,
            message: "Admin registered successfully",
            adminId,
            token,
        });
    } catch (err) {
        next(err);
    }
};

export const adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password required",
            });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                message: "Admin account is inactive",
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Update last login
        admin.lastLoginAt = new Date();
        await admin.save();

        const token = admin.generateAuthToken();

        res.cookie("adminToken", token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            adminId: admin.adminId,
            token,
        });
    } catch (err) {
        next(err);
    }
};

export const adminLogout = async (req, res, next) => {
    try {
        res.clearCookie("adminToken");
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (err) {
        next(err);
    }
};

export const getAdminProfile = async (req, res, next) => {
    try {
        const admin = await Admin.findById(req.adminId).select("-password");
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        res.status(200).json({
            success: true,
            admin,
        });
    } catch (err) {
        next(err);
    }
};
