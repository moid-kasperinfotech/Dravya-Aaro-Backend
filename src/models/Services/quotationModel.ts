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
      default: null,
    },

    // Which service in the job this item belongs to (optional but useful for analytics)
    serviceItemId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    brand: { type: String, default: "" },
    description: { type: String, default: "" },

    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    warranty: {
      period: { type: String, default: "" }, // "6 months", "1 year"
      expiryDate: { type: Date, default: null },
    },
  },
  { _id: true },
);

const quotationSchema = new mongoose.Schema(
  {
    quotationId: {
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

    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Technician",
      required: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [quotationItemSchema],
      default: [],
      validate: {
        validator: (v: unknown[]) => v.length > 0,
        message: "Quotation must have at least one item.",
      },
    },

    // Pricing summary
    partsSubtotal: { type: Number, default: 0 }, // replacement + custom parts
    labourSubtotal: { type: Number, default: 0 }, // labour charges
    additionalCharges: { type: Number, default: 0 }, // misc (travel, disposal, etc.)

    subtotal: { type: Number, default: 0 }, // partsSubtotal + labourSubtotal + additionalCharges

    gst: {
      percentage: { type: Number, default: 18 },
      amount: { type: Number, default: 0 },
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired", "awaiting_service"],
      default: "pending",
      index: true,
    },

    validity: {
      days: { type: Number, default: 1 },
      expiresAt: { type: Date, required: true },
    },

    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "" },

    technicianNotes: { type: String, default: "" }, // visible to customer
    adminNotes: { type: String, default: "" }, // internal only
    terms: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
);

quotationSchema.index({ jobId: 1, status: 1 });
quotationSchema.index({ customerId: 1, createdAt: -1 });
quotationSchema.index({ technicianId: 1, createdAt: -1 });
quotationSchema.index({ status: 1, "validity.expiresAt": 1 }); 

const Quotation = mongoose.model("Quotation", quotationSchema);

export default Quotation;
