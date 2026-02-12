import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true,
        unique: true
    },
    services: {
        type: [String],
        ref: "Service",
        required: true,
    },
    userId: {
        type: String,
        ref: "User",
        required: true,
    },
    technitcianId: {
        type: String,
        ref: "Technician",
        required: true,
    },
    brandName: {
        type: String,
        required: true,
    },
    problems: {
        type: [String],
        required: true,
        default: []
    },
    remarkByUser: {
        type: String,
        required: true,
    },
    imageByUser: {
        url: {
            type: String,
            required: true
        },
        public_id: {
            type: String,
            required: true
        }
    },
    preferredDate: {
        startTime: {
            type: Date,
            required: true
        },
        duration: {
            type: Number,
            required: true,
            default: 0
        }
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0
    },

    address: {
        house_apartment: {
            type: String,
            required: true
        },
        street_sector: {
            type: String,
            required: true
        },
        landmark: {
            type: String,
            required: true
        },
        fullName: {
            type: String,
            required: true
        },
    }
}, { timestamps: true });

const Job = mongoose.model("Job", jobSchema);

export default Job;