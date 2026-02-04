import { Types } from "mongoose";
import Job from "../../models/Jobs/Job.js";
import Service from "../../models/Services/Service.js";
import User from "../../models/Users/User.js";
import { Request, Response, NextFunction } from "express";

export const bookService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { serviceId, scheduledTime, scheduledDuration, address, latitude, longitude, brandName, modelType, problemDescription, selectedProblems } = req.body;

        // Validation
        if (!serviceId || !scheduledTime || !address) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        // Get service details
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        // Generate job ID
        const jobId = `DRO-${Date.now()}`;

        // Create job
        const newJob = new Job({
            jobId,
            customerId: req.userId,
            serviceId,
            serviceType: service.serviceName,
            price: service.price,
            address,
            coordinates: { latitude, longitude },
            scheduled: {
                startTime: new Date(scheduledTime),
                scheduledDuration: scheduledDuration,
            },
            brandName,
            modelType,
            problemDescription,
            selectedProblems: selectedProblems || [],
            status: "pending",
            paymentStatus: "pending",
        });

        await newJob.save();

        // Update user's orders
        const user = await User.findById(req.userId);
        if (user) {
            user.orders.push(newJob._id);
            await user.save();
        }

        return res.status(201).json({
            success: true,
            message: "Service booked successfully",
            job: newJob,
            jobId,
        });
    } catch (err) {
        return next(err);
    }
};

interface FilterType {
    customerId: Types.ObjectId;
    status?: string;
}

export const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        let filter: FilterType = { customerId: req.userId };
        if (status) filter.status = status as string;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);

        const skip = (pageNum - 1) * limitNum;

        const jobs = await Job.find(filter)
            .populate("serviceId", "serviceName")
            .populate("technicianId", "fullName mobileNumber averageRating")
            .sort("-createdAt")
            .skip(skip)
            .limit(limitNum);

        const total = await Job.countDocuments(filter);

        return res.status(200).json({
            success: true,
            orders: jobs,
            pagination: {
                current: page,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (err) {
        return next(err);
    }
};

export const getOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId)
            .populate("serviceId")
            .populate("technicianId")
            .populate("quotationId")
            .populate("paymentId")
            .populate("rating");

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Verify ownership
        if (job.customerId.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        return res.status(200).json({
            success: true,
            order: job,
        });
    } catch (err) {
        return next(err);
    }
};

export const cancelService = async (req: Request, res: Response, next: NextFunction) => {
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
                message: "Order not found",
            });
        }

        // Verify ownership
        if (job.customerId.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        // Can only cancel if pending or assigned (not in progress or completed)
        if (["in_progress", "completed", "cancelled"].includes(job.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel service in ${job.status} status`,
            });
        }

        job.status = "cancelled";
        job.cancelledAt = new Date();
        job.cancellationReason = reason;
        await job.save();

        return res.status(200).json({
            success: true,
            message: "Service cancelled successfully",
        });
    } catch (err) {
        return next(err);
    }
};

export const rescheduleService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { jobId } = req.params;
        const { newScheduledTime, newScheduledDuration } = req.body;

        if (!newScheduledTime) {
            return res.status(400).json({
                success: false,
                message: "New scheduled time required",
            });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Verify ownership
        if (job.customerId.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        // Can only cancel if pending or assigned (not in progress or completed)
        if (["in_progress", "completed", "cancelled"].includes(job.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel service in ${job.status} status`,
            });
        }

        job.scheduled = {
            startTime: new Date(newScheduledTime),
            scheduledDuration: newScheduledDuration,
        }
        await job.save();

        return res.status(200).json({
            success: true,
            message: "Service rescheduled successfully",
        });
    } catch (err) {
        return next(err);
    }
};
