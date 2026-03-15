import mongoose from "mongoose";

const serviceItemSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    name: String,
    type: String,
    category: String,
    price: Number,
    gstRate: Number,
    duration: {
      count: Number,
      unit: String,
    },
    image: {
      url: String,
      public_id: String,
    },
    warranty: {
      provided: Boolean,
      period: Number,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },

    subTotal: {
      type: Number,
      default: 0,
    },
    totalDuration: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const jobCartSchema = new mongoose.Schema(
  {
    cartId: {
      type: String,
      required: true,
      unique: true,
      default: () => `CART-${Date.now()}`,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    serviceItems: [serviceItemSchema],

    summary: {
      totalItems: { type: Number, default: 0 },
      totalQuantity: { type: Number, default: 0 },
      subtotal: { type: Number, default: 0 },
      totalGst: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
      totalDuration: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["active", "checked_out", "abandoned", "expired"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

jobCartSchema.index({ userId: 1, status: 1 });

const JobCart = mongoose.model("JobCart", jobCartSchema);

export default JobCart;
