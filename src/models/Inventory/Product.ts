import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
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
        // e.g., "filters", "membranes", "cartridges", "parts"
    },
    brandName: String,
    modelNumber: String,
    
    // Pricing
    mrp: {
        type: Number,
        required: true,
    },
    costPrice: {
        type: Number,
        required: true,
    },
    sellingPrice: {
        type: Number,
        required: true,
    },
    discount: {
        percentage: Number,
        amount: Number,
    },
    profit: Number,
    
    // Stock management
    stockLevel: {
        type: Number,
        required: true,
        default: 0,
    },
    reorderLevel: {
        type: Number,
        default: 10,
    },
    
    // Specifications
    specifications: {
        materialType: String,
        width: String,
        height: String,
        netWeight: String,
        compatibleProducts: [String],
        filtrationTechnology: String,
        filterLife: String,
        micronRating: String,
        nsfRating: String,
        maxWaterPressure: String,
        operatingTemperature: String,
    },
    
    // Warranty
    warranty: {
        period: String,
        type: String, // "months" or "years"
    },
    
    description: String,
    productImage: String,
    
    isActive: {
        type: Boolean,
        default: true,
    },
    
    // Metrics
    quantitySoldThisMonth: {
        type: Number,
        default: 0,
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ stockLevel: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;
