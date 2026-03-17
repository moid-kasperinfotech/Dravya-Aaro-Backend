import Technician from "../../models/Technician/Technician.js";
import Job from "../../models/Services/jobs.js";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Review from "../../models/Services/review.js";

interface FilterType {
  currentStatus?: string;
  registrationStatus?: string;
  createdAt?: any;
  $or?: any[];
}

export const getAllTechnicians = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      status,
      registrationStatus,
      search,
      date,
      page = 1,
      limit = 20,
    } = req.query;

    let filter: FilterType = {};

    // ===== STATUS FILTER =====
    if (status) {
      filter.currentStatus = status as string;
    }

    if (registrationStatus) {
      filter.registrationStatus = registrationStatus as string;
    }

    // ===== DATE FILTER =====
    if (date) {
      const selectedDate = new Date(date as string);

      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

      filter.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    // ===== SEARCH FILTER =====
    if (search) {
      const searchRegex = new RegExp(search as string, "i");

      filter.$or = [
        { fullName: searchRegex },
        { technicianId: searchRegex },
        { location: searchRegex },
        { city: searchRegex },
      ];
    }

    // ===== PAGINATION =====
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // ===== MAIN QUERY =====
    const technicians = await Technician.find(filter)
      .select("-bankDetails")
      .skip(skip)
      .limit(limitNum)
      .lean();

    const technicianIds = technicians.map((t) => t._id);

    // ===== AGGREGATE REVIEWS (OPTIMIZED) =====
    const reviewStats = await Review.aggregate([
      {
        $match: {
          technicianId: { $in: technicianIds },
        },
      },
      {
        $group: {
          _id: "$technicianId",
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    // convert to map for fast lookup
    const reviewMap = new Map();
    reviewStats.forEach((item) => {
      reviewMap.set(item._id.toString(), item);
    });

    // attach review data
    const enrichedTechnicians = technicians.map((tech) => {
      const stats = reviewMap.get(tech._id.toString());

      return {
        ...tech,
        averageRating: stats?.averageRating || 0,
        totalReviews: stats?.totalReviews || 0,
      };
    });

    const total = await Technician.countDocuments(filter);

    return res.status(200).json({
      success: true,
      technicians: enrichedTechnicians,
      pagination: {
        current: pageNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const getTechnicianDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { technicianId } = req.params;

    const technician = await Technician.findOne({ technicianId }).lean();

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    return res.status(200).json({
      success: true,
      technician,
    });
  } catch (err) {
    return next(err);
  }
};

export const approveTechnicianRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { technicianId } = req.params;

    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    const docKeys = Object.keys(technician.documents) as Array<
      keyof typeof technician.documents
    >;

    for (const docKey of docKeys) {
      const doc =
        technician.documents[docKey as keyof typeof technician.documents];

      if (!doc || !doc.verified) {
        return res.status(400).json({
          success: false,
          message: "Documents not verified",
        });
      }
    }

    technician.registrationStatus = "approved";
    technician.isVerified = true;
    technician.approvedAt = new Date();
    await technician.save();

    // TODO: Send approval notification to technician

    return res.status(200).json({
      success: true,
      message: "Technician registration approved",
      technician,
    });
  } catch (err) {
    return next(err);
  }
};

export const rejectTechnicianRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { technicianId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason required",
      });
    }

    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    technician.registrationStatus = "rejected";
    technician.rejectionReason = reason;
    await technician.save();

    // TODO: Send rejection notification to technician

    return res.status(200).json({
      success: true,
      message: "Technician registration rejected",
      technician,
    });
  } catch (err) {
    return next(err);
  }
};

export const deactivateTechnician = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { technicianId } = req.params;

    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    technician.isActive = false;
    await technician.save();

    return res.status(200).json({
      success: true,
      message: "Technician deactivated",
    });
  } catch (err) {
    return next(err);
  }
};

const allowed = [
  "aadhaar",
  "panCard",
  "drivingLicense",
  "vehicleRegistration",
  "vehicleImage",
] as const;
type DocumentType = (typeof allowed)[number];

export const verifyTechnicianDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { technicianId } = req.params;
    const documentType: unknown = req.body.documentType;

    if (typeof documentType !== "string") {
      return res.status(400).json({
        success: false,
        message: "Document type required",
      });
    }

    if (!allowed.includes(documentType as DocumentType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid document type" });
    }

    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    const docs = technician.documents;
    if (!docs)
      return res
        .status(400)
        .json({ success: false, message: "Documents not uploaded" });

    // ✅ now TS knows documentType is one of allowed keys
    const key = documentType as DocumentType;

    const doc = docs[key];
    if (!doc) {
      return res
        .status(400)
        .json({ success: false, message: `${key} not found` });
    }

    doc.verified = true;

    await technician.save();

    return res.status(200).json({
      success: true,
      message: `${key} verified successfully`,
    });
  } catch (err) {
    return next(err);
  }
};

export const getTechnicianRatings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // const technicianId = req.params.technicianId;
    const { page = "1", limit = "20" } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));

    // TODO: Implement with ServiceReview model when available
    // const ratings = await ServiceReview.find({ technicianId })
    //     .sort({ createdAt: -1 })
    //     .skip((pageNum - 1) * limitNum)
    //     .limit(limitNum)
    //     .populate("userId", "fullName");
    // const total = await ServiceReview.countDocuments({ technicianId });

    return res.status(200).json({
      success: true,
      data: {
        ratings: [],
        pagination: { page: pageNum, limit: limitNum, total: 0, pages: 0 },
      },
      message: "Ratings endpoint - implementation pending",
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/technician/stats
 * Get technician statistics for dashboard
 */
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) {
        const ed = new Date(endDate as string);
        ed.setHours(23, 59, 59, 999);
        dateFilter.$lte = ed;
      }
    }

    const matchStage =
      Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [
      newRegistrations,
      pendingApprovals,
      rejectedCount,
      verifiedCount,
      totalTechnicians,
    ] = await Promise.all([
      Technician.countDocuments({
        registrationStatus: "pending",
        ...matchStage,
      }),
      Technician.countDocuments({ registrationStatus: "pending" }),
      Technician.countDocuments({
        registrationStatus: "rejected",
        ...matchStage,
      }),
      Technician.countDocuments({ isVerified: true }),
      Technician.countDocuments({}),
    ]);

    const avgStats = (await Technician.aggregate([
      { $match: { isVerified: true } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$averageRating" },
          avgEarnings: { $avg: "$totalEarnings" },
          totalEarnings: { $sum: "$totalEarnings" },
        },
      },
    ])) as any[];

    const stats =
      avgStats.length > 0
        ? avgStats[0]
        : { avgRating: 0, avgEarnings: 0, totalEarnings: 0 };

    return res.json({
      success: true,
      data: {
        newRegistrations,
        pendingApprovals,
        rejectedCount,
        verifiedCount,
        totalTechnicians,
        averageRating: stats.avgRating || 0,
        avergaTotalEarnings: stats.totalEarnings || 0,
        averageEarningsPerTech: stats.avgEarnings || 0,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/technician/list
 * Get filtered technician list (unverified/verified)
 */
export const getList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      listType = "verified",
      status = "all",
      startDate,
      endDate,
      page = "1",
      limit = "10",
      sortBy = "createdAt",
    } = req.query;

    let matchFilter: any = {};

    if (listType === "unverified") {
      matchFilter.registrationStatus = { $in: ["pending", "rejected"] };
    } else if (listType === "verified") {
      matchFilter.isVerified = true;
      matchFilter.registrationStatus = "approved";
    }

    if (status !== "all" && status) {
      matchFilter.currentStatus = status as string;
    }

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) {
        const ed = new Date(endDate as string);
        ed.setHours(23, 59, 59, 999);
        dateFilter.$lte = ed;
      }
      matchFilter.createdAt = dateFilter;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [technicians, total] = await Promise.all([
      Technician.find(matchFilter)
        .select("-bankDetails.accountNumber -bankDetails.ifscCode")
        .sort({ [sortBy as string]: -1 })
        .skip(skip)
        .limit(limitNum),
      Technician.countDocuments(matchFilter),
    ]);

    return res.json({
      success: true,
      data: technicians,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/technician/:technicianId/registration-action
 * CONSOLIDATED: Approve/reject technician registration
 */
export const processRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { technicianId } = req.params;
    const { action, reason } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ success: false, message: "action must be approve or reject" });
    }

    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res
        .status(404)
        .json({ success: false, message: "Technician not found" });
    }

    if (action === "approve") {
      // Check all documents verified
      for (const docKey in technician.documents) {
        const doc =
          technician.documents[docKey as keyof typeof technician.documents];
        if (!doc || !doc.verified) {
          return res
            .status(400)
            .json({ success: false, message: `${docKey} not verified` });
        }
      }

      technician.registrationStatus = "approved";
      technician.isVerified = true;
      technician.approvedAt = new Date();
    } else {
      // reject
      if (!reason) {
        return res
          .status(400)
          .json({ success: false, message: "Rejection reason required" });
      }
      technician.registrationStatus = "rejected";
      technician.rejectionReason = reason;
    }

    await technician.save();

    return res.json({
      success: true,
      message: `Technician registration ${action}ed successfully`,
      data: technician,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/technician/:technicianId/toggle-status
 * CONSOLIDATE: Toggle technician active/inactive status
 */
export const toggleStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { technicianId } = req.params;
    const { action } = req.body;

    if (!["activate", "deactivate"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "action must be activate or deactivate",
      });
    }

    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res
        .status(404)
        .json({ success: false, message: "Technician not found" });
    }

    technician.isActive = action === "activate";
    await technician.save();

    return res.json({
      success: true,
      message: `Technician ${action}d successfully`,
      data: { technicianId, isActive: technician.isActive },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/technician/:technicianId/settings/auto-pickup
 * Toggle technician's auto job pickup setting
 */
export const toggleAutoPickup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { technicianId } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res
        .status(400)
        .json({ success: false, message: "enabled must be boolean" });
    }

    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res
        .status(404)
        .json({ success: false, message: "Technician not found" });
    }

    technician.autoPickupEnabled = enabled;
    await technician.save();

    return res.json({
      success: true,
      message: `Auto pickup ${enabled ? "enabled" : "disabled"}`,
      data: {
        technicianId,
        autoPickupEnabled: technician.autoPickupEnabled,
        maxJobsPerDay: technician.maxJobsPerDay,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/technician/:technicianId/jobs
 * Get all jobs assigned to technician (return all, frontend filters by status)
 */
export const getTechnicianJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { technicianId } = req.params;
    const { page = "1", limit = "10", sortBy = "createdAt" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(technicianId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid technicianId" });
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
      Job.find({ technicianId })
        .select(
          "jobId jobName status createdAt updatedAt totalPrice paymentStatus serviceDetails",
        )
        .populate("userId", "fullName mobileNumber email")
        .sort({ [sortBy as string]: -1 })
        .skip(skip)
        .limit(limitNum),
      Job.countDocuments({ technicianId }),
    ]);

    return res.json({
      success: true,
      data: jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/technician/:technicianId/jobs/:jobId
 * Get specific job details for technician
 */
export const getJobDetail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { technicianId, jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ success: false, message: "Invalid jobId" });
    }

    const job = await Job.findOne({ _id: jobId, technicianId })
      .populate("userId", "fullName mobileNumber email address")
      .populate("services", "name category price")
      .populate("quotationId");

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.json({
      success: true,
      data: {
        job,
        timeline: job.steps || [],
        paymentStatus: job.paymentStatus,
        totalPrice: job.totalPrice,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/technician/:technicianId/performance
 * Get technician performance metrics (earnings, ratings, completed jobs)
 */
export const getTechnicianPerformance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { technicianId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(technicianId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid technicianId" });
    }

    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res
        .status(404)
        .json({ success: false, message: "Technician not found" });
    }

    const jobsStats = (await Job.aggregate([
      { $match: { technicianId: new mongoose.Types.ObjectId(technicianId) } },
      {
        $group: {
          _id: null,
          totalCompleted: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          totalOngoing: {
            $sum: {
              $cond: [
                { $in: ["$status", ["assigned", "reached", "in_progress"]] },
                1,
                0,
              ],
            },
          },
          totalCancelled: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          totalEarningsFromJobs: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$totalPrice", 0],
            },
          },
        },
      },
    ])) as any[];

    const stats =
      jobsStats.length > 0
        ? jobsStats[0]
        : {
            totalCompleted: 0,
            totalOngoing: 0,
            totalCancelled: 0,
            totalEarningsFromJobs: 0,
          };

    return res.json({
      success: true,
      data: {
        totalJobsCompleted: technician.totalJobsCompleted,
        totalEarnings: technician.totalEarnings,
        averageRating: technician.averageRating,
        totalReviews: technician.totalReviews,
        currentStatus: technician.currentStatus,
        isActive: technician.isActive,
        isBlacklisted: technician.isBlacklisted,
        jobsStats: {
          completed: stats.totalCompleted,
          ongoing: stats.totalOngoing,
          cancelled: stats.totalCancelled,
          earningsFromJobs: stats.totalEarningsFromJobs,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
};
