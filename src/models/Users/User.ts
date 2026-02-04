import mongoose, { Document, Model } from "mongoose";
import jwt from "jsonwebtoken";
import { deviceSchema, IDevice } from "./Schemas.js";
import { ENV } from "../../config/env.js";

export interface IUser extends Document {
    mobileNumber: string;
    orders: mongoose.Types.ObjectId[];
    devices: IDevice[];
    generateAuthToken(): string;
    generateOtp(): number;
}

const userSchema = new mongoose.Schema({
    mobileNumber: {
        type: String, // ✅ use String (not Number) to preserve leading 0s
        required: [true, "Mobile number is required"],
        match: [/^[1-9]\d{9}$/, "Please enter a valid 10-digit mobile number"],
        unique: true,
    },
    orders: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Order",
        default: [],
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
    return jwt.sign({ id: this._id }, ENV.JWT_SECRET, {
        expiresIn: "7d",
    });
};
// Generate OTP
userSchema.methods.generateOtp = function () {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
};
const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;
