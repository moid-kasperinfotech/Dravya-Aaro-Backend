import mongoose, { Document, Model } from "mongoose";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env.js";

export interface ITechnician extends Document {
  technicianId: string;
  mobileNumber: string;
  fullName: string;
  email: string;
  gender: string;
  state: string;
  city: string;
  address: string;
  yearsOfExperience: number;
  organizationNames: string[];
  skillsExpertise: string[];
  languagesKnown: string[];
  documents: {
    aadhaar: {
      frontSideurl: string;
      backSideurl: string;
      verified: boolean;
      uploadedAt: Date;
    };
    panCard: {
      url: string;
      verified: boolean;
      uploadedAt: Date;
    };
    drivingLicense: {
      frontSideurl: string;
      backSideurl: string;
      verified: boolean;
      uploadedAt: Date;
    };
    vehicleRegistration: {
      frontSideurl: string;
      backSideurl: string;
      verified: boolean;
      uploadedAt: Date;
    };
    vehicleImage: {
      frontSideurl: string;
      backSideurl: string;
      verified: boolean;
      uploadedAt: Date;
    };
  };
  profilePhoto: string;
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
  };
  registrationStatus: string;
  isVerified: boolean;
  isActive: boolean;
  currentStatus: string;
  lastActiveAt: Date;
  currentLocationCoordinates: {
    latitude: number;
    longitude: number;
    lastUpdatedAt: Date;
  };
  totalJobsCompleted: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  autoPickupEnabled: boolean;
  maxJobsPerDay: number;
  offDuty: boolean;
  isBlacklisted: boolean;
  blacklistedAt: Date;
  blacklistReason: string;
  pendingPaymentJobs: string[];
  createdAt: Date;
  approvedAt: Date;
  rejectionReason: string;

  generateAuthToken(): string;
}

const technicianSchema = new mongoose.Schema(
  {
    technicianId: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^[1-9]\d{9}$/, "Please enter a valid 10-digit mobile number"],
    },
    fullName: {
      type: String,
    },
    email: {
      type: String,
      // required: true,
      unique: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      // required: true,
    },
    state: {
      type: String,
      // required: true,
    },
    city: {
      type: String,
      // required: true,
    },
    address: {
      type: String,
      // required: true,
    },

    // Professional details
    yearsOfExperience: {
      type: String,
      match: [/^\d+$/, "Years of experience must be a valid number"],
    },
    organizationNames: [String],
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
    },

    // Account status
    registrationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // isVerified: {
    //     type: Boolean,
    //     default: false,
    // },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Work status
    currentStatus: {
      type: String,
      enum: ["available", "on_job", "offline"],
      default: "offline",
    },
    lastActiveAt: Date,
    currentLocationCoordinates: {
      latitude: Number,
      longitude: Number,
      lastUpdatedAt: Date,
    },

    accountType: {
      type: String,
      enum: ["salaried", "freelance"],
      default: "freelance",
    },

    // On-duty/Off-duty status
    offDuty: {
      type: Boolean,
      default: false,
    },

    // Blacklist Management
    isBlacklisted: {
      type: Boolean,
      default: false,
    },
    blacklistedAt: {
      type: Date,
      default: null,
    },
    blacklistReason: {
      type: String,
      default: null,
    },
    pendingPaymentJobs: {
      type: [mongoose.Types.ObjectId],
      ref: "Job",
      default: [],
    },

    // // Performance metrics
    // totalJobsCompleted: {
    //     type: Number,
    //     default: 0,
    // },
    // totalEarnings: {
    //     type: Number,
    //     default: 0,
    // },
    // averageRating: {
    //     type: Number,
    //     default: 0,
    //     min: 0,
    //     max: 5,
    // },
    // totalReviews: {
    //     type: Number,
    //     default: 0,
    // },

    // // Auto pickup preference
    // autoPickupEnabled: {
    //     type: Boolean,
    //     default: false,
    // },
    // maxJobsPerDay: {
    //     type: Number,
    //     default: 5,
    // },

    // createdAt: {
    //     type: Date,
    //     default: Date.now,
    // },
    // approvedAt: Date,
    // rejectionReason: String,
  },
  { timestamps: true },
);

technicianSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id, role: "technician" }, ENV.JWT_SECRET, {
    expiresIn: "7d",
  });
};

technicianSchema.index({ technicianId: 1 });
technicianSchema.index({ mobileNumber: 1 });
technicianSchema.index({ currentStatus: 1 });
technicianSchema.index({ registrationStatus: 1 });

const Technician: Model<ITechnician> = (mongoose.models.Technician as Model<ITechnician>) || mongoose.model<ITechnician>(
  "Technician",
  technicianSchema,
);
export default Technician;
