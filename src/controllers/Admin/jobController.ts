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
    if (job.paymentStatus !== "prepaid") {
      return res.status(400).json({
        success: false,
        message: "Only prepaid jobs can be refunded",
      });
    }

    // Update job status
    job.paymentStatus = "refunded";
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
    if (job.paymentStatus !== "cash_collection" && job.paymentStatus !== "unpaid") {
      return res.status(400).json({
        success: false,
        message: "This job cannot be marked as collected",
      });
    }

    // Update job payment status
    job.paymentCollectionStatus = "collected";
    job.collectedAt = new Date();
    job.paymentStatus = "collected";
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
      await Technician.findByIdAndUpdate(
        job.technicianId,
        {
          $pull: { pendingPaymentJobs: jobId },
        }
      );
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
        job.preferredDate = {
          date: job.rescheduleRequest.requestedDate,
          startTime: job.rescheduleRequest.requestedDate,
          endTime: new Date(job.rescheduleRequest.requestedDate.getTime() + 2 * 60 * 60 * 1000),
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
      message: approved ? "Reschedule approved successfully" : "Reschedule rejected successfully",
      rescheduleRequest: job.rescheduleRequest,
    });
  } catch (err) {
    return next(err);
  }
};
