import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { applicationBucketSchema, deviceSchema, notificationSchema } from "./Schemas.js";
const userSchema = new mongoose.Schema({
    mobileNumber: {
        type: String, // ✅ use String (not Number) to preserve leading 0s
        required: [true, "Mobile number is required"],
        match: [/^[1-9]\d{9}$/, "Please enter a valid 10-digit mobile number"],
        unique: true,
    },
    devices: {
        type: [deviceSchema],
        default: [],
    },
}, { timestamps: true });

userSchema.index({ "devices.deviceId": 1, "devices.platform": 1 }, {
    unique: true,
    partialFilterExpression: {
        "devices.deviceId": { $type: "string" },
        "devices.platform": { $type: "string" },
    },
});

// Generate JWT
userSchema.methods.generateAuthToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};
// Generate OTP
userSchema.methods.generateOtp = function () {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
};
const User = mongoose.model("User", userSchema);
export default User;
