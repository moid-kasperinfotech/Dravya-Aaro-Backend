import mongoose from "mongoose";

const jobCartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },

    serviceList: [
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
      },
    ],

    totalQuantity: {
      type: Number,
      default: 0,
    },

    servicePriceTotal: {
      type: Number,
      default: 0,
    },

    gstTax: {
      type: Number,
      default: 0,
    },

    payableAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, versionKey: false },
);

jobCartSchema.index({ userId: 1 });
jobCartSchema.index({ userId: 1, "serviceList.serviceId": 1 });

const JobCart = mongoose.model("JobCart", jobCartSchema);

export default JobCart;
