import mongoose from "mongoose";

const jobOtpVerificationSchema = new mongoose.Schema({
    otpId: {
        type: String,
        required: true,
    },
    jobId: {
        type: mongoose.Types.ObjectId,
        ref: "Job",
        required: true,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        required: true,
        default: "pending"
    },
}, { timestamps: true });

jobOtpVerificationSchema.index({ otpId: 1, jobId: 1 }, { unique: true });

const JobOtpVerification = mongoose.model("JobOtpVerification", jobOtpVerificationSchema);

export default JobOtpVerification;