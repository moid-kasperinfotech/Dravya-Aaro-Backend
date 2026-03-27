import Job from "../../models/Services/jobs.js";
import Technician from "../../models/Technician/Technician.js";
import Quotation from "../../models/Services/quotationModel.js";
import mongoose from "mongoose";

// Helper: Get IST date boundaries
const getISTDateBoundary = (date: Date) => {
  const ist = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  return {
    startOfDay: new Date(ist.getFullYear(), ist.getMonth(), ist.getDate()),
    endOfDay: new Date(ist.getFullYear(), ist.getMonth(), ist.getDate() + 1),
  };
};

// Helper: Pagination validation
const validatePagination = (page: any, limit: any) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 10));
  return { page: p, limit: l };
};

// Helper: Calculate date range based on groupBy
const calculateDateRange = (
  startDate: string,
  endDate: string,
  _groupBy: string,
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return { startDate: start, endDate: end };
};

// Helper: Group revenue by period
const buildRevenueTrendPipeline = (
  startDate: Date,
  endDate: Date,
  groupBy: string,
) => {
  let groupExpr: any;

  switch (groupBy) {
    case "day":
      groupExpr = {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$createdAt",
          timezone: "Asia/Kolkata",
        },
      };
      break;
    case "week":
      groupExpr = {
        $week: { date: "$createdAt", timezone: "Asia/Kolkata" },
      };
      break;
    case "month":
      groupExpr = {
        $dateToString: {
          format: "%Y-%m",
          date: "$createdAt",
          timezone: "Asia/Kolkata",
        },
      };
      break;
    case "year":
      groupExpr = {
        $year: { date: "$createdAt", timezone: "Asia/Kolkata" },
      };
      break;
    default:
      groupExpr = {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$createdAt",
          timezone: "Asia/Kolkata",
        },
      };
  }

  return [
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: "completed",
        paymentStatus: "collected",
      },
    },
    {
      $group: {
        _id: groupExpr,
        revenue: { $sum: "$totalPrice" },
        jobCount: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 } as any,
    },
    {
      $project: {
        _id: 0,
        period: "$_id",
        revenue: 1,
        jobCount: 1,
      },
    },
  ];
};

/**
 * Get today's statistics: total jobs today, active jobs by status, active technicians
 */
export const getTodayStats = async (_req: any, res: any) => {
  try {
    const now = new Date();
    const { startOfDay, endOfDay } = getISTDateBoundary(now);

    // Get jobs created today
    const jobStats = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get active technicians (online, not off-duty)
    const activeTechnicians = await Technician.countDocuments({
      currentStatus: { $in: ["available", "on_job"] },
      offDuty: false,
    });

    // Transform job stats to object
    const jobStatusCounts = {
      pending: 0,
      assigned: 0,
      reached: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      rescheduled: 0,
    };

    jobStats.forEach((stat: any) => {
      if (jobStatusCounts.hasOwnProperty(stat._id)) {
        jobStatusCounts[stat._id as keyof typeof jobStatusCounts] = stat.count;
      }
    });

    const totalJobsToday = Object.values(jobStatusCounts).reduce(
      (a, b) => a + b,
      0,
    );

    return res.status(200).json({
      success: true,
      data: {
        totalJobsToday,
        activeJobs: jobStatusCounts,
        activeTechnicians,
        timestamp: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in getTodayStats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch today's statistics",
      error: (error as any).message,
    });
  }
};

/**
 * Get revenue trend with custom date range and grouping (day/week/month/year)
 */
export const getRevenueTrend = async (req: any, res: any) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required query parameters",
      });
    }

    if (!["day", "week", "month", "year"].includes(groupBy.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "groupBy must be one of: day, week, month, year",
      });
    }

    const { startDate: start, endDate: end } = calculateDateRange(
      startDate,
      endDate,
      groupBy,
    );

    const pipeline = buildRevenueTrendPipeline(
      start,
      end,
      groupBy.toLowerCase(),
    );
    const revenueTrend = await Job.aggregate(pipeline as any);

    return res.status(200).json({
      success: true,
      data: {
        trend: revenueTrend,
        dateRange: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
        groupBy: groupBy.toLowerCase(),
      },
    });
  } catch (error) {
    console.error("Error in getRevenueTrend:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch revenue trend",
      error: (error as any).message,
    });
  }
};

/**
 * Get job statistics: count of jobs by status
 */
export const getJobStats = async (_req: any, res: any) => {
  try {
    const jobStats = await Job.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      pending: 0,
      assigned: 0,
      reached: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      rescheduled: 0,
    };

    jobStats.forEach((stat: any) => {
      if (stats.hasOwnProperty(stat._id)) {
        stats[stat._id as keyof typeof stats] = stat.count;
      }
    });

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error in getJobStats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job statistics",
      error: (error as any).message,
    });
  }
};

/**
 * Get live job queue with filtering and pagination
 * Query params: status (pending|assigned|in_progress|all), sortBy (createdAt|priority), page, limit
 */
export const getLiveJobQueue = async (req: any, res: any) => {
  try {
    const { status = "all", sortBy = "createdAt", page, limit } = req.query;
    const { page: p, limit: l } = validatePagination(page, limit);

    // Build match filter
    const matchFilter: any = {};
    if (status !== "all") {
      if (["pending", "assigned", "in_progress"].includes(status)) {
        matchFilter.status = status;
      } else {
        return res.status(400).json({
          success: false,
          message: "status must be one of: pending, assigned, in_progress, all",
        });
      }
    }

    // Count total
    const total = await Job.countDocuments(matchFilter);

    // Build sort
    const sortOrder: any = {};
    if (sortBy === "priority") {
      sortOrder.createdAt = 1; // Newer jobs first (higher priority)
    } else {
      sortOrder.createdAt = -1; // Older first
    }

    // Aggregation pipeline with lookups
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
          jobType: 1,
          totalPrice: 1,
          paymentStatus: 1,
          createdAt: 1,
          assignedAt: 1,
          customer: {
            _id: 1,
            name: 1,
            mobileNumber: 1,
            email: 1,
          },
          technician: {
            _id: 1,
            fullName: 1,
            mobileNumber: 1,
            averageRating: 1,
          },
          serviceDetails: {
            _id: 1,
            name: 1,
            category: 1,
          },
          quotation: {
            _id: 1,
            status: 1,
            pricingBreakdown: 1,
          },
          problemsDescription: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: {
                      $ifNull: [
                        { $arrayElemAt: ["$bookedServices.problems", 0] },
                        [],
                      ],
                    },
                  },
                  0,
                ],
              },
              then: {
                $concat: [
                  {
                    $arrayElemAt: [
                      { $arrayElemAt: ["$bookedServices.problems", 0] },
                      0,
                    ],
                  },
                  "...",
                ],
              },
              else: "No problems listed",
            },
          },
        },
      },
      { $sort: sortOrder as any },
      { $skip: (p - 1) * l },
      { $limit: l },
    ] as any;

    const jobs = await Job.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: p,
        limit: l,
        total,
        pages: Math.ceil(total / l),
      },
    });
  } catch (error) {
    console.error("Error in getLiveJobQueue:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch live job queue",
      error: (error as any).message,
    });
  }
};

/**
 * Get available technicians with pagination
 */
export const getAvailableTechnicians = async (req: any, res: any) => {
  try {
    const { page, limit, search } = req.query;
    const { page: p, limit: l } = validatePagination(page, limit);

    // ===== BASE FILTER =====
    const filter: any = {
      currentStatus: "available",
      isBlacklisted: false,
      isActive: true,
    };

    // ===== SEARCH FILTER =====
    if (search) {
      const regex = new RegExp(search as string, "i");

      filter.fullName = regex;
    }

    const total = await Technician.countDocuments(filter);

    const technicians = await Technician.find(filter)
      .select(
        "technicianId fullName mobileNumber email averageRating totalJobsCompleted totalEarnings yearsOfExperience",
      )
      .skip((p - 1) * l)
      .limit(l)
      .sort({ averageRating: -1, totalJobsCompleted: -1 });

    return res.status(200).json({
      success: true,
      data: technicians,
      pagination: {
        page: p,
        limit: l,
        total,
        pages: Math.ceil(total / l),
      },
    });
  } catch (error) {
    console.error("Error in getAvailableTechnicians:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch available technicians",
      error: (error as any).message,
    });
  }
};

/**
 * Get quotation details for a specific job
 */
export const getQuotationDetails = async (req: any, res: any) => {
  try {
    const { jobId } = req.params;

    // Validate jobId format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid jobId format",
      });
    }

    // Fetch job with all related data
    const job = await Job.findById(jobId)
      .populate("userId", "name mobileNumber email")
      .populate(
        "technicianId",
        "technicianId fullName mobileNumber averageRating",
      )
      .populate("services", "name category price")
      .exec();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Fetch quotation if quotationId exists
    let quotation = null;
    if (job.quotationId) {
      quotation = await Quotation.findById(job.quotationId);
    }

    // Prepare pricing breakdown (either from quotation or embedded in job)
    const pricingInfo = quotation
      ? {
          subTotal: quotation.subtotal,
          gst: quotation.gst?.amount || 0,
          gstPercentage: quotation.gst?.percentage || 18,
          discount: 0,
          discountPercentage: 0,
          total: quotation.totalAmount,
        }
      : {
          subTotal: job.pricing?.subTotal || 0,
          gst: (job.pricing?.subTotal || 0) * 0.18,
          gstPercentage: 18,
          discount: 0,
          discountPercentage: 0,
          total: (job.pricing?.subTotal || 0) * 1.18,
        };

    return res.status(200).json({
      success: true,
      data: {
        jobId: job._id,
        status: job.status,
        customer: job.userId,
        technician: job.technicianId,
        serviceDetails: job.bookedServices,
        quotation: quotation || {
          lineItems: [],
          status: "embedded",
          message: "Using embedded pricing (no quotation model)",
        },
        pricingBreakdown: pricingInfo,
        paymentStatus: job.paymentStatus?.status,
        paymentTimeline: {
          createdAt: job.createdAt,
          assignedAt: job.assignedAt,
          paidAt: job.paymentStatus?.paidAt,
          collectionDeadline: job.collectionDeadline,
        },
        jobTimeline: job.steps || [],
        jobAddress: job.address,
        relocationAddresses: {
          fromAddress: job.fromAddress,
          toAddress: job.toAddress,
        },
      },
    });
  } catch (error) {
    console.error("Error in getQuotationDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotation details",
      error: (error as any).message,
    });
  }
};

/**
 * Get refund requests with filtering and pagination
 * Query params: status (pending|completed|partial), startDate, endDate, page, limit
 */
export const getRefundRequests = async (req: any, res: any) => {
  try {
    const { status = "completed", startDate, endDate, page, limit } = req.query;
    const { page: p, limit: l } = validatePagination(page, limit);

    // Build match filter
    const matchFilter: any = {
      paymentStatus: "refunded",
    };

    // Add date range if provided
    if (startDate && endDate) {
      matchFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Filter by refund type if specified
    if (status && ["pending", "completed", "partial"].includes(status)) {
      if (status === "pending") {
        matchFilter.shouldRefundAt = { $gt: new Date() };
      } else if (status === "completed") {
        matchFilter.shouldRefundAt = { $lt: new Date() };
      }
      // partial: could be any paymentStatus="refunded"
    }

    // Count total
    const total = await Job.countDocuments(matchFilter);

    // Aggregation pipeline
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
          from: "quotations",
          localField: "quotationId",
          foreignField: "_id",
          as: "quotation",
        },
      },
      {
        $addFields: {
          customer: { $arrayElemAt: ["$customer", 0] },
          quotation: { $arrayElemAt: ["$quotation", 0] },
        },
      },
      {
        $project: {
          jobId: 1,
          jobName: 1,
          totalPrice: 1,
          paymentStatus: 1,
          shouldRefundAt: 1,
          collectedAt: 1,
          createdAt: 1,
          customer: {
            _id: 1,
            name: 1,
            mobileNumber: 1,
            email: 1,
          },
          quotation: {
            _id: 1,
            pricingBreakdown: 1,
            lineItems: 1,
          },
          refundType: {
            $cond: [
              { $eq: ["$shouldRefundAt", null] },
              "completed",
              {
                $cond: [
                  { $gte: ["$shouldRefundAt", new Date()] },
                  "pending",
                  "completed",
                ],
              },
            ],
          },
        },
      },
      { $sort: { createdAt: -1 } as any },
      { $skip: (p - 1) * l },
      { $limit: l },
    ] as any;

    const refunds = await (Job.aggregate as any)(pipeline);

    return res.status(200).json({
      success: true,
      data: refunds,
      pagination: {
        page: p,
        limit: l,
        total,
        pages: Math.ceil(total / l),
      },
    });
  } catch (error) {
    console.error("Error in getRefundRequests:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch refund requests",
      error: (error as any).message,
    });
  }
};
