import mongoose from "mongoose";
const OtpVerificationSchema = new mongoose.Schema({
    mobileNumber: {
        type: String,
        required: true,
        index: true,
    },
    otp: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // TTL index
    },
}, { timestamps: true });
export default mongoose.model("OtpVerification", OtpVerificationSchema);
