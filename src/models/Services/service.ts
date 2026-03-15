import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    serviceId: {
      type: String,
      required: true,
      unique: true,
      default: () => `SERV-${Date.now()}`,
    },
    type: {
      type: String,
      enum: ["repair", "installation", "uninstallation", "relocation"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["home", "industry"],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    gstRate: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
      default: 0,
    },
    duration: {
      count: {
        type: Number,
        required: true,
        min: 15, // Minimum 15 minutes
        default: 60,
      },
      unit: {
        type: String,
        enum: ["minutes", "hours"],
        default: "minutes",
      },
    },
    images: [
      {
        url: String,
        public_id: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    // Service details
    process: [
      {
        step: Number,
        title: { type: String, required: true },
        description: String,
        estimatedTime: Number, // in minutes
      },
    ],
    includes: [
      {
        title: String,
        description: String,
        isOptional: { type: Boolean, default: false },
      },
    ],
    // What customers need to know
    prerequisites: [
      {
        title: String,
        description: String,
      },
    ],
    frequentlyAskedQuestions: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "coming_soon"],
      default: "active",
      index: true,
    },
    markAsPopular: {
      type: Boolean,
      default: false,
      index: true,
    },
    // SEO & Meta
    meta: {
      title: String,
      description: String,
      keywords: [String],
    },
    // Reviews & Rating
    rating: {
      average: { type: Number, min: 0, max: 5, default: 0 },
      count: { type: Number, default: 0 },
      distribution: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 },
      },
    },
    // Warranty
    warranty: {
      provided: { type: Boolean, default: false },
      period: Number, // in days
      description: String,
    },
    // Analytics
    totalBookings: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance
serviceSchema.index({ status: 1, category: 1, type: 1 });
serviceSchema.index({ price: 1 });
serviceSchema.index({ "rating.average": -1 });
serviceSchema.index({ markAsPopular: 1, status: 1 });

// Virtual for formatted duration
serviceSchema.virtual("durationInHours").get(function () {
  if (!this.duration || typeof this.duration.count !== 'number') {
    return "0h 0m";
  }
  return `${Math.floor(this.duration.count / 60)}h ${this.duration.count % 60}m`;
});

const Service = mongoose.model("Service", serviceSchema);
export default Service;
