import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true,
        unique: true
    },
    services: {
        type: [mongoose.Types.ObjectId],
        ref: "Service",
        required: true,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
    },
    technicianId: {
        type: mongoose.Types.ObjectId,
        ref: "Technician",
        required: true,
    },
    jobName: {
        type: String,
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
        type: Object,
        startTime: {
            type: Date,
            required: true
        },
        duration: {
            type: Number,
            required: true,
            default: 0
        },
        required: true
    },
    payment: {
        type: String,
        enum: ["paid", "unpaid"],
        required: true,
        default: "unpaid"
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0
    },
    totalDuration: {
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
    },
    status: {
        type: String,
        enum: ["pending", "assigned", "reached", "in_progress", "completed", "cancelled", "rescheduled", "fullAndPaid"],
        required: true,
        default: "pending"
    },

    cancelReason: {
        reason: {
            type: String,
            required: true
        },
        additionalInfo: {
            type: String,
            required: true
        }
    },

    rescheduled: {
        preferredDateByTechnician: {
            type: Date,
            required: true
        }, 
        reason: {
            type: String,
            required: true
        },
        additionalInfo: {
            type: String,
            required: true
        }
    },

    steps: {
        type: [Object],
        required: true,
        default: []
    },

    ratingByTechnician: {
        rating: {
            type: Number,
            required: true,
            min: 0,
            max: 5
        },
        additionalComment: {
            type: String,
            required: true
        }
    }
}, { timestamps: true });

const Job = mongoose.model("Job", jobSchema);

export default Job;