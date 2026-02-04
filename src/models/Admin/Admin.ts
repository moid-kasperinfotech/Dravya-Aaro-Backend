import mongoose, { Document, Model } from "mongoose";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env.js";

export interface IAdmin extends Document {
    adminId: string;
    name: string;
    email: string;
    mobileNumber: string;
    password: string;
    role: string;
    permissions: string[];
    isActive: boolean;
    lastLoginAt: Date;
    createdAt: Date;

    generateAuthToken(): string;
}

const adminSchema = new mongoose.Schema<IAdmin>({
    adminId: {
        type: String,
        unique: true,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    mobileNumber: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    
    role: {
        type: String,
        enum: ["super_admin", "admin", "manager", "support"],
        default: "admin",
    },
    
    // Permissions
    permissions: [String], // e.g., ["manage_jobs", "manage_technicians", "manage_inventory"]
    
    isActive: {
        type: Boolean,
        default: true,
    },
    
    lastLoginAt: Date,
    
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

adminSchema.methods.generateAuthToken = function () {
    return jwt.sign({ id: this._id, role: "admin", adminRole: this.role }, ENV.JWT_SECRET, {
        expiresIn: "7d",
    });
};

adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });

const Admin: Model<IAdmin> = mongoose.model<IAdmin>("Admin", adminSchema);
export default Admin;
