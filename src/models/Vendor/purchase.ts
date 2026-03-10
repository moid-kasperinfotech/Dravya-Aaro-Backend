import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPurchase extends Document {
  vendorId: mongoose.Types.ObjectId;

  productName: string;
  brand: string;
  category: string;
  warrantyPeriod: string;

  quantity: number;
  unitPrice: number;
  taxPercent: number;
  additionalCharge: number;

  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;

  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  paidAt?: Date;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    brand: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
    },

    warrantyPeriod: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    taxPercent: {
      type: Number,
      required: true,
      min: 0,
    },

    additionalCharge: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      index: true,
    },

    amountPaid: {
      type: Number,
      default: 0,
    },

    remainingAmount: {
      type: Number,
      required: true,
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PARTIAL", "PAID"],
      default: "UNPAID",
    },

    paidAt: Date,

    notes: String,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/* ---------- INDEXES ---------- */

purchaseSchema.index({ vendorId: 1, createdAt: -1 });
purchaseSchema.index({ paymentStatus: 1 });
purchaseSchema.index({ category: 1 });
purchaseSchema.index({ createdAt: -1 });

purchaseSchema.index({
  productName: "text",
  brand: "text",
});

const Purchase = (mongoose.models.Purchase as Model<IPurchase>) || mongoose.model<IPurchase>("Purchase", purchaseSchema);
export default Purchase;
