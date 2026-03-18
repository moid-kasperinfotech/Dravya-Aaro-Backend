import Job from "../../models/Services/jobs.js";
import Technician from "../../models/Technician/Technician.js";
import { Request, Response, NextFunction } from "express";

export const refundJobController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { jobId } = req.params;
    const { reason } = req.body;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Only prepaid jobs can be refunded
    if (job.paymentStatus?.status !== "prepaid") {
      return res.status(400).json({
        success: false,
        message: "Only prepaid jobs can be refunded",
      });
    }

    // Update job status
    job.paymentStatus.status = "refunded";
    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Refunded",
      stepDescription: "Payment refunded to user by admin",
      adminId: req.adminId,
      reason,
      createdAt: new Date(),
    });

    await job.save();

    // TODO: Process actual refund through payment gateway
    // TODO: Send notification to user about refund
    // TODO: Log refund transaction

    return res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      job,
    });
  } catch (err) {
    return next(err);
  }
};

export const markPaymentCollectedController = async (
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
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Only jobs with cash collection can be marked as collected
    if (
      job.paymentStatus?.status !== "cash_collection" &&
      job.paymentStatus?.status !== "unpaid"
    ) {
      return res.status(400).json({
        success: false,
        message: "This job cannot be marked as collected",
      });
    }

    // Update job payment status
    job.paymentCollectionStatus = "collected";
    job.collectedAt = new Date();
    job.paymentStatus.status = "collected";

    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Payment Collected",
      stepDescription: `Payment collected from technician - Amount: ${paymentAmount}`,
      adminId: req.adminId,
      paymentAmount,
      paymentMethod,
      transactionId,
      createdAt: new Date(),
    });

    await job.save();

    // Remove from technician's pending payment jobs
    if (job.technicianId) {
      await Technician.findByIdAndUpdate(job.technicianId, {
        $pull: { pendingPaymentJobs: jobId },
      });
    }

    // TODO: Update technician earnings/wallet
    // TODO: Send notification to technician about payment received
    // TODO: Log payment collection transaction

    return res.status(200).json({
      success: true,
      message: "Payment collected and recorded successfully",
      job,
    });
  } catch (err) {
    return next(err);
  }
};

export const blacklistTechnicianController = async (
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
        message: "Blacklist reason is required",
      });
    }

    const technician = await Technician.findById(technicianId);

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    technician.isBlacklisted = true;
    technician.blacklistedAt = new Date();
    technician.blacklistReason = reason;

    await technician.save();

    // TODO: Send notification to technician about blacklisting
    // TODO: Log blacklist action
    // TODO: Cancel all pending jobs assigned to this technician

    return res.status(200).json({
      success: true,
      message: "Technician blacklisted successfully",
      technician,
    });
  } catch (err) {
    return next(err);
  }
};

export const removeBlacklistController = async (
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

    if (!technician.isBlacklisted) {
      return res.status(400).json({
        success: false,
        message: "Technician is not blacklisted",
      });
    }

    technician.isBlacklisted = false;
    technician.blacklistedAt = undefined as any;
    technician.blacklistReason = undefined as any;

    await technician.save();

    // TODO: Send notification to technician about removal from blacklist
    // TODO: Log blacklist removal action

    return res.status(200).json({
      success: true,
      message: "Technician removed from blacklist successfully",
      technician,
    });
  } catch (err) {
    return next(err);
  }
};

export const approveRescheduleController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { jobId } = req.params;
    const { approved, reason } = req.body;

    if (typeof approved !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "approved field (boolean) is required",
      });
    }

    const job = await Job.findById(jobId);

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

    if (approved) {
      // Admin approves the reschedule
      job.rescheduleRequest.status = "accepted";
      job.rescheduleRequest.approvedBy = "admin";
      job.rescheduleRequest.approvedAt = new Date();

      // Update job preferredDate with new date
      if (job.rescheduleRequest.requestedDate) {
        job.rescheduled = {
          preferredDate: job.rescheduleRequest.requestedDate,
          reason: job.rescheduleRequest.reason,
          additionalInfo: job.rescheduleRequest.additionalInfo,
        };
      }

      job.steps.push({
        stepId: "STEP-" + job.steps.length + 1,
        stepName: "Reschedule Approved",
        stepDescription: "Admin approved the reschedule request",
        adminId: req.adminId,
        createdAt: new Date(),
      });
    } else {
      // Admin rejects the reschedule
      job.rescheduleRequest.status = "rejected";
      job.rescheduleRequest.approvedBy = "admin";
      job.rescheduleRequest.approvedAt = new Date();

      job.steps.push({
        stepId: "STEP-" + job.steps.length + 1,
        stepName: "Reschedule Rejected",
        stepDescription: `Admin rejected reschedule - Reason: ${reason || "No reason provided"}`,
        adminId: req.adminId,
        createdAt: new Date(),
      });
    }

    await job.save();

    // TODO: Send notification to technician and user about admin decision

    return res.status(200).json({
      success: true,
      message: approved
        ? "Reschedule approved successfully"
        : "Reschedule rejected successfully",
      rescheduleRequest: job.rescheduleRequest,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Assign a job to a technician from the live queue
 * POST /admin/job/:jobId/assign
 * body: { technicianId }
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
      return res.status(400).json({
        success: false,
        message: "technicianId is required in request body",
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Verify technician exists and is available
    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    // Check if technician is blacklisted
    if (technician.isBlacklisted) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign job to blacklisted technician",
      });
    }

    // Check if technician is available
    if (technician.currentStatus === "offline") {
      return res.status(400).json({
        success: false,
        message: "Technician is currently offline",
      });
    }

    // check if technician have vacant schedule for current job
    const conflictJob = await Job.findOne({
      technicianId: technicianId,
      status: { $in: ["assigned", "reached", "in_progress"] },
      _id: { $ne: jobId },
      $or: [
        {
          "preferredDate.startTime": { $lte: job.preferredDate?.endTime },
          "preferredDate.endTime": { $gte: job.preferredDate?.startTime },
        },
      ],
    });

    if (conflictJob) {
      return res.status(400).json({
        success: false,
        message: "Technician already has a job in this time slot",
      });
    }

    // Update job
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

    // TODO: Send notification to technician about new job assignment
    // TODO: Update technician's active jobs count

    return res.status(200).json({
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
 * Cancel a job from the live queue
 * POST /admin/job/:jobId/cancel
 * body: { reason, adminId }
 */
export const cancelJobFromQueue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { jobId } = req.params;
    const { reason = "Cancelled by admin" } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if job is cancellable (pending or assigned)
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

    // If job was prepaid, mark for refund
    if (job.paymentStatus?.status === "prepaid") {
      job.paymentStatus.status = "refunded";
      job.paymentStatus.refundAt = new Date();
      job.paymentStatus.refundAmount = job.pricing?.finalPrice || 0;
      job.paymentStatus.refundType = "full";
    }

    job.steps.push({
      stepId: "STEP-" + (job.steps.length + 1),
      stepName: "Cancelled by Admin",
      stepDescription: `Job cancelled - Reason: ${reason}`,
      adminId: req.adminId,
      createdAt: new Date(),
    });

    await job.save();

    // TODO: Process refund if prepaid
    // TODO: Send notification to user and technician about cancellation
    // TODO: Release technician from this job

    return res.status(200).json({
      success: true,
      message: "Job cancelled successfully",
      data: {
        jobId: job._id,
        status: job.status,
        paymentStatus: job.paymentStatus,
        refundStatus:
          job.paymentStatus?.status === "refunded"
            ? "Marked for refund"
            : "N/A",
        cancelledAt: new Date(),
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get full job details with all nested data (customer, technician, service, quotation, timeline)
 * GET /admin/job/:jobId/details
 */
export const getJobDetailsFull = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { jobId } = req.params;

    // Fetch job with all populated references
    const job = await Job.findById(jobId)
      .populate("userId")
      .populate("technicianId")
      .populate("quotationId")
      .populate("bookedServices.serviceId")
      .exec();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Prepare comprehensive response
    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (err) {
    return next(err);
  }
};
