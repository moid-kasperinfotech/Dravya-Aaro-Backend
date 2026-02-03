import mongoose from "mongoose";

const amcSubscriptionSchema = new mongoose.Schema({
    subscriptionId: {
        type: String,
        unique: true,
        required: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AMCPlan",
        required: true,
    },
    
    // Product covered
    deviceInfo: {
        brandName: String,
        modelType: String,
        serialNumber: String,
    },
    
    // Dates
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    
    status: {
        type: String,
        enum: ["active", "expired", "cancelled", "pending_renewal"],
        default: "active",
    },
    
    // Services tracking
    totalServicesIncluded: Number,
    servicesUsed: {
        type: Number,
        default: 0,
    },
    serviceHistory: [{
        serviceDate: Date,
        serviceType: String,
        technicianId: mongoose.Schema.Types.ObjectId,
        description: String,
    }],
    
    // Payment info
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
    },
    price: Number,
    
    // Renewal info
    autoRenewal: {
        type: Boolean,
        default: false,
    },
    renewalReminderSent: {
        type: Boolean,
        default: false,
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

amcSubscriptionSchema.index({ customerId: 1, status: 1 });
amcSubscriptionSchema.index({ endDate: 1 });

const AMCSubscription = mongoose.model("AMCSubscription", amcSubscriptionSchema);
export default AMCSubscription;
