import Job from "../../models/Services/jobs.js";
import Technician from "../../models/Technician/Technician.js";
import Quotation from "../../models/Services/quotationModel.js";
import { Request, Response, NextFunction } from "express";

/**
 * CONSOLIDATED: POST /admin/job/:jobId/cancel-or-refund
 * Handles both cancellation and refund with body: { refundType?, isRefundOnly?, reason? }
 * - isRefundOnly=true: Just refund (refundJobController logic)
 * - isRefundOnly=false: Cancel + refund (cancelJobFromQueue logic)
 */
export const cancelOrRefund = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { jobId } = req.params;
    const {
      refundType = "auto",
      isRefundOnly = false,
      reason = "Refunded by admin",
    } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // REFUND ONLY LOGIC
    if (isRefundOnly) {
      if (job.paymentStatus?.status !== "prepaid") {
        return res.status(400).json({
          success: false,
          message: "Only prepaid jobs can be refunded",
        });
      }
      if (job.paymentStatus) {
        job.paymentStatus.status = "refunded";
      }
      job.steps.push({
        stepId: "STEP-" + (job.steps.length + 1),
        stepName: "Refunded",
        stepDescription: reason,
        adminId: req.adminId,
        createdAt: new Date(),
      });
    } else {
      // CANCEL LOGIC
      if (!["pending", "assigned", "reached"].includes(job.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel job with status: ${job.status}`,
        });
      }

      // Update job
      job.status = "cancelled";
      job.adminDecision = "refund";
      job.cancellationRequest = {
        reason,
        additionalInfo: `Cancelled by admin on ${new Date().toISOString()}`,
        cancelledAt: new Date(),
        status: "approved",
        approvedBy: "admin",
        approvedAt: new Date(),
        refundType: job.paymentStatus?.status === "prepaid" ? "full" : "none",
        refundAmount:
          job.paymentStatus?.status === "prepaid"
            ? job.pricing?.finalPrice || 0
            : 0,
      };

      // Auto refund if prepaid or partial based on refundType
      if (job.paymentStatus && job.paymentStatus.status === "prepaid") {
        if (refundType === "full") {
          job.paymentStatus.status = "refunded";
          job.paymentStatus.refundAt = new Date();
        } else if (refundType === "partial") {
          // Keep for later partial processing
          job.paymentStatus.refundAt = new Date();
        }
      }

      job.steps.push({
        stepId: "STEP-" + (job.steps.length + 1),
        stepName: "Cancelled by Admin",
        stepDescription: `Cancelled - ${reason}`,
        adminId: req.adminId,
        createdAt: new Date(),
      });
    }

    await job.save();

    return res.json({
      success: true,
      message: isRefundOnly
        ? "Refund processed successfully"
        : "Job cancelled successfully",
      data: {
        jobId: job._id,
        status: job.status,
        paymentStatus: job.paymentStatus?.status,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/job/:jobId/mark-collected
 * (Kept as is for payment collection)
 */
export const markPaymentCollected = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { jobId } = req.params;
    const { paymentAmount, paymentMethod, transactionId } = req.body;

    const job = await Job.findById(jobId)
      .populate("technicianId")
      .populate("userId");

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (
      job.paymentStatus?.status !== "cash_collection" &&
      job.paymentStatus?.status !== "unpaid"
    ) {
      return res.status(400).json({
        success: false,
        message: "This job cannot be marked as collected",
      });
    }

    job.paymentCollectionStatus = "collected";
    job.collectedAt = new Date();
    if (job.paymentStatus) {
      job.paymentStatus.status = "collected";
    }
    job.steps.push({
      stepId: "STEP-" + (job.steps.length + 1),
      stepName: "Payment Collected",
      stepDescription: `Payment collected from technician - Amount: ${paymentAmount}`,
      adminId: req.adminId,
      paymentAmount,
      paymentMethod,
      transactionId,
      createdAt: new Date(),
    });

    await job.save();

    if (job.technicianId) {
      await Technician.findByIdAndUpdate(job.technicianId, {
        $pull: { pendingPaymentJobs: jobId },
      });
    }

    return res.json({
      success: true,
      message: "Payment collected and recorded successfully",
      job,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/technician/:technicianId/blacklist
 */
export const blacklistTechnician = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { technicianId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res
        .status(400)
        .json({ success: false, message: "Blacklist reason is required" });
    }

    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res
        .status(404)
        .json({ success: false, message: "Technician not found" });
    }

    technician.isBlacklisted = true;
    technician.blacklistedAt = new Date();
    technician.blacklistReason = reason;

    await technician.save();

    return res.json({
      success: true,
      message: "Technician blacklisted successfully",
      technician,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/technician/:technicianId/remove-blacklist
 */
export const removeBlacklist = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { technicianId } = req.params;

    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res
        .status(404)
        .json({ success: false, message: "Technician not found" });
    }

    if (!technician.isBlacklisted) {
      return res
        .status(400)
        .json({ success: false, message: "Technician is not blacklisted" });
    }

    technician.isBlacklisted = false;
    technician.blacklistedAt = undefined as any;
    technician.blacklistReason = undefined as any;

    await technician.save();

    return res.json({
      success: true,
      message: "Technician removed from blacklist successfully",
      technician,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/job/:jobId/assign
 * (Kept as is)
 */
export const assignJobToTechnician = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { jobId } = req.params;
    const { technicianId } = req.body;

    if (!technicianId) {
      return res
        .status(400)
        .json({ success: false, message: "technicianId is required" });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res
        .status(404)
        .json({ success: false, message: "Technician not found" });
    }

    if (technician.isBlacklisted) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign job to blacklisted technician",
      });
    }

    if (technician.currentStatus === "offline") {
      return res
        .status(400)
        .json({ success: false, message: "Technician is currently offline" });
    }

    job.technicianId = technician._id;
    job.status = "assigned";
    job.assignedAt = new Date();
    job.steps.push({
      stepId: "STEP-" + (job.steps.length + 1),
      stepName: "Assigned to Technician",
      stepDescription: `Job assigned to ${technician.fullName} by admin`,
      adminId: req.adminId,
      createdAt: new Date(),
    });

    await job.save();

    return res.json({
      success: true,
      message: "Job assigned to technician successfully",
      data: {
        jobId: job._id,
        technicianId: technician._id,
        technicianName: technician.fullName,
        status: job.status,
        assignedAt: job.assignedAt,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/job/:jobId/details
 * (Kept as is)
 */
export const getJobDetailsFull = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId)
      .populate("userId", "name mobileNumber email")
      .populate(
        "technicianId",
        "technicianId fullName mobileNumber averageRating yearsOfExperience",
      )
      .populate("services", "name category price")
      .exec();

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    let quotation = null;
    if (job.quotationId) {
      quotation = await Quotation.findById(job.quotationId);
    }

    return res.json({
      success: true,
      data: {
        job: {
          _id: job._id,
          jobId: job.jobId,
          status: job.status,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        },
        customer: job.userId || {},
        technician: job.technicianId || null,
        services: job.bookedServices || [],
        address: {
          primary: job.address,
          relocationAddresses: {
            fromAddress: job.fromAddress,
            toAddress: job.toAddress,
          },
        },
        quotation: quotation || {
          message: "No quotation linked",
          pricingBreakdown: {
            subTotal: job.pricing?.subTotal,
            gst: (job.pricing?.subTotal || 0) * 0.18,
            total: (job.pricing?.subTotal || 0) * 1.18,
          },
        },
        pricing: {
          totalPrice: job.pricing?.finalPrice,
          paymentStatus: job.paymentStatus?.status,
          paidAt: job.paymentStatus?.paidAt,
          collectedAt: job.collectedAt,
          shouldRefundAt: job.paymentStatus?.refundAt,
        },
        scheduling: {
          preferredDate: job.preferredDate,
          assignedAt: job.assignedAt,
          rescheduleRequest: job.rescheduleRequest,
          rescheduleAttempts: job.rescheduleAttempts,
        },
        adminNotes: {
          adminContactRequired: job.adminContactRequired,
          adminDecision: job.adminDecision,
        },
        timeline: job.steps || [],
        rating: job.ratingByTechnician || null,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const getAllJobsByAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      type, // assigned | unassigned
      status,
      search,
      date,
      page = 1,
      limit = 20,
    } = req.query;

    const filter: any = {};

    const allowedStatuses = [
      "pending",
      "assigned",
      "reached",
      "in_progress",
      "completed",
      "cancelled",
      "rescheduled",
      "fullAndPaid",
      "reassigned",
      "rejected",
    ];

    // ===== STATUS FILTER (FIXED) =====
    if (status) {
      if (!allowedStatuses.includes(status as string)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }
      filter.status = status;
    }

    // ===== ASSIGNED / UNASSIGNED =====
    if (type === "assigned") {
      filter.technicianId = { $exists: true, $ne: null };
    }

    if (type === "unassigned") {
      filter.$or = [
        { technicianId: null },
        { technicianId: { $exists: false } },
      ];
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
      const regex = new RegExp(search as string, "i");

      filter.$or = [
        { jobId: regex },
        { "address.fullName": regex },
        { "address.mobileNumber": regex },
      ];
    }

    // ===== PAGINATION =====
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // ===== QUERY =====
    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .populate("technicianId", "fullName mobileNumber technicianId")
      .populate("userId", "fullName mobileNumber")
      .lean();

    const total = await Job.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Jobs fetched successfully",
      data: jobs,
      pagination: {
        current: pageNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    return next(error);
  }
};
