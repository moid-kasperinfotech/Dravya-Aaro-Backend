import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema({
    quotationId: {
        type: String,
        unique: true,
        required: true,
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        required: true,
    },
    technicianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Technician",
        required: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    
    // Items
    items: [{
        itemType: {
            type: String,
            enum: ["part", "labor", "custom"],
        },
        itemName: String,
        productId: mongoose.Schema.Types.ObjectId,
        description: String,
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number,
    }],
    
    // Pricing breakdown
    partSubtotal: Number,
    laborCharges: Number,
    additionalCharges: Number,
    subtotal: Number,
    gst: {
        percentage: {
            type: Number,
            default: 18,
        },
        amount: Number,
    },
    discount: {
        percentage: Number,
        amount: Number,
    },
    totalAmount: Number,
    
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "expired"],
        default: "pending",
    },
    
    validity: {
        days: {
            type: Number,
            default: 7,
        },
        expiresAt: Date,
    },
    
    approvedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,
    
    notes: String,
    terms: String,
    
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

quotationSchema.index({ jobId: 1 });
quotationSchema.index({ customerId: 1 });
quotationSchema.index({ status: 1 });

const Quotation = mongoose.model("Quotation", quotationSchema);
export default Quotation;
