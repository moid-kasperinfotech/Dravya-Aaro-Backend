import Job from "../../models/Jobs/Job.js";
import Technician from "../../models/Technician/Technician.js";
import { Request, Response, NextFunction } from "express";

interface FilterType {
    status?: string;
    technicianId?: string;
}

export const getAllJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status, technicianId, page = 1, limit = 20, sortBy = "-createdAt" } = req.query;

        let filter: FilterType = {};
        if (status) filter.status = status as string;
        if (technicianId) filter.technicianId = technicianId as string;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);

        const skip = (pageNum - 1) * limitNum;

        const jobs = await Job.find(filter)
            .sort(sortBy as string)
            .skip(skip)
            .limit(limitNum)
            .populate("customerId", "fullName mobileNumber")
            .populate("technicianId", "fullName mobileNumber");

        const total = await Job.countDocuments(filter);

        return res.status(200).json({
            success: true,
            jobs,
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

export const getJobDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId)
            .populate("customerId")
            .populate("technicianId")
            .populate("serviceId")
            .populate("quotationId")
            .populate("paymentId")
            .populate("rating");

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        return res.status(200).json({
            success: true,
            job,
        });
    } catch (err) {
        return next(err);
    }
};

export const assignTechnician = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { jobId } = req.params;
        const { technicianId } = req.body;

        if (!technicianId) {
            return res.status(400).json({
                success: false,
                message: "Technician ID required",
            });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        if (job.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Job status must be pending",
            });
        }

        const technician = await Technician.findById(technicianId);
        if (!technician) {
            return res.status(404).json({
                success: false,
                message: "Technician not found",
            });
        }

        job.technicianId = technicianId;
        job.status = "assigned";
        job.assignedAt = new Date();
        await job.save();

        // TODO: Send notification to technician

        return res.status(200).json({
            success: true,
            message: "Technician assigned successfully",
            job,
        });
    } catch (err) {
        return next(err);
    }
};

export const reassignJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { jobId } = req.params;
        const { newTechnicianId, reason: _reason } = req.body;

        if (!newTechnicianId) {
            return res.status(400).json({
                success: false,
                message: "New technician ID required",
            });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        const newTechnician = await Technician.findById(newTechnicianId);
        if (!newTechnician) {
            return res.status(404).json({
                success: false,
                message: "Technician not found",
            });
        }

        const oldTechnicianId = job.technicianId;
        job.technicianId = newTechnicianId;
        await job.save();

        // TODO: Send notifications to both technicians
        console.log(`Notify old technician ${oldTechnicianId} about reassignment.`);

        return res.status(200).json({
            success: true,
            message: "Job reassigned successfully",
            job,
        });
    } catch (err) {
        return next(err);
    }
};

export const rescheduleJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { jobId } = req.params;
        const { newScheduledTime, scheduledDuration, reason: _reason } = req.body;

        if (!newScheduledTime && !scheduledDuration) {
            return res.status(400).json({
                success: false,
                message: "New scheduled time and date required",
            });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        job.scheduled = {
            startTime: new Date(newScheduledTime),
            scheduledDuration,
        };
        await job.save();

        // TODO: Send notification to customer and technician

        return res.status(200).json({
            success: true,
            message: "Job rescheduled successfully",
            job,
        });
    } catch (err) {
        return next(err);
    }
};

export const cancelJob = async (req: Request, res: Response, next: NextFunction) => {
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

        // TODO: Send notification to customer

        return res.status(200).json({
            success: true,
            message: "Job cancelled successfully",
            job,
        });
    } catch (err) {
        return next(err);
    }
};
