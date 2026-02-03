import mongoose from "mongoose";

const serviceProcessSchema = new mongoose.Schema({
    stepNumber: Number,
    title: String,
    description: String,
}, { _id: false });

const serviceSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: true,
        unique: true,
    },
    serviceCategory: {
        type: String,
        enum: ["home", "industry"],
        default: "home",
    },
    serviceType: {
        type: String,
        required: true,
        // e.g., "installation", "repair", "maintenance", "replacement"
    },
    price: {
        type: Number,
        required: true,
    },
    duration: {
        type: Number, // in minutes
        required: true,
    },
    description: String,
    serviceProcess: [serviceProcessSchema],
    
    // What's included
    whatsIncluded: [String],
    
    // FAQ
    faq: [{
        question: String,
        answer: String,
    }],
    
    // Service image/photo
    serviceImage: String,
    
    // Specifications
    specifications: {
        compatibleBrands: [String],
        applicableProducts: [String],
    },
    
    isActive: {
        type: Boolean,
        default: true,
    },
    isPopular: {
        type: Boolean,
        default: false,
    },
    
    // Metrics
    totalBookings: {
        type: Number,
        default: 0,
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    reviewCount: {
        type: Number,
        default: 0,
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

serviceSchema.index({ serviceName: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ serviceType: 1 });

const Service = mongoose.model("Service", serviceSchema);
export default Service;
