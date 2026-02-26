import bcrypt from "bcryptjs";
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
    role: {
        type: String,
        required: true,
        default: "user",
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // TTL index
    },
}, { timestamps: true });

OtpVerificationSchema.pre("save", async function () {
    if (!this.isModified("otp")) {
        return;
    }
    // Hash OTP before saving
    const hashedOtp = await bcrypt.hash(this.otp, 10);
    this.otp = hashedOtp;
});

OtpVerificationSchema.pre("findOneAndUpdate", async function () {
    const update = this.getUpdate();
    if (!update) return;
    
    if ("otp" in update && update.otp) {
        update.otp = await bcrypt.hash(update.otp.toString(), 10);
    }

    if ("$set" in update && update.$set?.otp) {
        update.$set.otp = await bcrypt.hash(update.$set.otp.toString(), 10);
    }
});

export default mongoose.model("OtpVerification", OtpVerificationSchema);
