import mongoose from "mongoose";

const amcPlanSubscriptionSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: String,
      required: true,
      unique: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AMCPlan",
      required: true,
    },

    // device details
    deviceInfo: {
      brandName: {
        type: String,
        required: true,
      },
      modelName: {
        type: String,
        required: true,
      },
      serialNumber: {
        type: String,
        required: true,
        unique: true,
      },
    },

    // subscription duration and status
    duration: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },

    status: {
      type: String,
      required: true,
      enum: [
        "active",
        "expired",
        "cancelled",
        "pending_renewal",
        "expiring_soon",
      ],
      default: "active",
    },

    // service details and tracking
    totalServiceIncluded: {
      type: String,
      required: true,
    },

    serviceUsed: {
      type: Number,
      default: 0,
    },

    // service history for tracking past services and technician details
    serviceHistory: [
      {
        serviceDate: {
          type: Date,
        },
        serviceType: {
          type: String,
        },
        technicianId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Technician",
        },
        decsription: {
          type: String,
        },
      },
    ],

    // payment details
    payment: {
      paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
        required: true,
      },

      razorpay: {
        orderId: String,
        paymentId: String,
        signature: String,
        amount: Number,
        currency: String,
      },

      paidAt: Date,
      refundedAt: Date,
      refundedAmount: Number,
      refundedReason: String,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // renewal details
    autoRenewal: {
      type: Boolean,
      default: false,
    },

    renewalReminderSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false },
);

amcPlanSubscriptionSchema.index({ customerId: 1, status: 1, endDate: 1 });

const AMCPlanSubscription = mongoose.model(
  "AMCPlanSubscription",
  amcPlanSubscriptionSchema,
);

export default AMCPlanSubscription;
