import mongoose, { Document, Model } from "mongoose";

export interface IAMCPlan extends Document {
    planName: string;
    price: number;
    duration: {
        value: number;
        unit: string;
    };
    
    // Plan benefits
    scheduledServices: string; // e.g., 2, 4, unlimited
    sparePartsIncluded: boolean;
    emergencyVisits: boolean;
    remoteSupport: boolean;
    priorityService: boolean;
    extendedWarranty: boolean;
    
    // Additional benefits
    additionalBenefits: string[];
    excludedBenefits: string[];
    
    description: string;
    
    isActive: boolean;
    isMostPopular: boolean;
    
    // Validity & Terms
    validityInfo: string;
    termsAndConditions: string;
    
    createdAt: Date;
}

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
    scheduledServices: String, // e.g., 2, 4, unlimited
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

const AMCPlan: Model<IAMCPlan> = mongoose.model<IAMCPlan>("AMCPlan", amcPlanSchema);
export default AMCPlan;
