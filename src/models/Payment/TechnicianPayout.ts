import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentHistory {
  amount: number;
  date: Date;
  method: "bank_transfer" | "cash" | "check" | "upi";
  transactionId?: string;
  notes?: string;
  processedBy: mongoose.Types.ObjectId;
}

export interface ITechnicianPayout extends Document {
  technicianId: mongoose.Types.ObjectId;
  period: {
    type: "week" | "month" | "custom";
    startDate: Date;
    endDate: Date;
    frequency: "weekly" | "bi-weekly" | "monthly";
  };
  earnings: {
    totalFromJobs: number;
    commission: number;
    deductions: number;
    total: number;
  };
  payments: {
    alreadyPaid: number;
    pending: number;
    netPayable: number;
  };
  status: "pending" | "paid" | "on-hold";
  paymentHistory: IPaymentHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const paymentHistorySchema = new Schema<IPaymentHistory>(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    method: {
      type: String,
      enum: ["bank_transfer", "cash", "check", "upi"],
      required: true,
    },
    transactionId: String,
    notes: String,
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { _id: false }
);

const technicianPayoutSchema = new Schema<ITechnicianPayout>(
  {
    technicianId: {
      type: Schema.Types.ObjectId,
      ref: "Technician",
      required: true,
      index: true,
    },
    period: {
      type: {
        type: String,
        enum: ["week", "month", "custom"],
        required: true,
      },
      startDate: {
        type: Date,
        required: true,
        index: true,
      },
      endDate: {
        type: Date,
        required: true,
        index: true,
      },
      frequency: {
        type: String,
        enum: ["weekly", "bi-weekly", "monthly"],
        default: "weekly",
      },
    },
    earnings: {
      totalFromJobs: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      commission: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      deductions: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      total: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
    },
    payments: {
      alreadyPaid: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      pending: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      netPayable: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
    },
    status: {
      type: String,
      enum: ["pending", "paid", "on-hold"],
      default: "pending",
      index: true,
    },
    paymentHistory: [paymentHistorySchema],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

technicianPayoutSchema.index({ technicianId: 1, "period.startDate": -1 });
technicianPayoutSchema.index({ status: 1, "period.startDate": -1 });

const TechnicianPayout = mongoose.model<ITechnicianPayout>(
  "TechnicianPayout",
  technicianPayoutSchema
);

export default TechnicianPayout;
