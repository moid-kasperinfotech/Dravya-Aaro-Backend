import mongoose from "mongoose";
import Job from "../../models/Services/jobs.js";
import Technician from "../../models/Technician/Technician.js";
import { Request, Response, NextFunction } from "express";
import JobOtpVerification from "../../models/Services/jobOtpVerification.js";
import Quotation from "../../models/Services/quotationModel.js";

const allowedStatuses = [
  "pending",
  "in_progress",
  "assigned",
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
    const { type, status, page = "1", limit = "20" } = req.query;

    const filter: JobFilter = {};
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Handle 'type' parameter for filtering job lists
    if (type) {
      const typeStr = type as string;

      if (typeStr === "pending") {
        // Pending jobs not assigned to this technician
        filter.status = "pending";
        // Don't filter by technicianId - show all pending jobs
      } else if (typeStr === "assigned") {
        // Jobs assigned to this technician (not yet completed)
        filter.technicianId = req.technicianId;
        filter.status = "assigned";
      } else if (typeStr === "completed") {
        // Jobs completed by this technician
        filter.technicianId = req.technicianId;
        filter.status = "completed";
      } else if (typeStr === "history") {
        // Job history - completed and cancelled jobs
        filter.technicianId = req.technicianId;
        filter.status = { $in: ["completed", "cancelled"] } as any;
      } else {
        return res.status(400).json({
          message:
            "Invalid type. Use: pending, assigned, completed, or history",
        });
      }
    } else if (status) {
      // Original status filtering for backward compatibility
      if (typeof status !== "string") {
        return res.status(400).json({ message: "Invalid status" });
      }

      if (!allowedStatuses.includes(status as JobStatus)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const typedStatus = status as JobStatus;

      if (
        typedStatus !== "pending" ||
        req.technician.accountType === "salaried"
      ) {
        filter.technicianId = req.technicianId;
      }

      filter.status = typedStatus;
    }

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalFilteredJob = await Job.countDocuments(filter);
    const totalJobs = await Job.countDocuments();

    return res.status(200).json({
      message: "Jobs fetched successfully",
      data: {
        jobs: jobs,
      },
      pagination: {
        total: totalJobs,
        filteredTotal: totalFilteredJob,
        currentPage: pageNum,
        pages: Math.ceil(totalJobs / limitNum),
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

    // Check if technician is blacklisted
    const technician = await Technician.findById(req.technicianId);
    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }

    if (technician.isBlacklisted) {
      return res.status(403).json({
        message: "You are blacklisted and cannot accept jobs",
        reason: technician.blacklistReason,
        blacklistedAt: technician.blacklistedAt,
      });
    }

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

    // Check prepaid job: if more than 24hrs have passed, notify admin but still allow
    if (
      job.paymentStatus?.status === "prepaid" &&
      (!job.assignedAt || job.assignedAt === null)
    ) {
      if (job.paymentStatus.paidAt) {
        const hoursSincePaid =
          (Date.now() - new Date(job.paymentStatus.paidAt as any).getTime()) /
          (1000 * 60 * 60);
        if (hoursSincePaid > 24) {
          console.log(`[ALERT] Prepaid job ${jobId} assigned after 24+ hours`);
          // TODO: Send notification to admin
        }
      }
    }

    job.status = "assigned";
    job.technicianId = req.technicianId;
    job.assignedAt = new Date();
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
    const { reason, additionalInfo, requestedDate } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Reason is required",
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check ownership
    if (
      !job.technicianId ||
      job.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Job is not assigned to you",
      });
    }

    // Only assigned jobs allowed
    if (job.status !== "assigned") {
      return res.status(400).json({
        success: false,
        message: "Only assigned jobs can be modified",
      });
    }

    const startTime = job.preferredDate?.startTime;

    if (!startTime) {
      return res.status(400).json({
        success: false,
        message: "Job start time not found",
      });
    }

    const THREE_HOURS = 3 * 60 * 60 * 1000;
    const now = Date.now();
    const timeUntilStart = startTime.getTime() - now;

    // Job already started
    if (timeUntilStart <= 0) {
      return res.status(400).json({
        success: false,
        message: "Job already started, cannot cancel or reschedule",
      });
    }

    // CASE 1: More than 3 hours → Cancellation Request
    if (timeUntilStart > THREE_HOURS) {
      job.cancellationRequest = {
        status: "pending",
        requestedBy: "technician",
        reason,
        additionalInfo,
        refundAmount: 0,
        refundType: "none",
        requestedAt: new Date(),
      };

      job.steps.push({
        stepId: "STEP-" + (job.steps.length + 1),
        stepName: "Cancellation Requested",
        stepDescription:
          "Technician requested cancellation (more than 3 hours before start)",
        cancelledBy: "technician",
        reason,
        additionalInfo,
        technicianId: req.technicianId,
        createdAt: new Date(),
      });

      await job.save();

      return res.status(200).json({
        success: true,
        message: "Cancellation request sent to admin",
        type: "cancel_request",
      });
    }

    // CASE 2: Less than 3 hours → Only Reschedule Request
    else {
      job.rescheduleRequest = {
        status: "pending",
        requestedBy: "technician",
        reason,
        additionalInfo,
        requestedDate: requestedDate ? new Date(requestedDate) : null,
        requestedAt: new Date(),
      };

      job.rescheduleAttempts = (job.rescheduleAttempts || 0) + 1;

      job.steps.push({
        stepId: "STEP-" + (job.steps.length + 1),
        stepName: "Reschedule Requested",
        stepDescription:
          "Technician requested reschedule (less than 3 hours before start)",
        cancelledBy: "technician",
        reason,
        additionalInfo,
        technicianId: req.technicianId,
        createdAt: new Date(),
      });

      await job.save();

      return res.status(200).json({
        success: true,
        message: "Reschedule request sent (cannot cancel within 3 hours)",
        type: "reschedule_request",
      });
    }
  } catch (error) {
    return next(error);
  }
}

export async function createQuoteController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
}

export async function getQuotationSummaryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
}

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
    const { reason, additionalInfo, preferredDate } = req.body;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (
      !job.technicianId ||
      job.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Job is not assigned to you",
      });
    }

    if (job.status !== "assigned" && job.status === "rescheduled") {
      return res.status(400).json({
        success: false,
        message: "Job status is not assigned, can not be rescheduled",
      });
    }

    // request for resschedule job to user
    job.rescheduleRequest = {
      status: "pending",
      requestedBy: "technician",
      reason,
      additionalInfo,
      requestedDate: preferredDate ? new Date(preferredDate) : null,
      requestedAt: new Date(),
    };

    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Rescheduled requested",
      stepDescription: "Job rescheduled requested by technician",
      reason,
      additionalInfo,
      preferredDate,
      technicianId: req.technicianId,
      createdAt: new Date(),
    });
    await job.save();

    return res.status(200).json({
      success: true,
      message: "Job rescheduled requested successfully",
    });
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
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (
      !job.technicianId ||
      job.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Job is not assigned to you",
      });
    }

    if (job.status !== "assigned") {
      return res
        .status(400)
        .json({ message: "Job status is not assigned, can not be reached" });
    }

    job.status = "reached";
    job.reachedAt = new Date();

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
    const jobOtpRecord = await JobOtpVerification.create({
      otpId,
      jobId,
      userId: job.userId,
      otp,
    });

    return res.status(200).json({
      success: true,
      message: "Technician reached successfully and OTP sent to customer",
      otp:
        process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test"
          ? jobOtpRecord.otp
          : "***",
    });
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
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // technician ownership check
    if (
      !job.technicianId ||
      job.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Job is not assigned to you",
      });
    }

    if (job.status !== "reached") {
      return res.status(400).json({
        success: false,
        message: "Job status is not reached, can not be started",
      });
    }

    // check quotation
    const quotation = await Quotation.findOne({
      jobId,
      technicianId: req.technicianId,
    });

    if (!quotation) {
      return res.status(400).json({
        success: false,
        message: "Please create quotation before starting the job",
      });
    }

    if (quotation.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Quotation is not approved by customer yet",
      });
    }

    if (quotation.status === "rejected") {
      job.status = "cancelled";
      job.closedAt = new Date();
      job.steps.push({
        stepId: "STEP-" + job.steps.length + 1,
        stepName: "Job Cancelled",
        performedBy: "technician",
        stepDescription:
          "Job cancelled by technician cause user rejected quotation",
        technicianId: req.technicianId,
        createdAt: new Date(),
      });
      return res.status(400).json({
        success: false,
        message: "Quotation rejected by customer. Job cannot be started.",
      });
    }

    const otpRecord = await JobOtpVerification.findOne({
      jobId,
      status: "pending",
    });

    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // mark OTP verified
    otpRecord.status = "verified";
    await otpRecord.save();

    // start job
    job.status = "in_progress";
    job.startedAt = new Date();

    job.steps.push({
      stepId: `STEP-${job.steps.length + 1}`,
      stepName: "Job Started",
      performedBy: "technician",
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    await JobOtpVerification.deleteOne({ jobId, status: "verified" });

    // generate completion OTP
    const completionOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const jobCompletionOtpRecord = await JobOtpVerification.create({
      otpId: "OTP-2",
      jobId,
      userId: job.userId,
      otp: completionOtp,
      status: "pending",
    });

    return res.status(200).json({
      message: "Job started successfully and OTP sent to customer",
      nextOtp:
        process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test"
          ? jobCompletionOtpRecord.otp
          : "***",
    });
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
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // technician ownership check
    if (
      !job.technicianId ||
      job.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Job is not assigned to you",
      });
    }

    if (job.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Job status is not in_progress, can not be completed",
      });
    }

    // check wheather all services completed
    const allServicesCompleted = job.bookedServices.every(
      (service) => service.status === "completed",
    );

    if (!allServicesCompleted) {
      return res.status(400).json({
        success: false,
        message: "Please complete all services before completing the job",
      });
    }

    // find pending OTP
    const otpRecord = await JobOtpVerification.findOne({
      jobId,
      status: "pending",
    });

    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    otpRecord.status = "verified";
    await otpRecord.save();

    job.status = "completed";
    job.completedAt = new Date();

    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Job Completed",
      performedBy: "technician",
      stepDescription: "Technician completed the job successfully",
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();
    await JobOtpVerification.deleteOne({ jobId, status: "verified" });

    return res.status(200).json({
      success: true,
      message: "Job completed successfully",
    });
  } catch (error) {
    return next(error);
  }
}

// TODO - next part remaining for debug and fix
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

export async function submitPaymentCollectionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;
    const { paymentAmount, paymentMethod } = req.body;

    if (!paymentAmount || !paymentMethod) {
      return res.status(400).json({
        message: "Payment amount and method are required",
      });
    }

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
      return res.status(400).json({
        message: "Job must be completed before submitting payment",
      });
    }

    // Only for unpaid/cash collection jobs
    if (job.paymentStatus === "prepaid" || job.paymentStatus === "refunded") {
      return res.status(400).json({
        message: "Cannot submit payment for prepaid or refunded jobs",
      });
    }

    // Set payment collection status to pending (awaiting admin confirmation)
    job.paymentCollectionStatus = "pending";
    job.collectionDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Add to technician's pending payment jobs
    await Technician.findByIdAndUpdate(req.technicianId, {
      $addToSet: { pendingPaymentJobs: jobId },
    });

    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Payment Submitted",
      stepDescription: `Technician submitted payment - Amount: ${paymentAmount}, Method: ${paymentMethod}`,
      technicianId: req.technicianId,
      paymentAmount,
      paymentMethod,
      createdAt: new Date(),
    });

    await job.save();

    return res.status(200).json({
      success: true,
      message: "Payment submitted for admin confirmation",
      collectionDeadline: job.collectionDeadline,
    });
  } catch (error) {
    return next(error);
  }
}

export async function startInstallPhaseController(
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

    // Only for relocation jobs in install phase
    const isRelocationJob =
      job.jobType === "relocation" && job.addresses?.length === 2;
    if (!isRelocationJob || job.currentOtpStep !== 3) {
      return res.status(400).json({
        message: "This endpoint is only for relocation jobs in install phase",
      });
    }

    if (job.status !== "in_progress") {
      return res.status(400).json({
        message: "Job must be in progress to continue install phase",
      });
    }

    const jobOtpVerification = await JobOtpVerification.findOne({
      otpId: "OTP-3",
      jobId,
    });

    if (!jobOtpVerification) {
      return res.status(400).json({ message: "Invalid OTP for install phase" });
    }

    if (jobOtpVerification.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Install Phase Started",
      stepDescription:
        "Technician verified at new location and started install phase",
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    // Delete OTP-3 after verification
    await JobOtpVerification.deleteOne({ otpId: "OTP-3", jobId });

    // Create OTP-4 for install completion verification
    await JobOtpVerification.create({
      otpId: "OTP-4",
      jobId,
      userId: job.userId,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
    });

    return res.status(200).json({
      message: "Install phase started successfully",
      phase: "install",
      jobStatus: "in_progress",
    });
  } catch (error) {
    return next(error);
  }
}

export async function submitRescheduleRequestController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;
    const { reason, requestedDate } = req.body;

    if (!reason || !requestedDate) {
      return res.status(400).json({
        message: "Reason and requested date are required",
      });
    }

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

    // Can only reschedule pending or assigned jobs
    if (!["pending", "assigned"].includes(job.status)) {
      return res.status(400).json({
        message: "Only pending or assigned jobs can be rescheduled",
      });
    }

    // Check if there's already a pending reschedule request
    if (job.rescheduleRequest?.status === "pending") {
      return res.status(400).json({
        message: "This job already has a pending reschedule request",
      });
    }

    // Create reschedule request
    job.rescheduleRequest = {
      status: "pending",
      requestedBy: "technician",
      reason,
      requestedAt: new Date(),
      requestedDate: new Date(requestedDate),
      approvedBy: null,
      approvedAt: null,
    };

    job.rescheduleAttempts = (job.rescheduleAttempts || 0) + 1;

    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Reschedule Requested",
      stepDescription: `Technician requested reschedule - Reason: ${reason}, New Date: ${requestedDate}`,
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    // TODO.SendNotification: Notify user about reschedule request

    return res.status(200).json({
      success: true,
      message: "Reschedule request submitted successfully",
      rescheduleRequest: job.rescheduleRequest,
    });
  } catch (error) {
    return next(error);
  }
}
