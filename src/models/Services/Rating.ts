import mongoose from "mongoose";

const serviceReviewSchema = new mongoose.Schema({
    searviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
    },
    rating: {
        type: Number,
        required: true,
    },
    comment: {
        type: String,
        required: true,
    },
    likes: {
        type: Number,
        default: 0,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
});
export default mongoose.model("ServiceReview", serviceReviewSchema);