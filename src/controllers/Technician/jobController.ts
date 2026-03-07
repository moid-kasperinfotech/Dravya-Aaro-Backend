import mongoose from "mongoose";
import Job from "../../models/Services/jobs.js";
import { Request, Response, NextFunction } from "express";
import JobOtpVerification from "../../models/Services/jobOtpVerification.js";
import Quotation from "../../models/Services/quotation.js";

const allowedStatuses = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;

type JobStatus = (typeof allowedStatuses)[number];

interface JobFilter {
  status?: JobStatus;
  technicianId?: mongoose.Types.ObjectId;
}

export async function getJobController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { status, page, limit } = req.query;

    if (typeof status !== "string") {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (!allowedStatuses.includes(status as JobStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const filter: JobFilter = {};

    const typedStatus = status as JobStatus;

    if (
      typedStatus !== "pending" ||
      req.technician.accountType === "salaried"
    ) {
      filter.technicianId = req.technicianId;
    }

    filter.status = typedStatus;

    // defaults + safety
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const skip = (pageNum - 1) * limitNum;

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      message: "Jobs fetched successfully",
      data: {
        jobs: jobs,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getJobByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId)
      .populate("services")
      .populate("userId");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.status(200).json({ message: "Job fetched successfully", job });
  } catch (error) {
    return next(error);
  }
}

export async function acceptJobController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.status !== "pending") {
      return res.status(400).json({ message: "Job is not pending" });
    }

    if (req.technician.accountType === "salaried") {
      return res
        .status(400)
        .json({ message: "salaried account can not accept job" });
    }

    job.status = "assigned";
    job.technicianId = req.technicianId;
    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Accepted",
      stepDescription: "Job accepted by technician",
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    return res.status(200).json({ message: "Job accepted successfully" });
  } catch (error) {
    return next(error);
  }
}

export async function cancelJobController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;
    const { reason, additionalInfo } = req.body;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (
      !job.technicianId ||
      job.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(400).json({ message: "Job is not assigned to you" });
    }

    if (job.status !== "assigned") {
      return res
        .status(400)
        .json({ message: "Job status is not assigned, can not be cancelled" });
    }
    const THREE_HOURS = 3 * 60 * 60 * 1000;

    if (job.preferredDate.startTime.getTime() > Date.now() + THREE_HOURS) {
      return res.status(400).json({
        message:
          "This job cannot be cancelled within 3 hours of the scheduled start time.",
      });
    }

    job.status = "cancelled";
    job.cancelReason = {
      reason,
      additionalInfo,
    };
    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Cancelled",
      stepDescription: "Job cancelled by technician",
      reason,
      additionalInfo,
      technicianId: req.technicianId,
      createdAt: new Date(),
    });
    await job.save();

    return res.status(200).json({ message: "Job cancelled successfully" });
  } catch (error) {
    return next(error);
  }
}

export const createQuoteController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { jobId } = req.params;
    const { items, additionalCharges = 0, notes, terms } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Quotation items are required",
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    let partsSubtotal = 0;
    let servicesSubtotal = 0;

    const formattedItems = items.map((item: any) => {
      const quantity = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const totalPrice = quantity * unitPrice;

      if (
        item.itemType === "custom_part" ||
        item.itemType === "replacement_part"
      ) {
        partsSubtotal += totalPrice;
      }

      if (item.itemType === "service") {
        servicesSubtotal += totalPrice;
      }

      return {
        itemType: item.itemType,
        productId: item.productId || null,
        itemName: item.itemName,
        brand: item.brand,
        description: item.description,
        quantity,
        unitPrice,
        totalPrice,
        warranty: {
          period: item?.warranty?.period || null,
        },
      };
    });

    const subtotal = partsSubtotal + servicesSubtotal + additionalCharges;

    const gstPercentage = 18;
    const gstAmount = (subtotal * gstPercentage) / 100;

    const totalAmount = subtotal + gstAmount;

    const validityDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    const quotationId = `QT-${Date.now()}`;

    const quotation = await Quotation.create({
      quotationId,
      jobId,
      technicianId: req.technicianId,
      customerId: job.userId,

      items: formattedItems,

      partsSubtotal,
      servicesSubtotal,
      additionalCharges,

      subtotal,

      gst: {
        percentage: gstPercentage,
        amount: gstAmount,
      },

      totalAmount,

      validity: {
        days: validityDays,
        expiresAt,
      },

      notes,
      terms,

      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Quotation created and sent for customer approval",
      data: quotation,
    });
  } catch (error) {
    return next(error);
  }
};

export const getQuotationSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { quotationId } = req.params;

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    if (
      !quotation.technicianId ||
      quotation.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Quotation is not assigned to you",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Quotation summary fetched successfully",
      data: quotation,
    });
  } catch (error) {
    return next(error);
  }
};

export const getQuotationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter: any = {
      technicianId: req.technicianId,
    };

    if (status) {
      filter.status = status;
    }

    const quotations = await Quotation.find(filter)
      .populate("jobId", "jobId status serviceType")
      .populate("technicianId", "fullName phoneNumber")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Quotation.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: quotations,
    });
  } catch (error) {
    return next(error);
  }
};

export const rejectQuotationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { quotationId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Reason are required",
      });
    }

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    quotation.status = "rejected";
    quotation.rejectionReason = reason;
    quotation.rejectedAt = new Date();

    await quotation.save();

    return res.status(200).json({
      success: true,
      message: "Quotation rejected successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export const approveQuotationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { quotationId } = req.params;

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    quotation.status = "approved";
    quotation.approvedAt = new Date();

    await quotation.save();

    return res.status(200).json({
      success: true,
      message: "Quotation approved successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export async function rescheduleJobController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;
    const { reason, additionalInfo, preferredDateByTechnician } = req.body;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (
      !job.technicianId ||
      job.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(400).json({ message: "Job is not assigned to you" });
    }

    if (job.status !== "assigned") {
      return res.status(400).json({
        message: "Job status is not assigned, can not be rescheduled",
      });
    }

    job.status = "rescheduled";
    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Rescheduled",
      stepDescription: "Job rescheduled by technician",
      reason,
      additionalInfo,
      preferredDateByTechnician,
      technicianId: req.technicianId,
      createdAt: new Date(),
    });
    await job.save();

    return res.status(200).json({ message: "Job rescheduled successfully" });
  } catch (error) {
    return next(error);
  }
}

export async function reachedJobController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (
      !job.technicianId ||
      job.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(400).json({ message: "Job is not assigned to you" });
    }

    if (job.status !== "assigned") {
      return res
        .status(400)
        .json({ message: "Job status is not assigned, can not be reached" });
    }

    job.status = "reached";
    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Reached",
      stepDescription: "technician reached job's location",
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    const otpId = "OTP-1";
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    await JobOtpVerification.create({
      otpId,
      jobId,
      userId: job.userId,
      otp,
    });

    return res.status(200).json({ message: "Job reached successfully" });
  } catch (error) {
    return next(error);
  }
}

export async function startJobController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;
    const { otp } = req.body;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (
      !job.technicianId ||
      job.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(400).json({ message: "Job is not assigned to you" });
    }

    if (job.status !== "reached") {
      return res
        .status(400)
        .json({ message: "Job status is not reached, can not be started" });
    }

    const jobOtpVerification = await JobOtpVerification.findOne({
      otpId: "OTP-1",
      jobId,
    });

    if (!jobOtpVerification) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (jobOtpVerification.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    job.status = "in_progress";
    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Started",
      stepDescription: "technician started job",
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    await JobOtpVerification.deleteOne({ otpId: "OTP-1", jobId });
    await JobOtpVerification.create({
      otpId: "OTP-2",
      jobId,
      userId: job.userId,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
    });

    return res.status(200).json({ message: "Job started successfully" });
  } catch (error) {
    return next(error);
  }
}

export async function completeJobController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;
    const { otp } = req.body;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (
      !job.technicianId ||
      job.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(400).json({ message: "Job is not assigned to you" });
    }

    if (job.status !== "in_progress") {
      return res.status(400).json({
        message: "Job status is not in_progress, can not be completed",
      });
    }

    const jobOtpVerification = await JobOtpVerification.findOne({
      otpId: "OTP-2",
      jobId,
    });

    if (!jobOtpVerification) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (jobOtpVerification.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    job.status = "completed";
    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Completed",
      stepDescription: "technician completed job",
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    await JobOtpVerification.deleteOne({ otpId: "OTP-2", jobId });

    return res.status(200).json({ message: "Job completed successfully" });
  } catch (error) {
    return next(error);
  }
}

export async function completePaymentCashController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId, amount } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (
      !job.technicianId ||
      job.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(400).json({ message: "Job is not assigned to you" });
    }

    if (job.status !== "completed") {
      return res
        .status(400)
        .json({ message: "Job status is not completed, can not be paid" });
    }

    if (Number(amount) !== job.totalPrice) {
      return res
        .status(400)
        .json({ message: "Invalid amount, can not be paid" });
    }

    job.payment = "paid";
    job.status = "fullAndPaid";
    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Paid",
      stepDescription: "user paid successfully by cash, technician approved",
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    return res.status(200).json({
      message: "Job paid successfully",
      info: {
        amount,
        method: "cash",
        time: new Date(),
        jobId,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function ratingByTechnicianController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;
    const { rating, additionalComment } = req.body;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (
      !job.technicianId ||
      job.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(400).json({ message: "Job is not assigned to you" });
    }

    if (job.status !== "completed") {
      return res
        .status(400)
        .json({ message: "Job status is not completed, can not be rated" });
    }

    if (job.payment !== "paid") {
      return res
        .status(400)
        .json({ message: "Job payment is not paid, can not be rated" });
    }

    job.ratingByTechnician = {
      rating,
      additionalComment,
    };
    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Rated",
      stepDescription: "user rated by technician",
      rating,
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    return res.status(200).json({
      message: "Job rated successfully",
      info: {
        rating,
        time: new Date(),
        jobId,
      },
    });
  } catch (error) {
    return next(error);
  }
}
