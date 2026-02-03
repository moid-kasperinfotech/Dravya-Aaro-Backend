import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const technicianSchema = new mongoose.Schema({
    technicianId: {
        type: String,
        unique: true,
        required: true,
    },
    mobileNumber: {
        type: String,
        required: [true, "Mobile number is required"],
        match: [/^[1-9]\d{9}$/, "Please enter a valid 10-digit mobile number"],
        unique: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        // required: true,
        // unique: true,
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"],
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    
    // Professional details
    yearsOfExperience: {
        type: Number,
        required: true,
    },
    organizationName: String,
    skillsExpertise: [String], // e.g., ["RO Installation", "RO Repair", "Water Testing"]
    languagesKnown: [String], // e.g., ["English", "Hindi", "Tamil"]
    
    // Documents & Verification
    documents: {
        aadhaar: {
            frontSideurl: String,
            backSideurl: String,
            verified: { type: Boolean, default: false },
            uploadedAt: Date,
        },
        panCard: {
            url: String,
            verified: { type: Boolean, default: false },
            uploadedAt: Date,
        },
        drivingLicense: {
            frontSideurl: String,
            backSideurl: String,
            verified: { type: Boolean, default: false },
            uploadedAt: Date,
        },
        vehicleRegistration: {
            frontSideurl: String,
            backSideurl: String,
            verified: { type: Boolean, default: false },
            uploadedAt: Date,
        },
        vehicleImage: {
            frontSideurl: String,
            backSideurl: String,
            verified: { type: Boolean, default: false },
            uploadedAt: Date,
        },
    },
    profilePhoto: String,
    
    // Bank details
    bankDetails: {
        accountHolderName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String,
        branchName: String,
        upiId: String,
    },
    
    // Account status
    registrationStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    
    // Work status
    currentStatus: {
        type: String,
        enum: ["online", "on_job", "offline", "break"],
        default: "offline",
    },
    lastActiveAt: Date,
    currentLocationCoordinates: {
        latitude: Number,
        longitude: Number,
        lastUpdatedAt: Date,
    },
    
    // Performance metrics
    totalJobsCompleted: {
        type: Number,
        default: 0,
    },
    totalEarnings: {
        type: Number,
        default: 0,
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    totalReviews: {
        type: Number,
        default: 0,
    },
    
    // Auto pickup preference
    autoPickupEnabled: {
        type: Boolean,
        default: false,
    },
    maxJobsPerDay: {
        type: Number,
        default: 5,
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
    },
    approvedAt: Date,
    rejectionReason: String,
}, { timestamps: true });

technicianSchema.methods.generateAuthToken = function () {
    return jwt.sign({ id: this._id, role: "technician" }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};

technicianSchema.index({ technicianId: 1 });
technicianSchema.index({ mobileNumber: 1 });
technicianSchema.index({ currentStatus: 1 });
technicianSchema.index({ registrationStatus: 1 });

const Technician = mongoose.model("Technician", technicianSchema);
export default Technician;
