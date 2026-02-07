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

OtpVerificationSchema.pre("findOneAndUpdate", async function (next) {
    const update = this.getUpdate();

    if (update.otp) {
        update.otp = await bcrypt.hash(update.otp.toString(), 10);
    }

    next();
});

export default mongoose.model("OtpVerification", OtpVerificationSchema);
