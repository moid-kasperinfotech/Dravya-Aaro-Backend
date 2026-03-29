import mongoose from "mongoose";
import Job from "../../models/Services/jobs.js";
import Technician from "../../models/Technician/Technician.js";
import { Request, Response, NextFunction } from "express";
import JobOtpVerification from "../../models/Services/jobOtpVerification.js";
import Quotation from "../../models/Services/quotationModel.js";
import ServiceReview from "../../models/Services/review.js";
import { parseTimeRange } from "../../utils/formatTimeZone.js";

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

function generateStepId(steps: any[]) {
  return `STEP-${steps.length + 1}`;
}

function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
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
      .populate("bookedServices.serviceId")
      .populate("userId", "fullName mobileNumber")
      .populate("technicianId", "fullName mobileNumber")
      .lean();

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

    if (technician.accountType === "salaried") {
      return res.status(403).json({
        success: false,
        message: "Salaried account cannot accept jobs",
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Job cannot be accepted. Current status: ${job.status}`,
      });
    }

    // --- Prepaid 24hr alert ---
    if (
      job.paymentStatus?.status === "prepaid" &&
      !job.assignedAt &&
      job.paymentStatus.paidAt
    ) {
      const hoursSincePaid =
        (Date.now() - new Date(job.paymentStatus.paidAt as any).getTime()) /
        (1000 * 60 * 60);
      if (hoursSincePaid > 24) {
        // TODO: fire admin notification (push / email / Slack)
        console.warn(
          `[ALERT] Prepaid job ${jobId} assigned ${hoursSincePaid.toFixed(1)}h after payment`,
        );
      }
    }

    job.status = "assigned";
    job.technicianId = req.technicianId;
    job.assignedAt = new Date();
    job.steps.push({
      stepId: generateStepId(job.steps),
      stepName: "Job Accepted",
      performedBy: "technician",
      stepDescription: "Job accepted by technician",
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    return res
      .status(200)
      .json({ success: true, message: "Job accepted successfully" });
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
    const { reason, additionalInfo, date, timeRange } = req.body;

    // ── Validation ──
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Reason is required",
      });
    }

    // ── Fetch Job ──
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // ── Ownership check ──
    if (
      !job.technicianId ||
      job.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Job is not assigned to you",
      });
    }

    // ── Only 'assigned' jobs can be cancelled/rescheduled ──
    if (job.status !== "assigned") {
      return res.status(400).json({
        success: false,
        message: `Only assigned jobs can be cancelled or rescheduled. Current status: ${job.status}`,
      });
    }

    // ── Job start time (from DB, not body) ──
    if (!job.preferredDate?.startTime) {
      return res.status(400).json({
        success: false,
        message: "Job scheduled start time not found",
      });
    }

    const THREE_HOURS = 3 * 60 * 60 * 1000;
    const now = Date.now();
    const jobStartTime = new Date(job.preferredDate.startTime).getTime();
    const timeUntilStart = jobStartTime - now;

    // ── Job time already passed ──
    if (timeUntilStart <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Job start time has already passed. Cannot cancel or reschedule.",
      });
    }

    // ── CASE 1: More than 3 hours left → Cancellation Request ──
    if (timeUntilStart > THREE_HOURS) {
      // Block if a cancellation request already pending
      if (job.cancellationRequest?.status === "pending") {
        return res.status(400).json({
          success: false,
          message: "A cancellation request is already pending for this job",
        });
      }

      job.cancellationRequest = {
        status: "pending",
        requestedBy: "technician",
        reason,
        additionalInfo: additionalInfo || null,
        refundAmount: 0,
        refundType: "none",
        requestedAt: new Date(),
        approvedBy: null,
        approvedAt: null,
      };

      job.steps.push({
        stepId: generateStepId(job.steps),
        stepName: "Cancellation Requested",
        performedBy: "technician",
        stepDescription:
          "Technician requested cancellation (more than 3 hours before start)",
        technicianId: req.technicianId,
        reason,
        additionalInfo: additionalInfo || null,
        createdAt: new Date(),
      });

      await job.save();

      return res.status(200).json({
        success: true,
        type: "cancel_request",
        message:
          "Cancellation request submitted. Admin will review and notify you.",
      });
    }

    // ── CASE 2: Less than 3 hours left → Reschedule Request only ──

    // Block if a reschedule request already pending
    if (job.rescheduleRequest?.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "A reschedule request is already pending for this job",
      });
    }

    // date + timeRange required for reschedule
    if (!date || !timeRange) {
      return res.status(400).json({
        success: false,
        message:
          "Proposed date and timeRange are required to request a reschedule",
      });
    }

    const { startTime, endTime, duration } = parseTimeRange(date, timeRange);

    // Proposed time must be in the future
    if (startTime.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Proposed reschedule time must be in the future",
      });
    }

    job.rescheduleRequest = {
      status: "pending",
      requestedBy: "technician",
      reason,
      requestedDate: { startTime, endTime, duration },
      requestedAt: new Date(),
      approvedBy: null,
      approvedAt: null,
    };

    job.rescheduleAttempts = (job.rescheduleAttempts || 0) + 1;

    job.steps.push({
      stepId: generateStepId(job.steps),
      stepName: "Reschedule Requested",
      performedBy: "technician",
      stepDescription:
        "Technician requested reschedule (less than 3 hours before start). Cancellation not allowed.",
      technicianId: req.technicianId,
      reason,
      createdAt: new Date(),
    });

    await job.save();

    return res.status(200).json({
      success: true,
      type: "reschedule_request",
      message:
        "Reschedule request submitted. Cancellation is not allowed within 3 hours of start.",
    });
  } catch (error) {
    return next(error);
  }
}

// export async function createQuoteController(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) {
//   try {
//     const { jobId } = req.params;
//     const { items, additionalCharges = 0, notes, terms } = req.body;

//     if (!items || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Quotation items are required",
//       });
//     }

//     const job = await Job.findById(jobId);
//     if (!job) {
//       return res.status(404).json({
//         success: false,
//         message: "Job not found",
//       });
//     }

//     let partsSubtotal = 0;
//     let servicesSubtotal = 0;

//     const formattedItems = items.map((item: any) => {
//       const quantity = Number(item.quantity) || 1;
//       const unitPrice = Number(item.unitPrice) || 0;
//       const totalPrice = quantity * unitPrice;

//       if (
//         item.itemType === "custom_part" ||
//         item.itemType === "replacement_part"
//       ) {
//         partsSubtotal += totalPrice;
//       }

//       if (item.itemType === "service") {
//         servicesSubtotal += totalPrice;
//       }

//       return {
//         itemType: item.itemType,
//         productId: item.productId || null,
//         itemName: item.itemName,
//         brand: item.brand,
//         description: item.description,
//         quantity,
//         unitPrice,
//         totalPrice,
//         warranty: {
//           period: item?.warranty?.period || null,
//         },
//       };
//     });

//     const subtotal = partsSubtotal + servicesSubtotal + additionalCharges;

//     const gstPercentage = 18;
//     const gstAmount = (subtotal * gstPercentage) / 100;

//     const totalAmount = subtotal + gstAmount;

//     const validityDays = 7;
//     const expiresAt = new Date();
//     expiresAt.setDate(expiresAt.getDate() + validityDays);

//     const quotationId = `QT-${Date.now()}`;

//     const quotation = await Quotation.create({
//       quotationId,
//       jobId,
//       technicianId: req.technicianId,
//       customerId: job.userId,
//       items: formattedItems,
//       partsSubtotal,
//       servicesSubtotal,
//       additionalCharges,
//       subtotal,
//       gst: {
//         percentage: gstPercentage,
//         amount: gstAmount,
//       },
//       totalAmount,
//       validity: {
//         days: validityDays,
//         expiresAt,
//       },
//       notes,
//       terms,
//       status: "pending",
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Quotation created and sent for customer approval",
//       data: quotation,
//     });
//   } catch (error) {
//     return next(error);
//   }
// }

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

    const allowedStatus = [
      "pending",
      "approved",
      "rejected",
      "expired",
      "awaiting_service",
    ];

    if (status && !allowedStatus.includes(status as string)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status filter",
      });
    }

    const filter: any = {
      customerId: req.userId,
    };

    if (status) {
      filter.status = status;
    }

    const quotations = await Quotation.find(filter)
      .populate("jobId", "jobId status serviceType")
      .populate("technicianId", "fullName phoneNumber")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    if (!quotations.length) {
      return res.status(200).json({
        success: true,
        message: "No quotations found",
        data: [],
      });
    }

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

export async function rescheduleJobController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;
    const { reason, date, timeRange } = req.body;

    if (!reason || !date || !timeRange) {
      return res.status(400).json({
        success: false,
        message: "Reason, date and time range are required",
      });
    }

    const { startTime, endTime, duration } = parseTimeRange(date, timeRange);

    // Proposed time must be in future
    if (startTime.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Proposed reschedule time must be in the future",
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Ownership check
    if (
      !job.technicianId ||
      job.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Job is not assigned to you",
      });
    }

    // Only assigned or rescheduled jobs can request reschedule
    if (job.status !== "assigned" && job.status !== "rescheduled") {
      return res.status(400).json({
        success: false,
        message: `Job cannot be rescheduled. Current status: ${job.status}`,
      });
    }

    // Block duplicate pending request
    if (job.rescheduleRequest?.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "A reschedule request is already pending for this job",
      });
    }

    job.rescheduleRequest = {
      status: "pending",
      requestedBy: "technician",
      reason,
      requestedDate: { startTime, endTime, duration },
      requestedAt: new Date(),
      approvedBy: null,
      approvedAt: null,
    };

    job.rescheduleAttempts = (job.rescheduleAttempts || 0) + 1;

    job.steps.push({
      stepId: `STEP-${job.steps.length + 1}`,
      stepName: "Reschedule Requested",
      performedBy: "technician",
      stepDescription: "Technician requested job reschedule",
      technicianId: req.technicianId,
      reason,
      createdAt: new Date(),
    });

    await job.save();

    return res.status(200).json({
      success: true,
      message: "Reschedule request submitted successfully",
    });
  } catch (error) {
    return next(error);
  }
}

export async function approveRescheduleController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;
    const technicianId = req.technicianId;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // check technician
    if (
      !job.technicianId ||
      job.technicianId.toString() !== technicianId.toString()
    ) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to accept this reschedule request",
      });
    }

    if (!job.rescheduleRequest || job.rescheduleRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "No pending reschedule request for this job",
      });
    }

    // User accepts the reschedule - update job with new date
    job.rescheduleRequest.status = "accepted";
    job.rescheduleRequest.approvedBy = "technician";
    job.rescheduleRequest.approvedAt = new Date();
    job.status = "rescheduled";
    job.rescheduleAttempts += 1;

    // Update job rescheduled if newDate was provided in original request
    if (job.rescheduleRequest.requestedDate) {
      job.preferredDate = {
        startTime: job.rescheduleRequest.requestedDate.startTime as Date,
        endTime: job.rescheduleRequest.requestedDate.endTime as Date,
        duration: job.rescheduleRequest.requestedDate.duration as number,
      };
      job.markModified("preferredDate");
    }

    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Reschedule Accepted",
      stepDescription: "Technician accepted the user's reschedule request",
      technicianId: technicianId,
      createdAt: new Date(),
    });

    job.rescheduleRequest = null;

    await job.save();

    return res.status(200).json({
      success: true,
      message: "Reschedule request accepted successfully",
      job,
    });
  } catch (error) {
    return next(error);
  }
}

export async function reachedJobController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response<any, Record<string, any>>> {
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
      return res.status(400).json({
        success: false,
        message: `Job cannot be marked reached. Current status: ${job.status}`,
      });
    }

    // Invalidate any stale pending OTPs for this job
    await JobOtpVerification.deleteMany({ jobId, status: "pending" });

    job.status = "reached";
    job.reachedAt = new Date();
    job.steps.push({
      stepId: generateStepId(job.steps),
      stepName: "Technician Reached",
      performedBy: "technician",
      stepDescription: "Technician reached the job location",
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    const otp = generateOtp();
    await JobOtpVerification.create({
      otpId: `OTP-START-${jobId}`,
      jobId,
      userId: job.userId,
      otp,
      status: "pending",
    });

    // TODO: Send OTP via SMS / push notification to job.userId

    return res.status(200).json({
      success: true,
      message:
        "Technician marked as reached. OTP sent to customer to start the job.",
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

    if (!otp) {
      return res
        .status(400)
        .json({ success: false, message: "OTP is required" });
    }

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
        message: `Job cannot be started. Current status: ${job.status}`,
      });
    }

    // Verify OTP
    const otpRecord = await JobOtpVerification.findOne({
      jobId,
      status: "pending",
    });
    if (!otpRecord || otpRecord.otp !== otp) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    otpRecord.status = "verified";
    await otpRecord.save();

    // Clean up used OTP
    await JobOtpVerification.deleteOne({ _id: otpRecord._id });

    // start job
    job.status = "in_progress";
    job.startedAt = new Date();
    job.steps.push({
      stepId: generateStepId(job.steps),
      stepName: "Job Started",
      performedBy: "technician",
      stepDescription: "Job started after OTP verification",
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    // Generate completion OTP upfront and send to customer
    const completionOtp = generateOtp();
    await JobOtpVerification.create({
      otpId: `OTP-COMPLETE-${jobId}`,
      jobId,
      userId: job.userId,
      otp: completionOtp,
      status: "pending",
    });

    // TODO: Send completion OTP via SMS / push to job.userId

    return res.status(200).json({
      success: true,
      message: "Job started. Completion OTP sent to customer.",
    });
  } catch (error) {
    return next(error);
  }
}

export async function startJobServicesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId, serviceId } = req.params;

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

    if (!["reached", "in_progress"].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot inspect service. Job status: ${job.status}`,
      });
    }

    const service = job.bookedServices.find(
      (s) => s.serviceId.toString() === serviceId,
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (service.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Service is already in '${service.status}' state. Cannot start inspection.`,
      });
    }

    service.status = "inspecting";

    if (service.serviceType === "installation-uninstallation") {
      // Find first pending subService (should be 'uninstall')
      const firstStep = service.subServices?.find(
        (s) => s.status === "pending",
      );
      if (!firstStep) {
        return res.status(400).json({
          success: false,
          message: "No pending sub-step found for this relocation service",
        });
      }
      firstStep.status = "inspecting";
      firstStep.startedAt = new Date();
    }

    job.steps.push({
      stepId: generateStepId(job.steps),
      stepName: "Inspection Started",
      performedBy: "technician",
      stepDescription: `Inspection started for service: ${service.serviceName}`,
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    return res.json({
      success: true,
      message: "Inspection started successfully",
    });
  } catch (error) {
    return next(error);
  }
}

export async function createQuotationController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId, serviceId } = req.params;
    const { items, additionalCharges = 0, notes, terms } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one quotation item is required",
      });
    }

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

    const service = job.bookedServices.find(
      (s) => s.serviceId.toString() === serviceId,
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found in this job",
      });
    }

    if (service.status !== "inspecting") {
      return res.status(400).json({
        success: false,
        message:
          "Quotation can only be created when service is in 'inspecting' state",
      });
    }

    // Expire any previous quotations for this service
    await Quotation.updateMany(
      { serviceItemId: serviceId, isLatest: true },
      { isLatest: false },
    );

    let partsSubtotal = 0;
    let servicesSubtotal = 0;

    const formattedItems = items.map((item: any) => {
      const quantity = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const totalPrice = quantity * unitPrice;

      if (["custom_part", "replacement_part"].includes(item.itemType)) {
        partsSubtotal += totalPrice;
      } else if (item.itemType === "service") {
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

    const subtotal =
      partsSubtotal + servicesSubtotal + Number(additionalCharges);

    const gstPercentage = 18;
    const gstAmount = (subtotal * gstPercentage) / 100;
    const totalAmount = subtotal + gstAmount;

    const validityDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    const quotation = await Quotation.create({
      quotationId: `QT-${Date.now()}`,
      jobId,
      serviceItemId: serviceId,
      technicianId: req.technicianId,
      customerId: job.userId,
      items: formattedItems,
      partsSubtotal,
      servicesSubtotal,
      additionalCharges: Number(additionalCharges),
      subtotal,
      gst: {
        percentage: gstPercentage,
        amount: gstAmount,
      },
      totalAmount,
      status: "pending",
      createdBy: "technician",
      isLatest: true,
      validity: {
        days: validityDays,
        expiresAt,
      },
      notes,
      terms,
    });

    service.quotationId = quotation._id;
    service.quotationStatus = "pending";
    job.steps.push({
      stepId: generateStepId(job.steps),
      stepName: "Quotation Created",
      performedBy: "technician",
      stepDescription: `Quotation ${quotation.quotationId} sent to customer for service: ${service.serviceName}`,
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    // TODO: Notify customer via push/SMS about new quotation

    return res.status(201).json({
      success: true,
      message: "Quotation created and sent to customer for approval",
      data: quotation,
    });
  } catch (error) {
    return next(error);
  }
}

export async function respondQuotationController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { quotationId } = req.params;
    const { action, reason } = req.body;

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be 'accept' or 'reject'",
      });
    }

    if (action === "reject" && !reason) {
      return res.status(400).json({
        success: false,
        message: "Reason is required for rejection",
      });
    }

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    // Ownership check
    if (quotation.customerId.toString() !== req.userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to respond to this quotation",
      });
    }

    if (quotation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Quotation already ${quotation.status}. Cannot respond again.`,
      });
    }

    // Expiry check (only matters for accept)
    if (
      action === "accept" &&
      quotation.validity?.expiresAt &&
      quotation.validity.expiresAt < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Quotation has expired and can no longer be accepted",
      });
    }

    const job = await Job.findById(quotation.jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const service = job.bookedServices.find(
      (s) => s.serviceId.toString() === quotation.serviceItemId.toString(),
    );
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found in this job",
      });
    }

    // ── ACCEPT ──
    if (action === "accept") {
      quotation.status = "approved";
      quotation.approvedAt = new Date();
      service.quotationStatus = "approved";

      if (service.serviceType === "installation-uninstallation") {
        const inspectingStep = service.subServices?.find(
          (s) => s.status === "inspecting",
        );
        if (inspectingStep) {
          inspectingStep.status = "in_progress";
          inspectingStep.startedAt = inspectingStep.startedAt || new Date();
        }
      } else {
        service.status = "in_progress";
      }

      job.steps.push({
        stepId: generateStepId(job.steps),
        stepName: "Quotation Accepted",
        performedBy: "customer",
        stepDescription: `Customer accepted quotation for service: ${service.serviceName}`,
        createdAt: new Date(),
      });
    }

    // ── REJECT ──
    if (action === "reject") {
      quotation.status = "rejected";
      quotation.rejectedAt = new Date();
      quotation.rejectionReason = reason;

      service.quotationStatus = "rejected";
      service.status = "incompleted";

      job.steps.push({
        stepId: generateStepId(job.steps),
        stepName: "Quotation Rejected",
        performedBy: "customer",
        stepDescription: `Customer rejected quotation for service: ${service.serviceName}. Inspection charge applicable.`,
        createdAt: new Date(),
      });

      // All services completed/incompleted → auto-close job
      const allDone = job.bookedServices.every((s) =>
        ["completed", "incompleted"].includes(s.status),
      );
      if (allDone) {
        job.status = "completed";
        job.completedAt = new Date();
        job.closedAt = new Date();
        job.steps.push({
          stepId: generateStepId(job.steps),
          stepName: "Job Closed",
          performedBy: "system",
          stepDescription: "All services done/incompleted. Job auto-closed.",
          createdAt: new Date(),
        });
      }
    }

    await quotation.save();
    await job.save();

    return res.status(200).json({
      success: true,
      message: `Quotation ${action === "accept" ? "accepted" : "rejected"} successfully`,
    });
  } catch (error) {
    return next(error);
  }
}

export async function continueServiceWithoutQuotationController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId, serviceId } = req.params;

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

    const service = job.bookedServices.find(
      (s) => s.serviceId.toString() === serviceId,
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found in this job",
      });
    }

    if (service.status !== "inspecting") {
      return res.status(400).json({
        success: false,
        message: "Service must be in 'inspecting' state to continue",
      });
    }

    if (service.serviceType === "installation-uninstallation") {
      const inspectingStep = service.subServices?.find(
        (s) => s.status === "inspecting",
      );
      if (!inspectingStep) {
        return res.status(400).json({
          success: false,
          message: "No inspecting sub-step found",
        });
      }
      inspectingStep.status = "in_progress";
    } else {
      service.status = "in_progress";
      service.quotationStatus = "not_required";
    }

    job.steps.push({
      stepId: generateStepId(job.steps),
      stepName: "Service Started (No Quotation)",
      performedBy: "technician",
      stepDescription: `Technician proceeded without quotation for service: ${service.serviceName}`,
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    return res.json({
      success: true,
      message: "Service started without quotation",
    });
  } catch (error) {
    return next(error);
  }
}

export async function completeJobServiceController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId, serviceId } = req.params;

    const job = await Job.findById(jobId);
    if (!job)
      return res.status(404).json({ success: false, message: "Job not found" });

    if (job.technicianId?.toString() !== req.technicianId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Job is not assigned to you" });
    }

    if (!["reached", "in_progress"].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot complete service. Job status: ${job.status}`,
      });
    }

    const service = job.bookedServices.find(
      (s) => s.serviceId.toString() === serviceId,
    );
    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found in this job" });
    }

    if (!job.stepStatuses) job.stepStatuses = {};

    // ── RELOCATION (installation-uninstallation) ──
    if (service.serviceType === "installation-uninstallation") {
      const activeStep = service.subServices?.find(
        (s) => s.status === "in_progress",
      );
      if (!activeStep) {
        return res.status(400).json({
          success: false,
          message: "No active sub-step found to complete",
        });
      }

      activeStep.status = "completed";
      activeStep.completedAt = new Date();

      const stepType = activeStep.type as "uninstall" | "install";
      job.stepStatuses[stepType] = {
        started: true,
        startedAt: activeStep.startedAt || new Date(),
        completed: true,
        completedAt: new Date(),
      };

      job.steps.push({
        stepId: generateStepId(job.steps),
        stepName: `${stepType.charAt(0).toUpperCase() + stepType.slice(1)} Completed`,
        performedBy: "technician",
        stepDescription: `${stepType} step completed for service: ${service.serviceName}`,
        technicianId: req.technicianId,
        createdAt: new Date(),
      });

      // Auto-advance to next pending sub-step (inspection phase)
      const nextStep = service.subServices?.find((s) => s.status === "pending");
      if (nextStep) {
        nextStep.status = "inspecting";
        nextStep.startedAt = new Date();

        const nextType = nextStep.type as "uninstall" | "install";
        job.stepStatuses[nextType] = {
          started: true,
          startedAt: new Date(),
          completed: false,
          completedAt: null,
        };

        job.steps.push({
          stepId: generateStepId(job.steps),
          stepName: `${nextType.charAt(0).toUpperCase() + nextType.slice(1)} Inspection Started`,
          performedBy: "system",
          stepDescription: `Auto-advanced to ${nextType} inspection for service: ${service.serviceName}`,
          createdAt: new Date(),
        });
      } else {
        // All sub-steps done → service completed
        service.status = "completed";
        job.steps.push({
          stepId: generateStepId(job.steps),
          stepName: "Relocation Service Completed",
          performedBy: "technician",
          stepDescription: `All steps completed for relocation service: ${service.serviceName}`,
          technicianId: req.technicianId,
          createdAt: new Date(),
        });
      }

      await job.save();

      return res.status(200).json({
        success: true,
        message: nextStep
          ? `${stepType} completed. Proceed to ${nextStep.type} inspection.`
          : "Relocation service fully completed",
      });
    }

    // ── NORMAL SERVICE (repair / installation / uninstallation) ──
    if (service.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: `Service is in '${service.status}' state. It must be 'in_progress' to complete.`,
      });
    }

    service.status = "completed";

    const repairKey = "repair";
    job.stepStatuses[repairKey] = {
      started: true,
      startedAt:
        job.stepStatuses[repairKey]?.startedAt || job.startedAt || new Date(),
      completed: true,
      completedAt: new Date(),
    };

    job.steps.push({
      stepId: generateStepId(job.steps),
      stepName: "Service Completed",
      performedBy: "technician",
      stepDescription: `Service '${service.serviceName}' completed successfully`,
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    return res.status(200).json({
      success: true,
      message: `Service '${service.serviceName}' completed successfully`,
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

    if (!otp) {
      return res
        .status(400)
        .json({ success: false, message: "OTP is required" });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // technician ownership check
    if (job.technicianId?.toString() !== req.technicianId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Job is not assigned to you" });
    }

    if (job.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: `Job cannot be completed. Current status: ${job.status}`,
      });
    }

    // All services must be completed or incompleted (no pending/inspecting/in_progress)
    const pendingServices = job.bookedServices.filter(
      (s) => !["completed", "incompleted"].includes(s.status),
    );

    if (pendingServices.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${pendingServices.length} service(s) still pending: ${pendingServices.map((s) => s.serviceName).join(", ")}`,
      });
    }

    // Verify completion OTP
    const otpRecord = await JobOtpVerification.findOne({
      jobId,
      status: "pending",
    });
    if (!otpRecord || otpRecord.otp !== otp) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    otpRecord.status = "verified";
    await otpRecord.save();
    await JobOtpVerification.deleteOne({ _id: otpRecord._id });

    job.status = "completed";
    job.completedAt = new Date();
    job.steps.push({
      stepId: generateStepId(job.steps),
      stepName: "Job Completed",
      performedBy: "technician",
      stepDescription: "Job completed successfully after OTP verification",
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    // Increment technician's completed jobs counter
    await Technician.findByIdAndUpdate(req.technicianId, {
      $inc: { totalJobsCompleted: 1 },
    });

    // TODO: Trigger payment collection flow if job is not prepaid

    return res
      .status(200)
      .json({ success: true, message: "Job completed successfully" });
  } catch (error) {
    return next(error);
  }
}

export async function rateJobController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;
    const { technicianRating, technicianComment, serviceRatings } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Ownership check
    if (job.userId.toString() !== req.userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to rate this job",
      });
    }

    // Job must be fullAndPaid
    if (job.status !== "fullAndPaid") {
      return res.status(400).json({
        success: false,
        message: "Job must be fully paid before rating",
      });
    }

    // Payment must be collected or prepaid
    if (
      job.paymentStatus?.status !== "collected" &&
      job.paymentStatus?.status !== "prepaid"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment not completed, cannot rate",
      });
    }

    const reviews: any[] = [];

    // ── Technician Rating ──
    if (technicianRating !== undefined) {
      if (technicianRating < 1 || technicianRating > 5) {
        return res.status(400).json({
          success: false,
          message: "Technician rating must be between 1 and 5",
        });
      }

      // Duplicate check
      const existingTechReview = await ServiceReview.findOne({
        jobId,
        userId: req.userId,
        serviceId: null,
      });
      if (existingTechReview) {
        return res.status(400).json({
          success: false,
          message: "Technician already rated for this job",
        });
      }

      reviews.push({
        userId: req.userId,
        jobId,
        technicianId: job.technicianId,
        serviceId: null,
        rating: technicianRating,
        comment: technicianComment || "",
      });
    }

    // ── Per-Service Ratings ──
    if (Array.isArray(serviceRatings)) {
      for (const sr of serviceRatings) {
        if (!sr.serviceId || sr.rating === undefined) continue;

        if (sr.rating < 1 || sr.rating > 5) {
          return res.status(400).json({
            success: false,
            message: `Rating for service ${sr.serviceId} must be between 1 and 5`,
          });
        }

        const service = job.bookedServices.find(
          (s) => s.serviceId.toString() === sr.serviceId,
        );
        if (!service) continue;

        // Duplicate check per service
        const existingServiceReview = await ServiceReview.findOne({
          jobId,
          userId: req.userId,
          serviceId: sr.serviceId,
        });
        if (existingServiceReview) continue; // skip already rated services silently

        reviews.push({
          serviceId: sr.serviceId,
          userId: req.userId,
          jobId,
          technicianId: job.technicianId,
          rating: sr.rating,
          comment: sr.comment || "",
        });
      }
    }

    if (reviews.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid ratings provided",
      });
    }

    await ServiceReview.insertMany(reviews);

    // Update technician average rating
    if (technicianRating !== undefined) {
      const technician = await Technician.findById(job.technicianId);
      if (technician) {
        const currentAvg = technician.averageRating || 0;
        const currentCount = technician.totalReviews || 0;
        const newCount = currentCount + 1;
        const newAvg =
          (currentAvg * currentCount + technicianRating) / newCount;
        technician.averageRating = Number(newAvg.toFixed(1));
        technician.totalReviews = newCount;
        await technician.save();
      }
    }

    job.steps.push({
      stepId: generateStepId(job.steps),
      stepName: "Job Rated",
      performedBy: "customer",
      stepDescription: "Customer submitted ratings for technician and services",
      createdAt: new Date(),
    });

    await job.save();

    return res.status(201).json({
      success: true,
      message: "Ratings submitted successfully. Thank you!",
    });
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
    const { jobId } = req.params;
    const { amount } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Ownership check
    if (
      !job.technicianId ||
      job.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Job is not assigned to you",
      });
    }

    if (job.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: `Job cannot be paid. Current status: ${job.status}`,
      });
    }

    if (job.paymentStatus?.status === "prepaid") {
      return res.status(400).json({
        success: false,
        message: "Prepaid job does not require cash collection",
      });
    }

    if (job.paymentStatus?.status === "collected") {
      return res.status(400).json({
        success: false,
        message: "Payment already collected for this job",
      });
    }

    // Amount must match final price
    if (Number(amount) !== (job.pricing?.finalPrice || 0)) {
      return res.status(400).json({
        success: false,
        message: `Amount mismatch. Expected: ${job.pricing?.finalPrice}, Received: ${amount}`,
      });
    }

    if (!job.paymentStatus) {
      return res.status(400).json({
        success: false,
        message: "Payment status information is missing for this job",
      });
    }

    job.paymentStatus.status = "collected";
    job.paymentStatus.paidAt = new Date();
    job.paymentStatus.paymentMethod = "cash";
    job.status = "fullAndPaid";

    job.steps.push({
      stepId: `STEP-${job.steps.length + 1}`,
      stepName: "Cash Collected",
      performedBy: "technician",
      stepDescription: `Technician collected cash payment of ₹${amount} from customer`,
      technicianId: req.technicianId,
      createdAt: new Date(),
    });

    await job.save();

    // NOTE: pendingPaymentJobs will be updated when technician submits
    // payment to admin via submitPaymentCollectionController

    return res.status(200).json({
      success: true,
      message:
        "Cash payment collected successfully. Please submit to admin within 7 days.",
      info: {
        amount,
        method: "cash",
        time: new Date(),
        jobId,
        technicianId: req.technicianId,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// export async function ratingByTechnicianController(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) {
//   try {
//     const { jobId } = req.params;
//     const { rating, additionalComment } = req.body;

//     const job = await Job.findById(jobId);

//     if (!job) {
//       return res.status(404).json({
//         success: false,
//         message: "Job not found",
//       });
//     }

//     if (
//       !job.technicianId ||
//       job.technicianId.toString() !== req.technicianId.toString()
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Job is not assigned to you",
//       });
//     }

//     if (job.status !== "fullAndPaid") {
//       return res.status(400).json({
//         success: false,
//         message: "Job status is not completed, can not be rated",
//       });
//     }

//     if (
//       job.paymentStatus?.status !== "collected" &&
//       job.paymentStatus?.status !== "prepaid"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Job payment is not paid, can not be rated",
//       });
//     }

//     job.ratingByTechnician = {
//       rating,
//       additionalComment,
//     };
//     job.steps.push({
//       stepId: "STEP-" + job.steps.length + 1,
//       stepName: "Rated",
//       stepDescription: "user rated by technician",
//       rating,
//       technicianId: req.technicianId,
//       createdAt: new Date(),
//     });

//     await job.save();

//     return res.status(200).json({
//       message: "Job rated successfully",
//       info: {
//         rating,
//         time: new Date(),
//         jobId,
//         technicianId: req.technicianId,
//         additionalComment,
//       },
//     });
//   } catch (error) {
//     return next(error);
//   }
// }

// export async function ratingByUserToTechnician(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) {
//   try {
//     const { rating, comment } = req.body;
//     const { jobId } = req.params;

//     if (!rating || !comment) {
//       return res.status(400).json({
//         success: false,
//         message: "Rating and comment are required",
//       });
//     }

//     if (rating < 1 || rating > 5) {
//       return res.status(400).json({
//         success: false,
//         message: "Rating must be between 1 and 5",
//       });
//     }

//     const job = await Job.findById(jobId);

//     if (!job) {
//       return res.status(404).json({
//         success: false,
//         message: "Job not found",
//       });
//     }

//     // technician validation
//     if (!job.technicianId) {
//       return res.status(400).json({
//         success: false,
//         message: "Job is not assigned to this technician",
//       });
//     }

//     // job complete
//     if (job.status !== "fullAndPaid") {
//       return res.status(400).json({
//         success: false,
//         message: "Job not completed",
//       });
//     }

//     // payment check
//     if (
//       job.paymentStatus?.status !== "collected" &&
//       job.paymentStatus?.status !== "prepaid"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment not completed",
//       });
//     }

//     // ✅ FIXED DUPLICATE CHECK
//     const existingReview = await ServiceReview.findOne({
//       jobId,
//       technicianId: job.technicianId,
//       userId: job.userId,
//       serviceId: null, // important → technician rating
//     });

//     if (existingReview) {
//       return res.status(400).json({
//         success: false,
//         message: "Technician already rated for this job",
//       });
//     }

//     // ✅ CREATE REVIEW (Technician Rating)
//     const review = await ServiceReview.create({
//       userId: job.userId,
//       jobId: job._id,
//       technicianId: job.technicianId,
//       serviceId: null, // important
//       rating,
//       comment,
//     });

//     // audit trail
//     job.steps.push({
//       stepId: "STEP-" + (job.steps.length + 1),
//       stepName: "User Rated Technician",
//       stepDescription: "Technician collected rating from user",
//       rating,
//       technicianId: job.technicianId,
//       createdAt: new Date(),
//     });

//     await job.save();

//     // increase technician review count
//     const technician = await Technician.findById(job.technicianId);
//     if (technician) {
//       technician.totalReviews += 1;
//       technician.averageRating = Number(
//         (
//           (technician.averageRating * (technician.totalReviews - 1) + rating) /
//           technician.totalReviews
//         ).toFixed(1),
//       );
//       await technician.save();
//     }

//     return res.status(201).json({
//       success: true,
//       message: "Technician rating submitted",
//       review,
//     });
//   } catch (error) {
//     return next(error);
//   }
// }

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
        success: false,
        message: "Payment amount and method are required",
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Ownership check
    if (
      !job.technicianId ||
      job.technicianId.toString() !== req.technicianId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Job is not assigned to you",
      });
    }

    // Job must be fullAndPaid (cash already collected)
    if (job.status !== "fullAndPaid") {
      return res.status(400).json({
        success: false,
        message:
          "Cash must be collected from customer before submitting to admin",
      });
    }

    // Only cash collected jobs can be submitted
    if (
      job.paymentStatus?.status === "prepaid" ||
      job.paymentStatus?.status === "refunded"
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot submit payment for prepaid or refunded jobs",
      });
    }

    // Block duplicate submission
    if (
      job.paymentCollectionStatus === "pending" ||
      job.paymentCollectionStatus === "collected"
    ) {
      return res.status(400).json({
        success: false,
        message: `Payment already ${job.paymentCollectionStatus === "pending" ? "submitted and awaiting admin confirmation" : "confirmed by admin"}`,
      });
    }

    // Amount must match
    if (Number(paymentAmount) !== (job.pricing?.finalPrice || 0)) {
      return res.status(400).json({
        success: false,
        message: `Amount mismatch. Expected: ${job.pricing?.finalPrice}, Submitted: ${paymentAmount}`,
      });
    }

    job.paymentCollectionStatus = "pending";
    job.collectedAt = new Date();
    job.collectionDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Add to technician's pendingPaymentJobs
    await Technician.findByIdAndUpdate(req.technicianId, {
      $addToSet: { pendingPaymentJobs: jobId },
    });

    job.steps.push({
      stepId: `STEP-${job.steps.length + 1}`,
      stepName: "Payment Submitted to Admin",
      performedBy: "technician",
      stepDescription: `Technician submitted ₹${paymentAmount} via ${paymentMethod} to admin for confirmation`,
      technicianId: req.technicianId,
      paymentAmount,
      paymentMethod,
      createdAt: new Date(),
    });

    await job.save();

    return res.status(200).json({
      success: true,
      message: "Payment submitted for admin confirmation",
      info: {
        paymentCollectionStatus: job.paymentCollectionStatus,
        collectionDeadline: job.collectionDeadline,
        paymentAmount,
        paymentMethod,
      },
    });
  } catch (error) {
    return next(error);
  }
}
