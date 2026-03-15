import mongoose from "mongoose";

// Addressess
const AddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    house_apartment: { type: String, required: true },
    street_sector: { type: String, required: true },
    landmark: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false },
);

// Date and Time slot
const TimeSlotSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true }, // 2026-03-15T00:00:00Z
    startTime: { type: Date, required: true }, // 2026-03-15T11:00:00Z
    endTime: { type: Date, required: true }, // 2026-03-15T12:00:00Z
    duration: { type: Number, required: true }, // minutes (e.g. 60)
  },
  { _id: false },
);

const ServiceItemSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    serviceType: {
      type: String,
      enum: ["installation", "uninstallation", "repair", "relocation"],
      required: true,
    },

    serviceName: { type: String, required: true },

    price: { type: Number, required: true, default: 0 },
    duration: { type: Number, required: true, default: 0 }, // minutes

    addressIndex: { type: Number, default: null }, // for installation/repair/uninstall
    fromAddressIndex: { type: Number, default: null }, // for relocation: pickup
    toAddressIndex: { type: Number, default: null }, // for relocation: dropoff

    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "completed",
        "incomplete",
        "next_visit",
        "cancelled",
      ],
      default: "pending",
      required: true,
    },

    // Timestamps for this specific service
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    technicianNote: { type: String, default: "" },
  },
  { _id: true },
);

const OtpStepSchema = new mongoose.Schema(
  {
    step: {
      type: String,
      enum: ["start", "complete"],
      required: true,
    },
    otpRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobOtpVerification",
      default: null,
    },
    verifiedAt: { type: Date, default: null },
  },
  { _id: false },
);

const RequestMetaSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: null,
    },
    requestedBy: {
      type: String,
      enum: ["technician", "user", "admin"],
      default: null,
    },
    reason: { type: String, default: "" },
    requestedAt: { type: Date, default: null },
    approvedBy: {
      type: String,
      enum: ["user", "technician", "admin"],
      default: null,
    },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    note: { type: String, default: "" }, // admin/approver note
  },
  { _id: false },
);

const jobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Technician",
      default: null,
      index: true,
    },

    technicianType: {
      type: String,
      enum: ["prepaid", "salaried", null],
      default: null,
    },

    services: {
      type: [ServiceItemSchema],
      required: true,
      validate: {
        validator: (v: unknown[]) => v.length > 0,
        message: "Job must have at least one service.",
      },
    },

    jobCategory: {
      type: String,
      enum: ["normal", "relocation", "mixed"],
      required: true,
      default: "normal",
    },

    addresses: {
      type: [AddressSchema],
      required: true,
      validate: {
        validator: (v: unknown[]) => v.length >= 1 && v.length <= 2,
        message: "Job must have 1 or 2 addresses.",
      },
    },

    preferredSlot: {
      type: TimeSlotSchema,
      required: true,
    },

    jobName: { type: String, required: true },
    brandName: { type: String, required: true },
    modelType: { type: String, required: true },

    problems: { type: [String], default: [] },
    remarkByUser: { type: String, default: "" },

    imageByUser: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],

    totalPrice: { type: Number, required: true, default: 0 },
    totalDuration: { type: Number, required: true, default: 0 }, // minutes

    paymentMode: {
      type: String,
      enum: ["prepaid", "pay_after"],
      required: true,
      default: "pay_after",
    },
    paymentStatus: {
      type: String,
      enum: [
        "unpaid",
        "prepaid",
        "cash_pending",
        "cash_collected",
        "online_pending",
        "online_collected",
        "refunded",
      ],
      default: "unpaid",
      index: true,
    },

    paidAt: { type: Date, default: null },
    shouldRefundAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },

    // Payment collection (for pay_after jobs)
    paymentCollectionStatus: {
      type: String,
      enum: ["not_applicable", "pending", "collected"],
      default: "not_applicable",
    },
    collectedAt: { type: Date, default: null },
    collectionDeadline: { type: Date, default: null },

    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "technician_on_way",
        "reached",
        "in_progress",
        "payment_pending",
        "completed",
        "cancelled",
        "rescheduled",
        "disputed",
      ],
      required: true,
      default: "pending",
      index: true,
    },

    otpSteps: {
      type: [OtpStepSchema],
      default: [],
    },
    currentOtpStep: { type: Number, default: 0 }, // 0=none, 1=start, 2=complete

    stepStatuses: {
      uninstall: {
        started: { type: Boolean, default: false },
        startedAt: { type: Date, default: null },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
        otpRef: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "JobOtpVerification",
          default: null,
        },
      },
      install: {
        started: { type: Boolean, default: false },
        startedAt: { type: Date, default: null },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
        otpRef: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "JobOtpVerification",
          default: null,
        },
      },
    },

    rescheduleRequest: {
      ...RequestMetaSchema.obj,
      newSlot: { type: TimeSlotSchema, default: null },
    },
    rescheduleAttempts: { type: Number, default: 0 },

    reassignRequest: {
      ...RequestMetaSchema.obj,
      originalTechnicianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Technician",
        default: null,
      },
      newTechnicianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Technician",
        default: null,
      },
    },
    reassignAttempts: { type: Number, default: 0 },

    cancellationRequest: {
      ...RequestMetaSchema.obj,
      cancelledBy: {
        type: String,
        enum: ["technician", "user", "admin", null],
        default: null,
      },
      chargesApply: { type: Boolean, default: false },
      refundType: {
        type: String,
        enum: ["full", "partial", "none"],
        default: "none",
      },
      refundAmount: { type: Number, default: 0 },
    },

    adminContactRequired: { type: Boolean, default: false },
    adminContactedAt: { type: Date, default: null },
    adminDecision: {
      type: String,
      enum: ["refund", "reschedule", "reassign", null],
      default: null,
    },
    adminNote: { type: String, default: "" },

    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      default: null,
    },

    ratingByTechnician: {
      rating: { type: Number, min: 0, max: 5, default: null },
      additionalComment: { type: String, default: "" },
      ratedAt: { type: Date, default: null },
    },

    timeline: {
      assignedAt: { type: Date, default: null },
      technicianOnWayAt: { type: Date, default: null },
      reachedAt: { type: Date, default: null },
      jobStartedAt: { type: Date, default: null },
      jobCompletedAt: { type: Date, default: null },
      cancelledAt: { type: Date, default: null },
      rescheduledAt: { type: Date, default: null },
      paymentCollectedAt: { type: Date, default: null },
      quotationCreatedAt: { type: Date, default: null },
      quotationApprovedAt: { type: Date, default: null },
    },
  },
  { timestamps: true, versionKey: false },
);

jobSchema.index({ userId: 1, createdAt: -1 });
jobSchema.index({ technicianId: 1, status: 1 });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ paymentStatus: 1, paymentMode: 1 });
jobSchema.index({ "preferredSlot.date": 1, status: 1 });
jobSchema.index({ quotationId: 1 });

const Job = mongoose.model("Job", jobSchema);
export default Job;
