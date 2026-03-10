import mongoose from "mongoose";

const productImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    // product information
    productName: {
      type: String,
      required: true,
      unique: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
    },

    category: {
      type: String,
      required: true,
    },

    brandName: String,

    modelNumber: {
      type: String,
      required: true,
    },

    modelType: {
      type: String,
      required: true,
    },

    // product pricing
    mrp: {
      type: Number,
      required: true,
      min: 0,
    },

    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      discountPercentage: {
        type: Number,
        min: 0,
        max: 100,
      },
      discountAmount: {
        type: Number,
        min: 0,
      },
    },

    profit: {
      type: Number,
      default: 0,
    },

    taxRate: {
      type: Number,
      min: 0,
    },

    // product stock management
    stockLevel: {
      type: Number,
      required: true,
      default: 0,
    },

    reorderLevel: {
      type: Number,
      default: 10,
    },

    // product Specifications
    specifications: {
      materialType: {
        type: String,
        required: true,
      },

      width: {
        type: String,
        required: true,
      },

      height: {
        type: String,
        required: true,
      },

      netWeight: {
        type: String,
        required: true,
      },

      nsfRating: {
        type: String,
        required: true,
      },
    },

    // product warranty details
    warranty: {
      warrantyPeriod: {
        type: String,
        required: true,
      },
      warrantyType: {
        type: String,
        required: true,
      },
    },

    // product images-- can be multiple images
    productImages: [productImageSchema],

    // product status
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },

    // product metrix for admin
    quantitySoldThisMonth: {
      type: Number,
      default: 0,
    },

    shippingCharge: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: true, versionKey: false },
);

productSchema.index({ productName: 1, isActive: 1 });
productSchema.index({ sku: 1, isActive: 1 });
productSchema.index({ modelNumber: 1, isActive: 1 });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
