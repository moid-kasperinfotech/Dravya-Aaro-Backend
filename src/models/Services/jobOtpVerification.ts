import mongoose from "mongoose";

const jobOtpVerificationSchema = new mongoose.Schema(
  {
    otpId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Technician",
      required: true,
    },

    otp: {
      type: String,
      required: true,
      // Store hashed OTP in production (bcrypt or SHA-256)
      // Never store plain OTP
    },

    otpType: {
      type: String,
      enum: ["start", "complete", "uninstall_start", "install_start"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "verified", "expired", "rejected"],
      required: true,
      default: "pending",
    },

    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },

    expiresAt: {
      type: Date,
      required: true,
    },

    verifiedAt: { type: Date, default: null },
    verifiedBy: {
      type: String,
      enum: ["technician", "admin", null],
      default: null,
    },
  },
  { timestamps: true },
);

jobOtpVerificationSchema.index(
  { jobId: 1, otpType: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  },
);

jobOtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const JobOtpVerification = mongoose.model(
  "JobOtpVerification",
  jobOtpVerificationSchema,
);

export default JobOtpVerification;
