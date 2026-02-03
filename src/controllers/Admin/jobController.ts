import Job from "../../models/Jobs/Job.js";
import Technician from "../../models/Technician/Technician.js";
import User from "../../models/Users/User.js";

export const getAllJobs = async (req, res, next) => {
    try {
        const { status, technicianId, page = 1, limit = 20, sortBy = "-createdAt" } = req.query;

        let filter = {};
        if (status) filter.status = status;
        if (technicianId) filter.technicianId = technicianId;

        const skip = (page - 1) * limit;

        const jobs = await Job.find(filter)
            .populate("customerId", "mobileNumber")
            .populate("technicianId", "fullName mobileNumber")
            .sort(sortBy)
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
            .populate("technicianId")
            .populate("quotationId")
            .populate("paymentId")
            .populate("rating");

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
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

export const assignTechnician = async (req, res, next) => {
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

        res.status(200).json({
            success: true,
            message: "Technician assigned successfully",
            job,
        });
    } catch (err) {
        next(err);
    }
};

export const reassignJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { newTechnicianId, reason } = req.body;

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

        res.status(200).json({
            success: true,
            message: "Job reassigned successfully",
            job,
        });
    } catch (err) {
        next(err);
    }
};

export const rescheduleJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { newScheduledTime, reason } = req.body;

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
                message: "Job not found",
            });
        }

        job.scheduledTime = new Date(newScheduledTime);
        await job.save();

        // TODO: Send notification to customer and technician

        res.status(200).json({
            success: true,
            message: "Job rescheduled successfully",
            job,
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

        // TODO: Send notification to customer

        res.status(200).json({
            success: true,
            message: "Job cancelled successfully",
            job,
        });
    } catch (err) {
        next(err);
    }
};
