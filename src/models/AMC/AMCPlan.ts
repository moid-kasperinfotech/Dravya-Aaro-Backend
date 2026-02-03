import mongoose from "mongoose";

const amcPlanSchema = new mongoose.Schema({
    planName: {
        type: String,
        required: true,
        enum: ["silver", "gold", "platinum"],
    },
    price: {
        type: Number,
        required: true,
    },
    duration: {
        value: {
            type: Number,
            default: 12,
        },
        unit: {
            type: String,
            enum: ["months", "years"],
            default: "months",
        },
    },
    
    // Plan benefits
    scheduledServices: Number, // e.g., 2, 4, unlimited
    sparePartsIncluded: {
        type: Boolean,
        default: true,
    },
    emergencyVisits: {
        type: Boolean,
        default: false,
    },
    remoteSupport: {
        type: Boolean,
        default: false,
    },
    priorityService: {
        type: Boolean,
        default: false,
    },
    extendedWarranty: {
        type: Boolean,
        default: false,
    },
    
    // Additional benefits
    additionalBenefits: [String], // e.g., "Dedicated account manager", "Maintenance reports"
    excludedBenefits: [String],
    
    description: String,
    
    isActive: {
        type: Boolean,
        default: true,
    },
    isMostPopular: {
        type: Boolean,
        default: false,
    },
    
    // Validity & Terms
    validityInfo: String,
    termsAndConditions: String,
    
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

amcPlanSchema.index({ planName: 1 });
amcPlanSchema.index({ isActive: 1 });

const AMCPlan = mongoose.model("AMCPlan", amcPlanSchema);
export default AMCPlan;
