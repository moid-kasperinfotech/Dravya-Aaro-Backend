import mongoose from "mongoose";
import SearviceReview from "./Rating.js";

const serviceSchema = new mongoose.Schema({
    searviceName: {
        type: String,
        enum: ["Installation", "Uninstallation", "Relocation", "Full", "Softener", "Repair"],
        required: true,
    },
    type: {
        type: String,
        enum: ["Home", "Industrial"],
        required: true,
    },
    price: {
        type: String,
        required: true,
    },
    rating: {
        type: [SearviceReview],
        default: [],
    }
}, {
    timestamps: true,
});

serviceSchema.index({ searviceName: 1, type: 1 }, { unique: true });

export default mongoose.model("Service", serviceSchema);