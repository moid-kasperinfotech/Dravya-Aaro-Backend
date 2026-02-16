import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    serviceId: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ["installation-uninstallation", "repair"],
        required: true,
    },
    category: {
        type: String,
        enum: ["home", "industry"],
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    price: {
        type: String,
        required: true,
        match: [/^\d+$/, "Please enter a valid integer price"]
    },
    duration: {
        count: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            enum: ["minute"],
            required: true,
            default: "minute"
        }
    },
    image: {
        url: {
            type: String
        },
        public_id: {
            type: String
        }
    },
    process: [
        {
            title: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            },
        }
    ],
    includes: [
        {
            title: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            }
        }
    ],
    frequentlyAskedQuestions: [
        {
            question: {
                type: String,
                required: true
            },
            answer: {
                type: String,
                required: true
            }
        }
    ],
    status: {
        type: String,
        enum: ["active", "inactive"],
        required: true,
        default: "active"
    },
    markAsPopular: {
        type: Boolean,
        default: false
    },
    reviews: {
        avg: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        },
        overview: {
            five: { type: Number, default: 0 },
            four: { type: Number, default: 0 },
            three: { type: Number, default: 0 },
            two: { type: Number, default: 0 },
            one: { type: Number, default: 0 },
        }
    },
}, { timestamps: true });

serviceSchema.index({ status: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ type: 1 });
serviceSchema.index({ name: 1 });

const Service = mongoose.model("Service", serviceSchema);

export default Service;