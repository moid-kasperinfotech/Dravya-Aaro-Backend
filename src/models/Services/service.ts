import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    serviceId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: [
        "installation",
        "uninstallation",
        "installation-uninstallation",
        "repair",
      ],
      required: true,
    },
    category: {
      type: String,
      enum: ["home", "industry"],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    taxRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 18,
    },
    duration: {
      count: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        enum: ["minute"],
        required: true,
        default: "minute",
      },
    },
    image: {
      url: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
    process: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],
    includes: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],
    frequentlyAskedQuestions: [
      {
        question: {
          type: String,
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      required: true,
      default: "active",
    },
    markAsPopular: {
      type: Boolean,
      default: false,
    },
    requiredQuotation: {
      type: Boolean,
      default: false,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceReview",
      },
    ],
    avgRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    ratingDistribution: {
      type: Object,
      default: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    },
  },
  { timestamps: true, versionKey: false },
);

serviceSchema.index({ status: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ type: 1 });
serviceSchema.index({ name: 1 });

const Service = mongoose.model("Service", serviceSchema);

export default Service;
