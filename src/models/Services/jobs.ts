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
        default: null,
    },
    jobName: {
        type: String,
        required: true,
    },
    brandName: {
        type: String,
        required: true,
    },
    modelType: {
        type: String,
        require: true,
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
        type: {
            url: {
                type: String,
                required: true
            },
            public_id: {
                type: String,
                required: true
            }
        },
        required: false
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
        type: {
            reason: {
                type: String,
                required: true
            },
            additionalInfo: {
                type: String,
                required: true
            }
        },
        required: false
    },

    rescheduled: {
        type: {
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
        required: false
    },

    steps: {
        type: [Object],
        required: true,
        default: []
    },

    ratingByTechnician: {
        type: {
            rating: {
                type: Number,
                required: true,
                min: 0,
                max: 5
            },
            additionalComment: {
                type: String,
                required: true
            },
        },
        required: false
    },

    // Payment & Refund Fields
    paymentStatus: {
        type: String,
        enum: ["unpaid", "prepaid", "cash_collection", "collected", "refunded"],
        default: "unpaid"
    },
    paidAt: {
        type: Date,
        default: null
    },
    shouldRefundAt: {
        type: Date,
        default: null
    },
    
    // Job Type (service, relocation, installation)
    jobType: {
        type: String,
        enum: ["service", "relocation", "installation"],
        default: "service"
    },

    // For relocation: from and to addresses
    addresses: [{
        location: {
            type: String,
            enum: ["primary", "secondary"],
            default: "primary"
        },
        address: {
            house_apartment: String,
            street_sector: String,
            landmark: String,
            fullName: String,
            mobileNumber: String,
            city: String,
            state: String
        }
    }],

    // OTP & Step Tracking for multi-step jobs (1-4)
    currentOtpStep: {
        type: Number,
        default: 0
    },
    stepStatuses: {
        uninstall: {
            started: { type: Boolean, default: false },
            startedAt: Date,
            completed: { type: Boolean, default: false },
            completedAt: Date
        },
        install: {
            started: { type: Boolean, default: false },
            startedAt: Date,
            completed: { type: Boolean, default: false },
            completedAt: Date
        }
    },

    // Reschedule Request Management
    rescheduleRequest: {
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: null
        },
        requestedBy: {
            type: String,
            enum: ["technician", "user", "admin"],
            default: null
        },
        reason: String,
        requestedAt: Date,
        requestedDate: Date,
        approvedBy: {
            type: String,
            enum: ["user", "admin"],
            default: null
        },
        approvedAt: Date
    },
    rescheduleAttempts: {
        type: Number,
        default: 0
    },

    // Reassign Request Management (technician or customer requests reassignment to new technician)
    reassignRequest: {
        status: {
            type: String,
            enum: ["pending", "completed", "rejected"],
            default: null
        },
        requestedBy: {
            type: String,
            enum: ["technician", "user", "admin"],
            default: null
        },
        originalTechnicianId: {
            type: mongoose.Types.ObjectId,
            ref: "Technician",
            default: null
        },
        requestedTechnicianId: {
            type: mongoose.Types.ObjectId,
            ref: "Technician",
            default: null
        },
        reason: String,
        requestedAt: Date,
        approvedBy: {
            type: String,
            enum: ["user", "admin"],
            default: null
        },
        approvedAt: Date
    },
    reassignAttempts: {
        type: Number,
        default: 0
    },

    // Cancellation Request Management
    cancellationRequest: {
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: null
        },
        requestedBy: {
            type: String,
            enum: ["technician", "user", "admin"],
            default: null
        },
        reason: String,
        requestedAt: Date,
        refundType: {
            type: String,
            enum: ["full", "partial", "none"],
            default: "none"
        },
        refundAmount: {
            type: Number,
            default: 0
        },
        approvedBy: {
            type: String,
            enum: ["user", "admin"],
            default: null
        },
        approvedAt: Date
    },

    // Admin Contact & Decision
    adminContactRequired: {
        type: Boolean,
        default: false
    },
    adminContactedAt: {
        type: Date,
        default: null
    },
    adminDecision: {
        type: String,
        enum: ["refund", "reschedule"],
        default: null
    },

    // Payment Collection (for non-prepaid jobs)
    paymentCollectionStatus: {
        type: String,
        enum: ["not_collected", "pending", "collected"],
        default: "not_collected"
    },
    collectedAt: {
        type: Date,
        default: null
    },
    collectionDeadline: {
        type: Date,
        default: null
    },

    // Tracking timestamps
    assignedAt: {
        type: Date,
        default: null
    },

    // Quotation Reference
    quotationId: {
        type: mongoose.Types.ObjectId,
        ref: "Quotation",
        default: null
    }
}, { timestamps: true });

const Job = mongoose.model("Job", jobSchema);

export default Job;