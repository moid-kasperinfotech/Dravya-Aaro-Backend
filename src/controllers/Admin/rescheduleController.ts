import Job from "../../models/Services/jobs.js";
import Technician from "../../models/Technician/Technician.js";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

/**
 * Helper: Validate ObjectId
 */
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Helper: Validate pagination
 */
function validatePagination(page: any, limit: any) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  return { pageNum, limitNum };
}

/**
 * GET /admin/reschedule-requests
 * List all reschedule/reassign/cancellation requests with filters
 * Query params:
 *   - startDate: ISO date string (optional)
 *   - endDate: ISO date string (optional)
 *   - requestType: "all" | "customer" | "technician" (optional, default: all)
 *   - status: "all" | "pending" | "reschedule" | "reassign" | "cancelled" (optional)
 *   - page: number (optional, default: 1)
 *   - limit: number (optional, default: 10, max: 100)
 */
export const getRescheduleRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      startDate,
      endDate,
      requestType = "all",
      status = "all",
      page = "1",
      limit = "10",
    } = req.query;

    // Validate pagination
    const { pageNum, limitNum } = validatePagination(page, limit);

    // Build match pipeline
    const matchStage: any = {
      $or: [
        { "rescheduleRequest.status": { $ne: null } },
        { "reassignRequest.status": { $ne: null } },
        { "cancellationRequest.status": { $ne: null } },
      ],
    };

    // Filter by request type
    if (requestType !== "all") {
      if (requestType === "customer") {
        matchStage.$or = [
          { "rescheduleRequest.requestedBy": "user" },
          { "reassignRequest.requestedBy": "user" },
          { "cancellationRequest.requestedBy": "user" },
        ];
      } else if (requestType === "technician") {
        matchStage.$or = [
          { "rescheduleRequest.requestedBy": "technician" },
          { "reassignRequest.requestedBy": "technician" },
          { "cancellationRequest.requestedBy": "technician" },
        ];
      }
    }

    // Filter by request status
    if (status !== "all") {
      if (status === "reschedule") {
        matchStage["rescheduleRequest.status"] = "pending";
      } else if (status === "reassign") {
        matchStage["reassignRequest.status"] = "pending";
      } else if (status === "cancelled") {
        matchStage["cancellationRequest.status"] = {
          $in: ["pending", "approved", "rejected"],
        };
      } else if (status === "pending") {
        matchStage.$or = [
          { "rescheduleRequest.status": "pending" },
          { "reassignRequest.status": "pending" },
          { "cancellationRequest.status": "pending" },
        ];
      }
    }

    // Filter by date range
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) {
        const start = new Date(startDate as string);
        dateFilter.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      matchStage.createdAt = dateFilter;
    }

    // Aggregation pipeline
    const pipeline: any[] = [
      { $match: matchStage },
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
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$technician", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
      {
        $project: {
          jobId: 1,
          status: 1,
          "customer.name": 1,
          "customer._id": 1,
          "customer.mobileNumber": 1,
          "technician.fullName": 1,
          "technician._id": 1,
          "technician.averageRating": 1,
          rescheduleRequest: 1,
          reassignRequest: 1,
          cancellationRequest: 1,
          serviceDetails: { name: 1, category: 1 },
          createdAt: 1,
          requestType: {
            $cond: [
              { $eq: ["$rescheduleRequest.status", null] },
              {
                $cond: [
                  { $eq: ["$reassignRequest.status", null] },
                  "cancellation",
                  "reassignment",
                ],
              },
              "rescheduling",
            ],
          },
        },
      },
    ];

    const requests = await Job.aggregate(pipeline as any);
    const totalCount = await Job.countDocuments(matchStage as any);

    return res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/reschedule-requests/:requestId
 * Get details of a specific reschedule/reassign/cancellation request
 */
export const getRescheduleRequestDetails = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { requestId } = _req.params;

    if (!isValidObjectId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid requestId format",
      });
    }

    const job = await Job.findById(requestId)
      .populate("userId", "name mobileNumber email address")
      .populate(
        "technicianId",
        "technicianId fullName mobileNumber averageRating yearsOfExperience address",
      )
      .populate(
        "reassignRequest.requestedTechnicianId",
        "technicianId fullName mobileNumber averageRating yearsOfExperience",
      )
      .populate("services", "name category price");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Get available technicians for reassignment
    let availableTechnicians: any[] = [];
    if (job.reassignRequest?.status) {
      availableTechnicians = await Technician.find(
        {
          currentStatus: "available",
          isBlacklisted: false,
          isActive: true,
          _id: { $ne: job.technicianId }, // Exclude current technician
        },
        "technicianId fullName mobileNumber averageRating yearsOfExperience totalJobsCompleted",
      )
        .sort({ averageRating: -1, totalJobsCompleted: -1 })
        .limit(10);
    }

    return res.status(200).json({
      success: true,
      data: {
        job: {
          _id: job._id,
          jobId: job.jobId,
          status: job.status,
          createdAt: job.createdAt,
        },
        customer: job.userId || {},
        originalTechnician: job.technicianId || null,
        serviceDetails: job.bookedServices || [],
        rescheduleRequest: job.rescheduleRequest,
        reassignRequest: job.reassignRequest,
        cancellationRequest: job.cancellationRequest,
        availableTechnicians,
        jobTimeline: job.steps || [],
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/reschedule-requests/:requestId/approve
 * Approve a reschedule request and update job preferredDate
 */
export const approveRescheduleRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { requestId } = req.params;

    if (!isValidObjectId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid requestId format",
      });
    }

    const job = await Job.findById(requestId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (!job.rescheduleRequest || job.rescheduleRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "No pending reschedule request for this job",
      });
    }

    // Update job
    job.rescheduleRequest.status = "accepted";
    job.rescheduleRequest.approvedBy = "admin";
    job.rescheduleRequest.approvedAt = new Date();

    if (job.rescheduleRequest.requestedDate) {
      job.preferredDate = {
        startTime: job.rescheduleRequest.requestedDate.startTime,
        endTime: job.rescheduleRequest.requestedDate.endTime,
        duration: 2,
      };
    }

    job.steps.push({
      stepId: "STEP-" + (job.steps.length + 1),
      stepName: "Reschedule Approved",
      stepDescription: "Admin approved the reschedule request",
      adminId: req.adminId,
      createdAt: new Date(),
    });

    await job.save();

    // TODO: Send notification to technician and customer

    return res.status(200).json({
      success: true,
      message: "Reschedule approved successfully",
      data: {
        jobId: job._id,
        newDate: job.preferredDate,
        status: "accepted",
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/reschedule-requests/:requestId/reject
 * Reject a reschedule request with reason
 */
export const rejectRescheduleRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { requestId } = req.params;
    const { reason = "Rejected by admin" } = req.body;

    if (!isValidObjectId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid requestId format",
      });
    }

    const job = await Job.findById(requestId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (!job.rescheduleRequest || job.rescheduleRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "No pending reschedule request for this job",
      });
    }

    // Update job
    job.rescheduleRequest.status = "rejected";
    job.rescheduleRequest.approvedBy = "admin";
    job.rescheduleRequest.approvedAt = new Date();

    job.steps.push({
      stepId: "STEP-" + (job.steps.length + 1),
      stepName: "Reschedule Rejected",
      stepDescription: `Admin rejected reschedule - Reason: ${reason}`,
      adminId: req.adminId,
      createdAt: new Date(),
    });

    await job.save();

    // TODO: Send notification to technician

    return res.status(200).json({
      success: true,
      message: "Reschedule request rejected successfully",
      data: {
        jobId: job._id,
        status: "rejected",
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/reschedule-requests/:requestId/approve-reassign
 * Approve a reassignment request and assign job to new technician
 */
export const approveReassignRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { requestId } = req.params;
    const { technicianId } = req.body;

    if (!isValidObjectId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid requestId format",
      });
    }

    if (!technicianId || !isValidObjectId(technicianId)) {
      return res.status(400).json({
        success: false,
        message: "Valid technicianId is required",
      });
    }

    const job = await Job.findById(requestId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (!job.reassignRequest || job.reassignRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "No pending reassignment request for this job",
      });
    }

    // Verify new technician exists and is available
    const newTechnician = await Technician.findById(technicianId);
    if (!newTechnician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    if (
      newTechnician.isBlacklisted ||
      newTechnician.currentStatus === "offline"
    ) {
      return res.status(400).json({
        success: false,
        message: "Selected technician is not available",
      });
    }

    // Update job
    const oldTechnicianId = job.technicianId;
    job.technicianId = new mongoose.Types.ObjectId(technicianId);
    job.reassignRequest.status = "completed";
    job.reassignRequest.requestedTechnicianId = new mongoose.Types.ObjectId(
      technicianId,
    );
    job.reassignRequest.approvedBy = "admin";
    job.reassignRequest.approvedAt = new Date();

    job.steps.push({
      stepId: "STEP-" + (job.steps.length + 1),
      stepName: "Reassigned to New Technician",
      stepDescription: `Job reassigned from ${oldTechnicianId} to ${technicianId}`,
      adminId: req.adminId,
      createdAt: new Date(),
    });

    await job.save();

    // TODO: Send notification to old and new technicians, and customer

    return res.status(200).json({
      success: true,
      message: "Job reassigned successfully",
      data: {
        jobId: job._id,
        newTechnicianId: technicianId,
        status: job.status,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/reschedule-requests/:requestId/approve-cancellation
 * Approve a job cancellation with refund processing
 */
export const approveCancellationRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { requestId } = req.params;
    const { refundType = "full" } = req.body;

    if (!isValidObjectId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid requestId format",
      });
    }

    if (!["full", "partial", "none"].includes(refundType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid refundType. Must be 'full', 'partial', or 'none'",
      });
    }

    const job = await Job.findById(requestId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (
      !job.cancellationRequest ||
      job.cancellationRequest.status !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "No pending cancellation request for this job",
      });
    }

    // Calculate refund amount
    let refundAmount = 0;
    if (refundType === "full" && job.paymentStatus?.status === "prepaid") {
      refundAmount = job.pricing?.finalPrice || 0;
    } else if (
      refundType === "partial" &&
      job.paymentStatus?.status === "prepaid"
    ) {
      // 90% refund for partial
      refundAmount = (job.pricing?.finalPrice || 0) * 0.9;
    }

    // Update job
    job.status = "cancelled";
    job.cancellationRequest.status = "approved";
    job.cancellationRequest.refundType = refundType;
    job.cancellationRequest.refundAmount = refundAmount;
    job.cancellationRequest.approvedBy = "admin";
    job.cancellationRequest.approvedAt = new Date();

    if (refundAmount > 0) {
      if (job.paymentStatus) {
        job.paymentStatus.status = "refunded";
        job.paymentStatus.refundAt = new Date();
      }
    }

    job.steps.push({
      stepId: "STEP-" + (job.steps.length + 1),
      stepName: "Job Cancelled",
      stepDescription: `Job cancelled by admin - Refund Type: ${refundType}, Amount: ${refundAmount}`,
      adminId: req.adminId,
      createdAt: new Date(),
    });

    await job.save();

    // TODO: Process refund through payment gateway
    // TODO: Send notification to customer and technician

    return res.status(200).json({
      success: true,
      message: "Job cancellation approved",
      data: {
        jobId: job._id,
        status: "cancelled",
        refundType,
        refundAmount,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/reschedule-requests/:requestId/reject-cancellation
 * Reject a cancellation request
 */
export const rejectCancellationRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { requestId } = req.params;
    const { reason = "Rejected by admin" } = req.body;

    if (!isValidObjectId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid requestId format",
      });
    }

    const job = await Job.findById(requestId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (
      !job.cancellationRequest ||
      job.cancellationRequest.status !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "No pending cancellation request for this job",
      });
    }

    // Update job
    job.cancellationRequest.status = "rejected";
    job.cancellationRequest.approvedBy = "admin";
    job.cancellationRequest.approvedAt = new Date();

    job.steps.push({
      stepId: "STEP-" + (job.steps.length + 1),
      stepName: "Cancellation Request Rejected",
      stepDescription: `Cancellation request rejected - Reason: ${reason}`,
      adminId: req.adminId,
      createdAt: new Date(),
    });

    await job.save();

    // TODO: Send notification to customer

    return res.status(200).json({
      success: true,
      message: "Cancellation request rejected",
      data: {
        jobId: job._id,
        status: job.status,
      },
    });
  } catch (err) {
    return next(err);
  }
};
