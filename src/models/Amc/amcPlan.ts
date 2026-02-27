import mongoose from "mongoose";

const amcPlanSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      required: true,
      trim: true,
      enum: ["silver", "gold", "platinum"],
    },

    planDescription: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    duration: {
      value: {
        type: Number,
        required: true,
        default: 12,
        min: 0,
      },
      unit: {
        type: String,
        required: true,
        enum: ["months", "years"],
        default: "months",
      },
    },

    // plan benefits
    planBenefits: {
      scheduledService: {
        type: String,
        required: true,
      },
      sparePartsIncluded: {
        type: Boolean,
        required: true,
      },
      emergencyVisits: {
        type: Boolean,
        required: true,
      },
      remoteSupport: {
        type: Boolean,
        required: true,
      },
      priorityService: {
        type: Boolean,
        required: true,
      },
      extendedWarranty: {
        type: Boolean,
        required: true,
      },
    },

    // plan features
    includedPlanFeatures: [String],
    excludedPlanFeatures: [String],

    // additional benefits
    additionalBenefits: [String],
    excludedBenefits: [String],

    isPopular: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // terms and conditions
    termsAndConditions: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

amcPlanSchema.index({ planName: 1, isActive: 1 });

const AMCPlan = mongoose.model("AMCPlan", amcPlanSchema);

export default AMCPlan;
