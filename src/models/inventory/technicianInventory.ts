import mongoose from "mongoose";

const technicianInventorySchema = new mongoose.Schema(
  {
    technicianId: {
      type: mongoose.Types.ObjectId,
      ref: "Technician",
      required: true,
      index: true,
    },

    productId: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    remarks: {
      type: String,
    },
  },
  { timestamps: true, versionKey: false },
);

technicianInventorySchema.index(
  { technicianId: 1, productId: 1 },
  { unique: true },
);

export const TechnicianInventory = mongoose.model(
  "TechnicianInventory",
  technicianInventorySchema,
);

const technicianInventoryLogSchema = new mongoose.Schema(
  {
    technicianId: {
      type: mongoose.Types.ObjectId,
      ref: "Technician",
      required: true,
      index: true,
    },

    productId: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    type: {
      type: String,
      enum: ["ISSUED", "RETURNED", "USED"],
      required: true,
      index: true,
    },

    issuedBy: {
      type: mongoose.Types.ObjectId,
      ref: "Admin",
    },

    serviceId: {
      type: mongoose.Types.ObjectId,
      ref: "Service",
    },

    returnAt: Date,

    remarks: {
      type: String,
    },
  },
  { timestamps: true, versionKey: false },
);

export const TechnicianInventoryLog = mongoose.model(
  "TechnicianInventoryLog",
  technicianInventoryLogSchema,
);
