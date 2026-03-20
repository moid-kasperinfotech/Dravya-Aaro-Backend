import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    serviceId: {
        type: String,
        ref: "Service",
        required: true,
    },
    userId: {
        type: String,
        ref: "User",
        required: true,
    },
    jobId: {
        type: String,
        ref: "Job",
        required: true,
    },
    technicianId: {
        type: String,
        ref: "Technician",
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    likes: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

reviewSchema.index({ serviceId: 1 });
reviewSchema.index({ userId: 1 });

const ServiceReview = mongoose.model("ServiceReview", reviewSchema);

export default ServiceReview;