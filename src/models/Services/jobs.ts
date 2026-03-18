import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    latitude: {
      type: String,
      required: true,
    },
    longitude: {
      type: String,
      required: true,
    },
    house_apartment: {
      type: String,
      required: true,
    },
    street_sector: {
      type: String,
      required: true,
    },
    landmark: String,
    fullName: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    addressType: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },
  },
  { _id: false },
);

const jobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    technicianId: {
      type: mongoose.Types.ObjectId,
      ref: "Technician",
      default: null,
    },
    // Quotation Reference
    quotationId: {
      type: mongoose.Types.ObjectId,
      ref: "Quotation",
    },

    bookedServices: [
      {
        serviceId: {
          type: mongoose.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        serviceName: {
          type: String,
          required: true,
        },
        serviceType: {
          type: String,
          required: true,
        },
        serviceQuantity: {
          type: Number,
          required: true,
          min: 1,
        },
        servicePrice: {
          type: Number,
          required: true,
          min: 0,
        },
        subTotal: {
          type: Number,
          required: true,
          min: 0,
        },
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed", "incompleted"],
          default: "pending",
        },

        requiredQuotation: {
          type: Boolean,
          default: false,
        },

        subServices: [
          {
            type: {
              type: String,
              enum: ["uninstall", "install"],
            },
            status: {
              type: String,
              enum: ["pending", "in_progress", "completed", "incompleted"],
            },
            startedAt: Date,
            completedAt: Date,
          },
        ],
      },
    ],

    brandName: {
      type: String,
      required: true,
    },
    modelType: {
      type: String,
      require: true,
    },

    problems: {
      type: [String],
      required: true,
      default: [],
    },

    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "reached",
        "in_progress",
        "completed",
        "cancelled",
        "rescheduled",
        "fullAndPaid",
      ],
      required: true,
      default: "pending",
    },

    reachedAt: Date,
    startedAt: Date,
    completedAt: Date,
    closedAt: Date,

    pricing: {
      subTotal: {
        type: Number,
        required: true,
        min: 0,
      },

      gst: {
        type: Number,
        required: true,
        min: 0,
      },

      finalPrice: {
        type: Number,
        required: true,
        min: 0,
      },
    },

    // Payment & Refund Fields
    paymentStatus: {
      status: {
        type: String,
        enum: [
          "unpaid",
          "prepaid",
          "cash_collection",
          "collected",
          "refunded",
          "paid",
        ],
        default: "unpaid",
      },
      paidAt: Date,
      refundAt: Date,
      refundAmount: {
        type: Number,
        default: 0,
      },
      refundType: {
        type: String,
        enum: ["full", "partial", "none"],
        default: "none",
      },
      paymentMethod: {
        type: String,
        enum: ["cash", "online"],
        default: "cash",
      },
      razorpay: {
        orderId: String,
        paymentId: String,
        signature: String,
        amount: Number,
        currency: String,
      },
    },

    // Payment Collection (for non-prepaid jobs)
    paymentCollectionStatus: {
      type: String,
      enum: ["not_collected", "pending", "collected"],
      default: "not_collected",
    },
    collectedAt: Date,
    collectionDeadline: Date,

    stepStatuses: {
      uninstall: {
        started: { type: Boolean, default: false },
        startedAt: Date,
        completed: { type: Boolean, default: false },
        completedAt: Date,
      },
      install: {
        started: { type: Boolean, default: false },
        startedAt: Date,
        completed: { type: Boolean, default: false },
        completedAt: Date,
      },
      repair: {
        started: { type: Boolean, default: false },
        startedAt: Date,
        completed: { type: Boolean, default: false },
        completedAt: Date,
      },
    },

    // for normal services -- installation, uninstallation, repair
    address: addressSchema,

    // for relocation service
    fromAddress: addressSchema,
    toAddress: addressSchema,

    preferredDate: {
      startTime: {
        type: Date,
        required: true,
      },
      endTime: {
        type: Date,
        required: true,
      },
      duration: {
        type: Number,
        required: true,
      },
    },

    imageByUser: [
      {
        url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
      },
    ],

    rescheduled: {
      preferredDate: {
        type: Date,
      },
      reason: String,
      additionalInfo: String,
    },

    // Reschedule Request Management
    rescheduleRequest: {
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: null,
      },
      requestedBy: {
        type: String,
        enum: ["technician", "user", "admin"],
      },
      reason: String,
      additionalInfo: String,
      requestedAt: Date,
      requestedDate: Date,
      approvedBy: {
        type: String,
        enum: ["user", "admin"],
      },
      approvedAt: Date,
    },

    rescheduleAttempts: {
      type: Number,
      default: 0,
    },

    // Reassign Request Management (technician or customer requests reassignment to new technician)
    reassignRequest: {
      status: {
        type: String,
        enum: ["pending", "completed", "rejected"],
        default: null,
      },
      requestedBy: {
        type: String,
        enum: ["technician", "user", "admin"],
        default: null,
      },
      originalTechnicianId: {
        type: mongoose.Types.ObjectId,
        ref: "Technician",
      },
      requestedTechnicianId: {
        type: mongoose.Types.ObjectId,
        ref: "Technician",
        default: null,
      },
      reason: String,
      additionalInfo: String,
      requestedAt: Date,
      approvedBy: {
        type: String,
        enum: ["user", "admin"],
        default: null,
      },
      approvedAt: Date,
    },

    reassignAttempts: {
      type: Number,
      default: 0,
    },

    // Cancellation Request Management
    cancellationRequest: {
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
      reason: String,
      additionalInfo: String,
      cancelledAt: Date,
      requestedAt: Date,
      refundType: {
        type: String,
        enum: ["full", "partial", "none"],
        default: "none",
      },
      refundAmount: {
        type: Number,
        default: 0,
      },
      approvedBy: {
        type: String,
        enum: ["user", "admin"],
        default: null,
      },
      approvedAt: Date,
    },

    // Admin Contact & Decision
    adminContactRequired: {
      type: Boolean,
      default: false,
    },
    adminContactedAt: Date,
    adminDecision: {
      type: String,
      enum: ["refund", "reschedule"],
      default: null,
    },

    ratingByTechnician: {
      rating: {
        type: Number,
        min: 0,
        max: 5,
      },
      additionalComment: {
        type: String,
      },
    },

    steps: {
      type: [Object],
      required: true,
      default: [],
    },

    // Tracking timestamps
    assignedAt: {
      type: Date,
      default: null,
    },

    remarkByUser: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

const Job = mongoose.model("Job", jobSchema);

export default Job;
