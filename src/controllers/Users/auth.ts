import User from "../../models/Users/User.js";
import { sendOTP } from "../../middlewares/sendSms.js";
import bcrypt from "bcryptjs";
import OtpVerification from "../../models/Users/OtpVerification.js";
import { Request, Response, NextFunction } from "express";
import Technician from "../../models/Technician/Technician.js";

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { mobileNumber } = req.body;
        if (!mobileNumber) {
            return res.status(400).json({
                message: "Missing required field (mobileNumber)",
            });
        }
        const mobileStr = String(mobileNumber || "");

        const mobileRegex = /^[1-9]\d{9}$/;
        if (!mobileRegex.test(mobileStr)) {
            return res.status(400).json({ message: "Invalid mobile number" });
        }

        // validate mobile duplicate
        // const existingUser = await User.findOne({ mobileNumber: mobileStr });
        // if (existingUser) {
        //     return res.status(409).json({
        //         message: "Mobile number already exists, please use a another one",
        //     });
        // }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const isTechnicianLogin = req.originalUrl.includes("/technician/");
            
        await OtpVerification.findOneAndUpdate({ mobileNumber: mobileStr }, {
            mobileNumber: mobileStr,
            otp,
            role: isTechnicianLogin ? "technician" : "user",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
        }, { upsert: true, new: true });
        console.log("Generated OTP:", otp);
        // 5. Send OTP (SMS / WhatsApp)
        await sendOTP(mobileNumber, otp);
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            otp: process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" ? otp : "***",
        });
    }
    catch (err) {
        return next(err);
    }
};
export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { mobileNumber, otp } = req.body || {};
        if (!req.body) {
            return res.status(400).json({ success: false, message: "Invalid request body" });
        }
        // Validate input
        if (!mobileNumber || !otp) {
            return res
                .status(400)
                .json({ message: "Mobile number and OTP are required" });
        }
        const mobileStr = String(mobileNumber || "");
        // Validate mobile number format
        const mobileRegex = /^[1-9]\d{9}$/;
        if (!mobileRegex.test(mobileStr)) {
            return res.status(400).json({ message: "Invalid mobile number" });
        }
        // Validate OTP format
        const otpStr = String(otp);
        if (!/^\d{6}$/.test(otpStr)) {
            return res.status(400).json({ message: "OTP must be a 6 digit number" });
        }

        const isTechnicianLogin = req.originalUrl.includes("/technician/");

        const record = await OtpVerification.findOne({ mobileNumber: mobileStr, role: isTechnicianLogin ? "technician" : "user" });
        if (!record) {
            return res.status(401).json({ message: "OTP expired or not found" });
        }
        const isOtpValid = await bcrypt.compare(otpStr, record.otp);
        if (!isOtpValid) {
            return res.status(401).json({ message: "Invalid OTP" });
        }
        // Create user if didn't exist after verification
        let user;
        if (isTechnicianLogin) {
            user = await Technician.findOne({ mobileNumber: mobileStr });
        } else {
            user = await User.findOne({ mobileNumber: mobileStr });
        }

        if (!user) {
            if (isTechnicianLogin) {
                const technicianId = `TECH-${Date.now()}`;
                user = await Technician.create({
                    mobileNumber: mobileStr,
                    technicianId,
                });
            } else {
                const userId = `USER-${Date.now()}`;
                user = await User.create({
                    mobileNumber: mobileStr,
                    userId,
                });
            }
        }
        // Remove temp record
        await OtpVerification.deleteOne({ mobileNumber: mobileStr, role: isTechnicianLogin ? "technician" : "user" });
        // Generate JWT AFTER verification
        const token = user.generateAuthToken();
        res.cookie(isTechnicianLogin ? "techToken" : "token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: "lax",
            path: "/",
        });
        const userObj = user.toObject();
        return res.status(!user ? 201 : 200).json({
            success: true,
            message: "OTP verified successfully, user registered",
            user: userObj,
        });
    }
    catch (err) {
        return next(err);
    }
};