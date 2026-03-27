import Job from "../../models/Services/jobs.js";
import Technician from "../../models/Technician/Technician.js";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";

const validatePagination = (page: any, limit: any) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  return { pageNum, limitNum };
};

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

/**
 * GET /admin/reschedule-requests
 * List with filters: requestType, status, dates, pagination
 */
export const getRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, requestType = "all", status = "all", page = "1", limit = "10" } = req.query;
    const { pageNum: p, limitNum: l } = validatePagination(page, limit);

    let matchStage: any = {
      $or: [
        { "rescheduleRequest.status": { $ne: null } },
        { "reassignRequest.status": { $ne: null } },
        { "cancellationRequest.status": { $ne: null } },
      ],
    };

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

    if (status !== "all") {
      if (status === "reschedule") matchStage["rescheduleRequest.status"] = "pending";
      else if (status === "reassign") matchStage["reassignRequest.status"] = "pending";
      else if (status === "cancel") matchStage["cancellationRequest.status"] = "pending";
    }

    if (startDate || endDate) {
      const df: any = {};
      if (startDate) df.$gte = new Date(startDate as string);
      if (endDate) {
        const e = new Date(endDate as string);
        e.setHours(23, 59, 59, 999);
        df.$lte = e;
      }
      matchStage.createdAt = df;
    }

    const pipeline = [
      { $match: matchStage },
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "customer" } },
      { $lookup: { from: "technicians", localField: "technicianId", foreignField: "_id", as: "technician" } },
      { $lookup: { from: "services", localField: "services", foreignField: "_id", as: "serviceDetails" } },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$technician", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      { $skip: (p - 1) * l },
      { $limit: l },
      {
        $project: {
          jobId: 1,
          status: 1,
          "customer.name": 1,
          "customer.mobileNumber": 1,
          "technician.fullName": 1,
          "technician.averageRating": 1,
          rescheduleRequest: 1,
          reassignRequest: 1,
          cancellationRequest: 1,
          serviceDetails: { name: 1, category: 1 },
          createdAt: 1,
        },
      },
    ];

    const [requests, total] = await Promise.all([
      Job.aggregate(pipeline as any[]) as any,
      Job.countDocuments(matchStage),
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/reschedule-requests/:requestId
 * Get details + available technicians for reassignment
 */
export const getRequestDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    if (!isValidId(requestId)) {
      return res.status(400).json({ success: false, message: "Invalid requestId format" });
    }

    const job = await Job.findById(requestId)
      .populate("userId", "name mobileNumber email address")
      .populate("technicianId", "technicianId fullName mobileNumber averageRating yearsOfExperience address")
      .populate("reassignRequest.requestedTechnicianId", "technicianId fullName mobileNumber averageRating yearsOfExperience")
      .populate("services", "name category price");

    if (!job) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    let availableTechnicians: any[] = [];
    if (job.reassignRequest?.status) {
      availableTechnicians = await Technician.find(
        { currentStatus: "available", isBlacklisted: false, isActive: true, _id: { $ne: job.technicianId } },
        "technicianId fullName mobileNumber averageRating yearsOfExperience totalJobsCompleted"
      )
        .sort({ averageRating: -1, totalJobsCompleted: -1 })
        .limit(10);
    }

    res.json({
      success: true,
      data: {
        job: { _id: job._id, jobId: job.jobId, status: job.status, createdAt: job.createdAt },
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
 * CONSOLIDATED: POST /admin/reschedule-requests/:requestId/process
 * Unified endpoint for: approve, reject, reassign, cancel
 * Body: { action: "approve"|"reject", requestType: "reschedule"|"reassign"|"cancellation", technicianId?, refundType?, reason? }
 */
export const processRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const { action, requestType, technicianId, refundType = "full", reason } = req.body;

    if (!isValidId(requestId)) {
      return res.status(400).json({ success: false, message: "Invalid requestId format" });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "action must be approve or reject" });
    }

    if (!["reschedule", "reassign", "cancellation"].includes(requestType)) {
      return res.status(400).json({ success: false, message: "Invalid requestType" });
    }

    const job = await Job.findById(requestId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // ===== RESCHEDULE LOGIC =====
    if (requestType === "reschedule") {
      if (!job.rescheduleRequest || job.rescheduleRequest.status !== "pending") {
        return res.status(400).json({ success: false, message: "No pending reschedule request" });
      }

      if (action === "approve") {
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
      } else {
        job.rescheduleRequest.status = "rejected";
        job.rescheduleRequest.approvedBy = "admin";
        job.rescheduleRequest.approvedAt = new Date();
      }

      job.steps.push({
        stepId: "STEP-" + (job.steps.length + 1),
        stepName: action === "approve" ? "Reschedule Approved" : "Reschedule Rejected",
        stepDescription: action === "approve" ? "Admin approved reschedule" : `Admin rejected - ${reason || ""}`,
        adminId: req.adminId,
        createdAt: new Date(),
      });
    }

    // ===== REASSIGN LOGIC =====
    else if (requestType === "reassign") {
      if (!job.reassignRequest || job.reassignRequest.status !== "pending") {
        return res.status(400).json({ success: false, message: "No pending reassignment request" });
      }

      if (action === "approve") {
        if (!technicianId || !isValidId(technicianId)) {
          return res.status(400).json({ success: false, message: "Valid technicianId required for reassignment" });
        }

        const newTech = await Technician.findById(technicianId);
        if (!newTech || newTech.isBlacklisted || newTech.currentStatus === "offline") {
          return res.status(400).json({ success: false, message: "Selected technician not available" });
        }

        const oldTechId = job.technicianId;
        job.technicianId = new mongoose.Types.ObjectId(technicianId);
        job.reassignRequest.status = "completed";
        job.reassignRequest.requestedTechnicianId = new mongoose.Types.ObjectId(technicianId);
        job.reassignRequest.approvedBy = "admin";
        job.reassignRequest.approvedAt = new Date();

        job.steps.push({
          stepId: "STEP-" + (job.steps.length + 1),
          stepName: "Reassigned to New Technician",
          stepDescription: `Reassigned from ${oldTechId} to ${technicianId}`,
          adminId: req.adminId,
          createdAt: new Date(),
        });
      } else {
        job.reassignRequest.status = "rejected";
        job.reassignRequest.approvedBy = "admin";
        job.reassignRequest.approvedAt = new Date();

        job.steps.push({
          stepId: "STEP-" + (job.steps.length + 1),
          stepName: "Reassignment Rejected",
          stepDescription: `Rejected - ${reason || ""}`,
          adminId: req.adminId,
          createdAt: new Date(),
        });
      }
    }

    // ===== CANCELLATION LOGIC =====
    else if (requestType === "cancellation") {
      if (!job.cancellationRequest || job.cancellationRequest.status !== "pending") {
        return res.status(400).json({ success: false, message: "No pending cancellation request" });
      }

      if (action === "approve") {
        if (!["full", "partial", "none"].includes(refundType)) {
          return res.status(400).json({ success: false, message: "Invalid refundType" });
        }

        let refundAmount = 0;
        if (refundType === "full" && job.paymentStatus?.status === "prepaid") {
          refundAmount = job.pricing?.finalPrice || 0;
        } else if (refundType === "partial" && job.paymentStatus?.status === "prepaid") {
          refundAmount = (job.pricing?.finalPrice || 0) * 0.9;
        }

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
          stepDescription: `Cancelled - Refund: ${refundType} (${refundAmount})`,
          adminId: req.adminId,
          createdAt: new Date(),
        });
      } else {
        job.cancellationRequest.status = "rejected";
        job.cancellationRequest.approvedBy = "admin";
        job.cancellationRequest.approvedAt = new Date();

        job.steps.push({
          stepId: "STEP-" + (job.steps.length + 1),
          stepName: "Cancellation Rejected",
          stepDescription: `Rejected - ${reason || ""}`,
          adminId: req.adminId,
          createdAt: new Date(),
        });
      }
    }

    await job.save();

    res.json({
      success: true,
      message: `${requestType} ${action}ed successfully`,
      data: {
        jobId: job._id,
        requestType,
        status: (requestType === "reschedule" ? job.rescheduleRequest?.status : requestType === "reassign" ? job.reassignRequest?.status : job.cancellationRequest?.status) || "unknown",
      },
    });
  } catch (err) {
    return next(err);
  }
};
