import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema(
  {
    quotationId: {
      type: String,
      required: true,
      unique: true,
    },
    jobId: {
      type: mongoose.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    technicianId: {
      type: mongoose.Types.ObjectId,
      ref: "Technician",
      default: null,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Line items breakdown
    lineItems: [
      {
        itemId: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        category: {
          type: String,
          enum: ["part", "labor", "custom_charge"],
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
        warranty: {
          duration: Number, // in months
          type: String,
          expiresAt: Date,
        },
        notes: String,
      },
    ],

    // Pricing breakdown
    pricingBreakdown: {
      subTotal: {
        type: Number,
        required: true,
        default: 0,
      },
      gst: {
        type: Number,
        required: true,
        default: 0,
      },
      gstPercentage: {
        type: Number,
        default: 18,
      },
      discount: {
        type: Number,
        default: 0,
      },
      discountPercentage: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        required: true,
        default: 0,
      },
    },

    // Status tracking
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
      index: true,
    },

    // Validity & expiry
    validityDays: {
      type: Number,
      default: 7,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },

    // Approval tracking
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: String, // "user" or "admin"
      enum: ["user", "admin"],
      default: null,
    },

    // Rejection tracking
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: String,
      enum: ["user", "admin"],
      default: null,
    },
    rejectionReason: String,

    // Admin notes and terms
    adminNotes: String,
    termsAndConditions: String,
    customDescription: String,

    // Payment reference (optional)
    paymentReference: String,

    // Photo documentation (before/after from technician)
    photoDocumentation: [
      {
        type: {
          type: String,
          enum: ["before", "after"],
        },
        url: String,
        public_id: String,
        uploadedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

// Create indexes for fast queries
quotationSchema.index({ jobId: 1, status: 1 });
quotationSchema.index({ userId: 1, createdAt: -1 });
quotationSchema.index({ expiresAt: 1 });

const Quotation = mongoose.model("Quotation", quotationSchema);

export default Quotation;
