import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    jobId: {
        type: String,
        unique: true,
        required: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
    },
    technicianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Technician",
        default: null,
    },
    status: {
        type: String,
        enum: ["pending", "assigned", "in_progress", "completed", "cancelled", "on_hold"],
        default: "pending",
    },
    serviceType: {
        type: String,
        required: true, // e.g., "RO Installation", "Filter Replacement"
    },
    price: {
        type: Number,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    coordinates: {
        latitude: Number,
        longitude: Number,
    },
    scheduledTime: {
        type: Date,
        required: true,
    },
    completedTime: {
        type: Date,
        default: null,
    },
    quotationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quotation",
        default: null,
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
        default: null,
    },
    warranty: {
        startDate: Date,
        endDate: Date,
        type: String, // "6_months", "1_year", etc.
    },
    problemDescription: {
        type: String,
        default: null,
    },
    selectedProblems: [String], // e.g., ["Low water flow", "Beeping sound"]
    
    // Photo documentation
    beforePhotos: [String], // URLs
    afterPhotos: [String], // URLs
    
    // Timeline tracking
    createdAt: {
        type: Date,
        default: Date.now,
    },
    assignedAt: {
        type: Date,
        default: null,
    },
    cancelledAt: {
        type: Date,
        default: null,
    },
    cancellationReason: {
        type: String,
        default: null,
    },
    
    // SLA and metrics
    slaBreached: {
        type: Boolean,
        default: false,
    },
    rating: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rating",
        default: null,
    },
    notes: {
        type: String,
        default: null,
    },
}, { timestamps: true });

jobSchema.index({ customerId: 1, status: 1 });
jobSchema.index({ technicianId: 1, status: 1 });
jobSchema.index({ scheduledTime: 1 });

const Job = mongoose.model("Job", jobSchema);
export default Job;
