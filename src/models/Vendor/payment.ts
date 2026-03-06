import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  purchaseId: mongoose.Types.ObjectId;

  amount: number;
  paymentDate: Date;

  paymentMethod: "CASH" | "ONLINE";

  receipt?: {
    url: string;
    publicId: string;
  };

  razorpayDetails?: {
    orderId: string;
    paymentId: string;
    signature: string;
    amount: number;
    currency: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    purchaseId: {
      type: Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["CASH", "ONLINE"],
      required: true,
    },

    receipt: {
      url: String,
      publicId: String,
    },

    razorpayDetails: {
      orderId: String,
      paymentId: String,
      signature: String,
      amount: Number,
      currency: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/* ---------- INDEXES ---------- */

paymentSchema.index({ purchaseId: 1, paymentDate: -1 });
paymentSchema.index({ paymentMethod: 1 });

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
export default Payment;
