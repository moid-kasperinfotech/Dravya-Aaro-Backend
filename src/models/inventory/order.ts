import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    customerId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customerDetails: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      mobileNumber: {
        type: String,
        required: true,
      },
    },

    expectedDeliveryDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "proccessing",
        "delivered",
        "returned",
        "cancelled",
      ],
      default: "pending",
      required: true,
    },

    payment: {
      paymentMethod: {
        type: String,
        enum: ["cash", "online"],
        required: true,
      },
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
    },

    pricing: {
      subTotal: {
        type: Number,
        required: true,
        min: 0,
      },

      shippingCharge: {
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

    orderItems: [
      {
        productId: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        image: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          sellingPrice: {
            type: Number,
            required: true,
            min: 0,
          },
          costPrice: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      },
    ],

    shippingAddress: {
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      landMark: {
        type: String,
      },
    },

    cancelledAt: Date,
    deliveredAt: Date,
    returnedAt: Date,
    returnReason: String,
  },
  { timestamps: true, versionKey: false },
);

orderSchema.index({ customerId: 1, status: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
