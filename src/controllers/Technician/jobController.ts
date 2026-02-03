import Job from "../../models/Jobs/Job.js";
import Quotation from "../../models/Common/Quotation.js";
import Payment from "../../models/Common/Payment.js";
import Technician from "../../models/Technician/Technician.js";

export const getAssignedJobs = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        let filter = { technicianId: req.technicianId };
        if (status) filter.status = status;

        const skip = (page - 1) * limit;

        const jobs = await Job.find(filter)
            .populate("customerId", "mobileNumber")
            .populate("serviceId", "serviceName")
            .sort("-createdAt")
            .skip(skip)
            .limit(limit);

        const total = await Job.countDocuments(filter);

        res.status(200).json({
            success: true,
            jobs,
            pagination: {
                current: page,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        next(err);
    }
};

export const getJobDetails = async (req, res, next) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId)
            .populate("customerId")
            .populate("serviceId")
            .populate("quotationId")
            .populate("paymentId");

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        // Verify technician owns this job
        if (job.technicianId.toString() !== req.technicianId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        res.status(200).json({
            success: true,
            job,
        });
    } catch (err) {
        next(err);
    }
};

export const acceptJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        if (job.technicianId.toString() !== req.technicianId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        job.status = "in_progress";
        await job.save();

        // TODO: Send notification to customer

        res.status(200).json({
            success: true,
            message: "Job accepted",
            job,
        });
    } catch (err) {
        next(err);
    }
};

export const rejectJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason required",
            });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        job.technicianId = null;
        job.status = "pending";
        await job.save();

        // TODO: Send notification to admin & customer for reassignment

        res.status(200).json({
            success: true,
            message: "Job rejected",
        });
    } catch (err) {
        next(err);
    }
};

export const createQuote = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { items, notes } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Items required",
            });
        }

        const job = await Job.findById(jobId).populate("customerId");
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        // Calculate pricing
        let partSubtotal = 0;
        items.forEach((item) => {
            partSubtotal += item.totalPrice;
        });

        const gstPercentage = 18;
        const gstAmount = (partSubtotal * gstPercentage) / 100;
        const totalAmount = partSubtotal + gstAmount;

        const quotationId = `QT-${Date.now()}`;
        const newQuotation = new Quotation({
            quotationId,
            jobId,
            technicianId: req.technicianId,
            customerId: job.customerId._id,
            items,
            partSubtotal,
            laborCharges: 0,
            additionalCharges: 0,
            subtotal: partSubtotal,
            gst: {
                percentage: gstPercentage,
                amount: gstAmount,
            },
            totalAmount,
            notes,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        await newQuotation.save();

        job.quotationId = newQuotation._id;
        job.status = "on_hold"; // Waiting for customer approval
        await job.save();

        res.status(201).json({
            success: true,
            message: "Quote created successfully",
            quotation: newQuotation,
        });
    } catch (err) {
        next(err);
    }
};

export const completeJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { beforePhotos, afterPhotos, serviceNotes } = req.body;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        job.status = "completed";
        job.completedTime = new Date();
        if (beforePhotos) job.beforePhotos = beforePhotos;
        if (afterPhotos) job.afterPhotos = afterPhotos;
        if (serviceNotes) job.notes = serviceNotes;
        await job.save();

        // Update technician stats
        const technician = await Technician.findById(req.technicianId);
        if (technician) {
            technician.totalJobsCompleted += 1;
            await technician.save();
        }

        // TODO: Send notification to customer for payment collection

        res.status(200).json({
            success: true,
            message: "Job completed successfully",
            job,
        });
    } catch (err) {
        next(err);
    }
};

export const collectPayment = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { paymentMethod, amount } = req.body;

        if (!paymentMethod || !amount) {
            return res.status(400).json({
                success: false,
                message: "Payment method and amount required",
            });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        const transactionId = `TXN-${Date.now()}`;
        const payment = new Payment({
            transactionId,
            customerId: job.customerId,
            jobId,
            amount,
            paymentMethod,
            status: "completed",
            completedAt: new Date(),
        });

        await payment.save();

        job.paymentStatus = "paid";
        job.paymentId = payment._id;
        await job.save();

        // Update technician earnings
        const technician = await Technician.findById(req.technicianId);
        if (technician) {
            technician.totalEarnings += amount;
            await technician.save();
        }

        res.status(200).json({
            success: true,
            message: "Payment collected successfully",
            payment,
        });
    } catch (err) {
        next(err);
    }
};

export const cancelJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Cancellation reason required",
            });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        job.status = "cancelled";
        job.cancelledAt = new Date();
        job.cancellationReason = reason;
        await job.save();

        // TODO: Send notification to admin & customer

        res.status(200).json({
            success: true,
            message: "Job cancelled",
        });
    } catch (err) {
        next(err);
    }
};
