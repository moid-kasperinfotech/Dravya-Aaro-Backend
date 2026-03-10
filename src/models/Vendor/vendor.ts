import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVendor extends Document {
  purchaseId: mongoose.Types.ObjectId;

  vendorName: string;

  contactPerson: {
    name: string;
    phoneNumber: string;
    email: string;
  };

  address: {
    addressLine: string;
    state: string;
    city: string;
    pinCode: string;
  };

  productCategories: string[];

  bankingInfo?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };

  additionalNotes?: string;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      index: true,
    },

    vendorName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    contactPerson: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phoneNumber: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
    },

    address: {
      addressLine: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
        index: true,
      },
      city: {
        type: String,
        required: true,
        index: true,
      },
      pinCode: {
        type: String,
        required: true,
      },
    },

    productCategories: [String],

    bankingInfo: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
    },

    additionalNotes: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Text search index
vendorSchema.index({
  vendorName: "text",
  "contactPerson.name": "text",
});

// Compound index for filtering
vendorSchema.index({ state: 1, city: 1 });

// Unique email index (optional - agar duplicate allow nahi karna)
vendorSchema.index({ "contactPerson.email": 1 }, { unique: true });

const Vendor = (mongoose.models.Vendor as Model<IVendor>) || mongoose.model<IVendor>("Vendor", vendorSchema);
export default Vendor;
