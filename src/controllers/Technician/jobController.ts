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
          message: "Invalid type. Use: pending, assigned, completed, or history" 
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

    // Check if technician is blacklisted
    const technician = await Technician.findById(req.technicianId);
    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }

    if (technician.isBlacklisted) {
      return res.status(403).json({ 
        message: "You are blacklisted and cannot accept jobs",
        reason: technician.blacklistReason,
        blacklistedAt: technician.blacklistedAt
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
    if (job.paymentStatus === "prepaid" && (!job.assignedAt || job.assignedAt === null)) {
      if (job.paidAt) {
        const hoursSincePaid = (Date.now() - new Date(job.paidAt as any).getTime()) / (1000 * 60 * 60);
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
    const timeUntilStart = job.preferredDate.startTime.getTime() - Date.now();

    // If more than 3 hours away: reassign as pending
    if (timeUntilStart > THREE_HOURS) {
      job.status = "pending";
      job.technicianId = null;
      job.cancelReason = {
        reason,
        additionalInfo,
      };
      job.steps.push({
        stepId: "STEP-" + job.steps.length + 1,
        stepName: "Cancelled by Technician",
        stepDescription: "Job cancelled by technician - reassigned to pending",
        cancelledBy: "technician",
        reason,
        additionalInfo,
        technicianId: req.technicianId,
        createdAt: new Date(),
      });
      
      await job.save();

      return res.status(200).json({ 
        message: "Job cancelled and reassigned to pending status",
        newStatus: "pending"
      });
    } 
    // If less than 3 hours away: mark as cancelled and require reschedule
    else {
      job.status = "cancelled";
      job.cancelReason = {
        reason,
        additionalInfo,
      };
      job.rescheduleRequest = {
        status: "pending",
        requestedBy: "technician",
        reason,
        requestedDate: null,
        requestedAt: new Date(),
      };
      job.rescheduleAttempts = (job.rescheduleAttempts || 0) + 1;
      job.steps.push({
        stepId: "STEP-" + job.steps.length + 1,
        stepName: "Cancelled - Reschedule Required",
        stepDescription: "Job cancelled by technician - reschedule required (less than 3 hours)",
        cancelledBy: "technician",
        reason,
        additionalInfo,
        technicianId: req.technicianId,
        createdAt: new Date(),
      });

      await job.save();

      return res.status(200).json({ 
        message: "Job cancelled - reschedule request sent to user and admin",
        newStatus: "cancelled",
        requiresReschedule: true
      });
    }
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

    // Phase 4: Initialize step tracking for multi-step jobs (relocation)
    const isRelocationJob = job.jobType === "relocation" && job.addresses?.length === 2;
    
    if (isRelocationJob) {
      // For relocation jobs: start at step 1 (uninstall phase)
      if (job.currentOtpStep === 0) {
        job.currentOtpStep = 1;
        job.stepStatuses = {
          uninstall: { started: true, completed: false, startedAt: new Date() },
          install: { started: false, completed: false }
        };
      }
    } else {
      // For regular service jobs: no step tracking needed
      job.currentOtpStep = 0;
    }

    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: isRelocationJob ? "Uninstall Started" : "Started",
      stepDescription: isRelocationJob 
        ? "Technician started uninstall phase of relocation service" 
        : "Technician started job",
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    await JobOtpVerification.deleteOne({ otpId: "OTP-1", jobId });
    
    // For relocation jobs: OTP-2 will be generated when moving to install phase
    // For regular jobs: Generate OTP-2 for completion verification
    await JobOtpVerification.create({
      otpId: "OTP-2",
      jobId,
      userId: job.userId,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
    });

    return res.status(200).json({ 
      message: "Job started successfully",
      isRelocationJob,
      currentStep: isRelocationJob ? "uninstall" : "single_service"
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

    // Phase 4: Handle multi-step jobs (relocation)
    const isRelocationJob = job.jobType === "relocation" && job.addresses?.length === 2;
    
    let currentOtpId = "OTP-2";
    if (isRelocationJob) {
      if (job.currentOtpStep === 1) {
        currentOtpId = "OTP-2"; // Uninstall completion uses OTP-2
      } else if (job.currentOtpStep === 3) {
        currentOtpId = "OTP-4"; // Install phase completion uses OTP-4
      }
    }

    const jobOtpVerification = await JobOtpVerification.findOne({
      otpId: currentOtpId,
      jobId,
    });

    if (!jobOtpVerification) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (jobOtpVerification.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    let stepCompleted = "";
    let isJobFullyCompleted = false;

    if (isRelocationJob) {
      if (job.currentOtpStep === 1) {
        // Completing uninstall phase
        const ss = job.stepStatuses || {
          uninstall: { started: true, completed: true, completedAt: new Date() },
          install: { started: false, completed: false }
        };
        (ss.uninstall as any).completed = true;
        (ss.uninstall as any).completedAt = new Date();
        job.stepStatuses = ss;
        
        stepCompleted = "Uninstall Completed";
        
        // Move to install phase (step 3)
        job.currentOtpStep = 3;
        (ss.install as any).started = true;
        (ss.install as any).startedAt = new Date();
        
        job.steps.push({
          stepId: "STEP-" + job.steps.length + 1,
          stepName: "Uninstall Completed",
          stepDescription: "Technician completed uninstall phase, moving to install at new location",
          technicianId: req.technicianId,
          createdAt: new Date(),
        });

        // Continue job in_progress for install phase
        // Delete OTP-2 and create OTP-3 for install verification
        await JobOtpVerification.deleteOne({ otpId: "OTP-2", jobId });
        await JobOtpVerification.create({
          otpId: "OTP-3",
          jobId,
          userId: job.userId,
          otp: Math.floor(1000 + Math.random() * 9000).toString(),
        });

        await job.save();

        return res.status(200).json({ 
          message: "Uninstall completed successfully. Move to new location for install phase.",
          nextStep: "install",
          jobStatus: "in_progress"
        });
      } else if (job.currentOtpStep === 3) {
        // Completing install phase
        const ss = job.stepStatuses || {
          uninstall: { started: true, completed: true },
          install: { started: true, completed: false }
        };
        (ss.install as any).completed = true;
        (ss.install as any).completedAt = new Date();
        job.stepStatuses = ss;
        
        stepCompleted = "Install Completed";
        
        job.currentOtpStep = 4; // Final step
        isJobFullyCompleted = true;
      }
    } else {
      // Regular service job
      stepCompleted = "Completed";
      isJobFullyCompleted = true;
    }

    if (isJobFullyCompleted) {
      job.status = "completed";
      job.steps.push({
        stepId: "STEP-" + job.steps.length + 1,
        stepName: stepCompleted || "Completed",
        stepDescription: isRelocationJob
          ? "Technician completed install phase - relocation service fully completed"
          : "Technician completed job",
        technicianId: req.technicianId,
        createdAt: new Date(),
      });

      await job.save();
      await JobOtpVerification.deleteOne({ otpId: currentOtpId, jobId });

      return res.status(200).json({ 
        message: "Job completed successfully",
        jobStatus: "completed",
        isRelocationJob
      });
    }

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

    if (!job.technicianId || job.technicianId.toString() !== req.technicianId.toString()) {
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
    await Technician.findByIdAndUpdate(
      req.technicianId,
      {
        $addToSet: { pendingPaymentJobs: jobId },
      }
    );

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

    if (!job.technicianId || job.technicianId.toString() !== req.technicianId.toString()) {
      return res.status(400).json({ message: "Job is not assigned to you" });
    }

    // Only for relocation jobs in install phase
    const isRelocationJob = job.jobType === "relocation" && job.addresses?.length === 2;
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
      stepDescription: "Technician verified at new location and started install phase",
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

    if (!job.technicianId || job.technicianId.toString() !== req.technicianId.toString()) {
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
