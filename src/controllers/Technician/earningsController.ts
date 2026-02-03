import Technician from "../../models/Technician/Technician.js";
import Job from "../../models/Jobs/Job.js";

export const getEarnings = async (req, res, next) => {
    try {
        const { period = "month" } = req.query; // "day", "week", "month", "all"

        const technician = await Technician.findById(req.technicianId);
        if (!technician) {
            return res.status(404).json({
                success: false,
                message: "Technician not found",
            });
        }

        let dateFilter = {};
        const now = new Date();

        if (period === "day") {
            dateFilter = {
                $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
            };
        } else if (period === "week") {
            const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
            dateFilter = {
                $gte: firstDay,
                $lt: new Date(firstDay.getTime() + 7 * 24 * 60 * 60 * 1000),
            };
        } else if (period === "month") {
            dateFilter = {
                $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
            };
        }

        const completedJobs = await Job.find({
            technicianId: req.technicianId,
            status: "completed",
            ...(period !== "all" && { completedTime: dateFilter }),
        });

        const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.price || 0), 0);

        res.status(200).json({
            success: true,
            earnings: {
                period,
                totalEarnings,
                jobsCompleted: completedJobs.length,
                averagePerJob: completedJobs.length > 0 ? totalEarnings / completedJobs.length : 0,
            },
            stats: {
                totalJobsCompleted: technician.totalJobsCompleted,
                totalEarningsAllTime: technician.totalEarnings,
                averageRating: technician.averageRating,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const getPaymentHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const skip = (page - 1) * limit;

        // Get all completed jobs with payments for this technician
        const jobs = await Job.find({
            technicianId: req.technicianId,
            status: "completed",
            paymentStatus: "paid",
        })
            .select("jobId price paymentStatus completedTime")
            .sort("-completedTime")
            .skip(skip)
            .limit(limit);

        const total = await Job.countDocuments({
            technicianId: req.technicianId,
            status: "completed",
            paymentStatus: "paid",
        });

        res.status(200).json({
            success: true,
            payments: jobs,
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

export const getDailySchedule = async (req, res, next) => {
    try {
        const { date } = req.query; // ISO date string

        const targetDate = date ? new Date(date) : new Date();
        const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const jobs = await Job.find({
            technicianId: req.technicianId,
            scheduledTime: {
                $gte: dayStart,
                $lt: dayEnd,
            },
        })
            .populate("customerId", "mobileNumber")
            .populate("serviceId", "serviceName")
            .sort("scheduledTime");

        const stats = {
            totalJobs: jobs.length,
            completed: jobs.filter((j) => j.status === "completed").length,
            pending: jobs.filter((j) => j.status === "pending").length,
            inProgress: jobs.filter((j) => j.status === "in_progress").length,
        };

        res.status(200).json({
            success: true,
            date: dayStart,
            jobs,
            stats,
        });
    } catch (err) {
        next(err);
    }
};
