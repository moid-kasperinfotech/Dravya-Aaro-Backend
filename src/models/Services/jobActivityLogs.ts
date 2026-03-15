import mongoose from "mongoose";

const jobActivityLogSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    actorType: {
      type: String,
      enum: ["user", "technician", "admin", "system"],
      required: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Could reference User, Technician, or Admin — polymorphic
    },

    event: {
      type: String,
      enum: [
        // Job lifecycle
        "job_created",
        "job_assigned",
        "technician_on_way",
        "technician_reached",
        "job_started",
        "job_completed",
        "job_cancelled",
        "job_rescheduled",
        "job_disputed",

        // Service-level
        "service_started",
        "service_completed",
        "service_marked_incomplete",
        "service_next_visit",

        // OTP
        "otp_sent",
        "otp_verified",
        "otp_failed",
        "otp_expired",
        "otp_force_verified", // admin bypass

        // Reschedule
        "reschedule_requested",
        "reschedule_approved",
        "reschedule_rejected",

        // Reassign
        "reassign_requested",
        "reassign_approved",
        "reassign_rejected",
        "reassign_completed",

        // Cancellation
        "cancellation_requested",
        "cancellation_approved",
        "cancellation_rejected",

        // Quotation
        "quotation_created",
        "quotation_approved",
        "quotation_rejected",
        "quotation_expired",
        "quotation_revised",

        // Payment
        "payment_received",
        "payment_collected_cash",
        "payment_collected_online",
        "refund_initiated",
        "refund_completed",

        // Admin
        "admin_contacted",
        "admin_decision_made",
        "admin_note_added",
      ],
      required: true,
      index: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    note: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
);

jobActivityLogSchema.index({ jobId: 1, createdAt: 1 });
jobActivityLogSchema.index({ event: 1, createdAt: -1 });
jobActivityLogSchema.index({ actorType: 1, actorId: 1, createdAt: -1 });

const JobActivityLog = mongoose.model("JobActivityLog", jobActivityLogSchema);
export default JobActivityLog;