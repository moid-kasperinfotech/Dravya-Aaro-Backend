import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        unique: true,
        required: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    
    // Linked to
    jobId: mongoose.Schema.Types.ObjectId,
    orderId: mongoose.Schema.Types.ObjectId,
    amcSubscriptionId: mongoose.Schema.Types.ObjectId,
    
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: "INR",
    },
    
    paymentMethod: {
        type: String,
        enum: ["cash", "upi", "debit_card", "credit_card", "wallet"],
        required: true,
    },
    
    // Payment gateway
    paymentGateway: String, // "phonepe", "stripe", etc.
    referenceId: String,
    
    status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
    },
    
    paymentDetails: {
        upiId: String,
        cardLastFour: String,
        paymentScreenshot: String,
    },
    
    // Refund tracking
    refund: {
        amount: Number,
        status: {
            type: String,
            enum: ["not_applicable", "pending", "completed", "failed"],
            default: "not_applicable",
        },
        reason: String,
        processedAt: Date,
    },
    
    notes: String,
    
    createdAt: {
        type: Date,
        default: Date.now,
    },
    completedAt: Date,
}, { timestamps: true });

paymentSchema.index({ customerId: 1, status: 1 });
paymentSchema.index({ jobId: 1 });
paymentSchema.index({ transactionId: 1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
