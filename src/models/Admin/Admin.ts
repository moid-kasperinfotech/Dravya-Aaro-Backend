import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const adminSchema = new mongoose.Schema({
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
    return jwt.sign({ id: this._id, role: "admin", adminRole: this.role }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};

adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
