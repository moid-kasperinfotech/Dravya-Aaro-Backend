import Job from "../../models/Services/jobs.js";
import Technician from "../../models/Technician/Technician.js";
import Quotation from "../../models/Services/quotation.js";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";

const validatePagination = (page: any, limit: any) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 10));
  return { p, l };
};

/**
 * CONSOLIDATED: GET /admin/dashboard/analytics
 * Supports: type=today|stats|revenue
 */
export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type = "today", startDate, endDate, groupBy = "day" } = req.query;

    if (type === "today") {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const [jobStats, activeTechs] = await Promise.all([
        Job.aggregate([
          { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]) as any,
        Technician.countDocuments({ currentStatus: { $in: ["available", "on_job"] }, offDuty: false }),
      ]);

      const activeJobs: any = {};
      jobStats.forEach((s: any) => (activeJobs[s._id] = s.count));
      const total = jobStats.reduce((sum: number, s: any) => sum + s.count, 0);

      return res.json({
        success: true,
        data: { totalJobsToday: total, activeJobs, activeTechnicians: activeTechs, timestamp: new Date() },
      });
    }

    if (type === "stats") {
      const jobs = await Job.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]) as any;
      const stats: any = {
        pending: 0,
        assigned: 0,
        reached: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        rescheduled: 0,
      };
      jobs.forEach((j: any) => {
        if (stats.hasOwnProperty(j._id)) stats[j._id] = j.count;
      });
      return res.json({ success: true, data: stats });
    }

    if (type === "revenue") {
      if (!startDate || !endDate) return res.status(400).json({ success: false, message: "startDate and endDate required" });

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      const groupExpr =
        groupBy === "day"
          ? { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } }
          : groupBy === "month"
          ? { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "Asia/Kolkata" } }
          : groupBy === "week"
          ? { $week: { date: "$createdAt", timezone: "Asia/Kolkata" } }
          : { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } };

      const trend = await Job.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: "completed", paymentStatus: "collected" } },
        { $group: { _id: groupExpr, revenue: { $sum: "$totalPrice" }, jobCount: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            period: "$_id",
            revenue: 1,
            jobCount: 1,
          },
        },
      ]) as any;

      return res.json({ success: true, data: { trend, dateRange: { startDate: start, endDate: end }, groupBy } });
    }

    return res.status(400).json({ success: false, message: "Invalid type parameter" });
  } catch (err) {
    return next(err);
  }
};

/**
 * CONSOLIDATED: GET /admin/dashboard/jobs-list
 * Supports: listType=live|requests
 */
export const getJobsList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { listType = "live", status = "all", requestType = "all", sortBy = "createdAt", page = "1", limit = "10" } = req.query;
    const { p, l } = validatePagination(page, limit);

    if (listType === "live") {
      const matchFilter: any = status !== "all" ? { status } : {};

      const pipeline = [
        { $match: matchFilter },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "customer",
          },
        },
        {
          $lookup: {
            from: "technicians",
            localField: "technicianId",
            foreignField: "_id",
            as: "technician",
          },
        },
        {
          $lookup: {
            from: "services",
            localField: "services",
            foreignField: "_id",
            as: "serviceDetails",
          },
        },
        {
          $lookup: {
            from: "quotations",
            localField: "quotationId",
            foreignField: "_id",
            as: "quotation",
          },
        },
        {
          $addFields: {
            customer: { $arrayElemAt: ["$customer", 0] },
            technician: { $arrayElemAt: ["$technician", 0] },
            quotation: { $arrayElemAt: ["$quotation", 0] },
          },
        },
        {
          $project: {
            jobId: 1,
            jobName: 1,
            status: 1,
            totalPrice: 1,
            paymentStatus: 1,
            createdAt: 1,
            assignedAt: 1,
            customer: { _id: 1, name: 1, mobileNumber: 1 },
            technician: { _id: 1, fullName: 1, averageRating: 1 },
            serviceDetails: { name: 1, category: 1 },
            quotation: { _id: 1, status: 1 },
          },
        },
        { $sort: { [sortBy as string]: -1 } as any },
        { $skip: (p - 1) * l },
        { $limit: l },
      ];

      const [jobs, total] = await Promise.all([
        Job.aggregate(pipeline) as any,
        Job.countDocuments(matchFilter),
      ]);

      return res.json({
        success: true,
        data: jobs,
        pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
      });
    }

    if (listType === "requests") {
      let matchFilter: any = {
        $or: [
          { "rescheduleRequest.status": { $ne: null } },
          { "reassignRequest.status": { $ne: null } },
          { "cancellationRequest.status": { $ne: null } },
        ],
      };

      if (requestType === "customer") {
        matchFilter.$or = [
          { "rescheduleRequest.requestedBy": "user" },
          { "reassignRequest.requestedBy": "user" },
          { "cancellationRequest.requestedBy": "user" },
        ];
      } else if (requestType === "technician") {
        matchFilter.$or = [
          { "rescheduleRequest.requestedBy": "technician" },
          { "reassignRequest.requestedBy": "technician" },
          { "cancellationRequest.requestedBy": "technician" },
        ];
      }

      if (status !== "all") {
        if (status === "reschedule") matchFilter["rescheduleRequest.status"] = "pending";
        else if (status === "reassign") matchFilter["reassignRequest.status"] = "pending";
        else if (status === "cancel") matchFilter["cancellationRequest.status"] = "pending";
      }

      const pipeline = [
        { $match: matchFilter },
        { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "customer" } },
        { $lookup: { from: "technicians", localField: "technicianId", foreignField: "_id", as: "technician" } },
        { $addFields: { customer: { $arrayElemAt: ["$customer", 0] }, technician: { $arrayElemAt: ["$technician", 0] } } },
        { $sort: { createdAt: -1 } as any },
        { $skip: (p - 1) * l },
        { $limit: l },
        {
          $project: {
            jobId: 1,
            status: 1,
            customer: { name: 1, mobileNumber: 1 },
            technician: { fullName: 1 },
            rescheduleRequest: 1,
            reassignRequest: 1,
            cancellationRequest: 1,
            createdAt: 1,
          },
        },
      ];

      const [jobs, total] = await Promise.all([
        Job.aggregate(pipeline) as any,
        Job.countDocuments(matchFilter),
      ]);

      return res.json({
        success: true,
        data: jobs,
        pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
      });
    }

    return res.status(400).json({ success: false, message: "Invalid listType" });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/dashboard/available-technicians
 * (Kept separate for specialized use)
 */
export const getAvailableTechnicians = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = "1", limit = "10" } = req.query;
    const { p, l } = validatePagination(page, limit);

    const [techs, total] = await Promise.all([
      Technician.find({ currentStatus: "available", isBlacklisted: false, isActive: true })
        .select("technicianId fullName mobileNumber averageRating yearsOfExperience totalJobsCompleted totalEarnings")
        .sort({ averageRating: -1, totalJobsCompleted: -1 })
        .skip((p - 1) * l)
        .limit(l),
      Technician.countDocuments({ currentStatus: "available", isBlacklisted: false, isActive: true }),
    ]);

    res.json({ success: true, data: techs, pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/dashboard/quotation/:jobId
 * (Kept separate for specialized use)
 */
export const getQuotationDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ success: false, message: "Invalid jobId format" });
    }

    const job = await Job.findById(jobId)
      .populate("userId", "name mobileNumber email")
      .populate("technicianId", "technicianId fullName mobileNumber averageRating")
      .populate("services", "name category price")
      .exec();

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const quotation = job.quotationId ? await Quotation.findById(job.quotationId) : null;
    const pricingInfo = quotation
      ? quotation.pricingBreakdown
      : {
          subTotal: job.totalPrice,
          gst: job.totalPrice * 0.18,
          total: job.totalPrice * 1.18,
        };

    res.json({
      success: true,
      data: {
        job: { _id: job._id, jobId: job.jobId, jobName: job.jobName, status: job.status },
        customer: job.userId,
        technician: job.technicianId,
        serviceDetails: job.services,
        quotation: quotation || { message: "No quotation linked" },
        pricingBreakdown: pricingInfo,
        paymentStatus: job.paymentStatus,
        timeline: job.steps,
      },
    });
  } catch (err) {
    return next(err);
  }
};
