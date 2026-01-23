import User from "../../models/Users/User.js";
import { sendOTP } from "../../middlewares/sendSms.js";
import bcrypt from "bcryptjs";
import OtpVerification from "../../models/Users/OtpVerification.js";
export const login = async (req, res, next) => {
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
        // Hash OTP before saving
        const hashedOtp = await bcrypt.hash(otp, 10);
        await OtpVerification.findOneAndUpdate({ mobileNumber: mobileStr }, {
            mobileNumber: mobileStr,
            otp: hashedOtp,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
        }, { upsert: true, new: true });
        console.log("Generated OTP:", otp);
        // 5. Send OTP (SMS / WhatsApp)
        await sendOTP(mobileNumber, otp);
        res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            otp: process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" ? otp : "***",
        });
    }
    catch (err) {
        next(err);
    }
};
export const verifyOtp = async (req, res, next) => {
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
        const record = await OtpVerification.findOne({ mobileNumber: mobileStr });
        if (!record) {
            return res.status(401).json({ message: "OTP expired or not found" });
        }
        const isOtpValid = await bcrypt.compare(otpStr, record.otp);
        if (!isOtpValid) {
            return res.status(401).json({ message: "Invalid OTP" });
        }
        // Create user if didn't exist after verification
        const user = await User.findOne({ mobileNumber: mobileStr });
        if (!user) {
            await User.create({
                mobileNumber: mobileStr,
            });
        }
        // Remove temp record
        await OtpVerification.deleteOne({ mobileNumber: mobileStr });
        // Generate JWT AFTER verification
        const token = user.generateAuthToken();
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: "lax",
            path: "/",
        });
        const userObj = user.toObject();
        res.status(!user ? 201 : 200).json({
            success: true,
            message: "OTP verified successfully, user registered",
            user: userObj,
        });
    }
    catch (err) {
        next(err);
    }
};