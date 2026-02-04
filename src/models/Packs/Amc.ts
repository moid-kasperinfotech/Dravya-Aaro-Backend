import mongoose from "mongoose";

const amcSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["Silver", "Gold", "Platinum"],
        required: true,
        unique: true,
    },
    mostPopular: {
        type: Boolean,
        default: false,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    discountPrice: {
        type: Number,
    },
    duration: {
        number: {
            type: Number,
            required: true,
        },
        unit: {
            type: String,
            enum: ["Months", "Years"],
            required: true,
        },
    },
    includedFeatures: {
        type: [String],
    },
    excludedFeatures: {
        type: [String],
    },
    additionalBenefits: {
        type: [String],
    },
    services: {
        number: {
            type: Number,
            required: true,
        },
        unit: {
            type: String,
            enum: ["Months", "Years"],
            required: true,
        },
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model("Amc", amcSchema);