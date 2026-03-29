import mongoose from "mongoose";

const quotationItemSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ["custom_part", "replacement_part", "service"],
      required: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    itemName: {
      type: String,
      required: true,
    },

    brand: String,

    description: String,

    quantity: {
      type: Number,
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
      period: String, // "1 year", "6 months"
      expiryDate: Date,
    },
  },
  { _id: false },
);

const quotationSchema = new mongoose.Schema(
  {
    quotationId: {
      type: String,
      unique: true,
      required: true,
    },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    serviceItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Technician",
      required: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [quotationItemSchema],

    // Pricing summary
    partsSubtotal: {
      type: Number,
      default: 0,
    },

    servicesSubtotal: {
      type: Number,
      default: 0,
    },

    additionalCharges: {
      type: Number,
      default: 0,
    },

    subtotal: {
      type: Number,
      default: 0,
    },

    gst: {
      percentage: {
        type: Number,
        default: 18,
      },
      amount: Number,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
    },

    createdBy: {
      type: String,
      enum: ["technician", "admin"],
      default: "technician",
    },

    validity: {
      days: {
        type: Number,
        default: 7,
      },
      expiresAt: Date,
    },

    version: {
      type: Number,
      default: 1,
    },

    isLatest: {
      type: Boolean,
      default: true,
    },

    approvedAt: Date,

    rejectedAt: Date,

    rejectionReason: String,

    notes: String,

    terms: String,
  },
  { timestamps: true, versionKey: false },
);

quotationSchema.index({ jobId: 1, serviceItemId: 1 });
quotationSchema.index({ customerId: 1 });
quotationSchema.index({ status: 1 });
quotationSchema.index({ serviceItemId: 1, isLatest: 1 });

const Quotation = mongoose.model("Quotation", quotationSchema);

export default Quotation;
