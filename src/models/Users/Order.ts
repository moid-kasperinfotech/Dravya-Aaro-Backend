import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    searviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
    },
    brandName: {
        type: String,
        required: true,
    },
    modelType: {
        type: String,
        required: true,
    },
    remark: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    problems: {
        type: [String],
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "delivered", "cancelled"],
        default: "pending",
    },
    preferedDate: {
        type: Date,
        required: true,
    },
    preferredTime: {
        start: {
            type: Date,
            required: true,
        },
        end: {
            type: Date,
            required: true,
        }
    },
    address: {
        location: {
            type: String,
            required: true,
        },
        houseOrApartment: {
            type: String,
            required: true,
        },
        nearbyLandmark: {
            type: String,
        },
        type: {
            type: String,
            enum: ["Home", "Office", "Other"],
            required: true,
        }
    },
    UserName: {
        type: String,
        required: true,
    },
    mobileNumber: {
        type: String,
        required: true,
        match: [/^\d{10}$/, "Please enter a valid 10 digit mobile number"],
    },
    files: {
        url: {
            type: String,
            required: true,
        },
        fileId: {
            type: String,
            required: true,
        },
    },
    paymentFiles: {
        url: {
            type: String,
            require: true,
        },
        fileId: {
            type: String,
            require: true,
        },
    }
}, {
    timestamps: true,
});