import { Request, Response, NextFunction } from "express";
import Job from "../../models/Services/jobs.js";
import JobCart from "../../models/Services/jobCart.js";
import mongoose from "mongoose";
import Service from "../../models/Services/service.js";
import uploadToCloudinary from "../../utils/uploadToCloudinary.js";

const SERVICE_FLOW: Record<string, { type: string }[]> = {
  repair: [],
  "installation-uninstallation": [{ type: "uninstall" }, { type: "install" }],
};

// helper function
function generateSubServices(serviceType: string) {
  const flow = SERVICE_FLOW[serviceType as keyof typeof SERVICE_FLOW] || [];

  return flow.map((step: any) => ({
    type: step.type,
    status: "pending",
    startedAt: null,
    completedAt: null,
  }));
}

export const addJobToCartController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { serviceId, serviceQuantity = 1 } = req.body;
    const userId = req.userId;

    if (!serviceId || serviceQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Service ID and quantity required",
      });
    }

    const service = await Service.findById(serviceId);
    if (!service || service.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Service not found or inactive",
      });
    }

    // find job cart
    let jobCart = await JobCart.findOne({ userId });
    if (!jobCart) {
      jobCart = await JobCart.create({
        userId,
        serviceList: [],
      });
    }

    const existingService = jobCart.serviceList.find(
      (item) => item.serviceId.toString() === serviceId,
    );

    if (existingService) {
      existingService.serviceQuantity += serviceQuantity;
      existingService.subTotal =
        existingService.servicePrice * existingService.serviceQuantity;
    } else {
      jobCart.serviceList.push({
        serviceId,
        serviceName: service.name,
        serviceQuantity,
        servicePrice: service.price,
        serviceType: service.type,
        subTotal: service.price * serviceQuantity,
      });
    }

    // total quantity
    jobCart.totalQuantity = jobCart.serviceList.reduce(
      (total, item) => total + item.serviceQuantity,
      0,
    );

    // total price
    jobCart.servicePriceTotal = jobCart.serviceList.reduce(
      (total, item) => total + item.servicePrice * item.serviceQuantity,
      0,
    );

    // GST calculation
    jobCart.gstTax = jobCart.serviceList.reduce((total, item) => {
      const taxRate = service.taxRate ?? 0;
      return total + (item.subTotal * taxRate) / 100;
    }, 0);

    jobCart.payableAmount = jobCart.servicePriceTotal + jobCart.gstTax;
    await jobCart.save();

    return res.status(200).json({
      success: true,
      message: "Service added to cart successfully",
      jobCart,
    });
  } catch (error) {
    return next(error);
  }
};

export const getJobCartController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobCart = await JobCart.findOne({ userId: req.userId });
    if (!jobCart) {
      return res.status(404).json({
        success: false,
        message: "Job cart not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job cart fetched successfully",
      jobCart,
    });
  } catch (error) {
    return next(error);
  }
};

export async function bookServiceController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.userId;
    const jobId = `JOB-${Date.now()}`;

    const jobCart = await JobCart.findOne({ userId });
    if (!jobCart || jobCart.serviceList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No services in cart or cart not found",
      });
    }

    const serviceIds = jobCart.serviceList.map((item) => item.serviceId);
    const services = await Service.find({ _id: { $in: serviceIds } });

    if (services.length !== serviceIds.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid service id or some services not found",
      });
    }

    let {
      brandName,
      modelType,
      problems,
      remarkByUser,
      addressType,
      fromAddress,
      toAddress,
      serviceAddress,
      date,
      timeRange,
      paymentMethod,
    } = req.body;

    console.log(req.body);

    if (!brandName || !modelType || !date || !timeRange || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (typeof problems === "string") {
      problems = JSON.parse(problems);
    }

    if (!Array.isArray(problems) || problems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Problems must be a non-empty array",
      });
    }

    if (typeof serviceAddress === "string") {
      serviceAddress = JSON.parse(serviceAddress);
    }

    if (typeof fromAddress === "string") {
      fromAddress = JSON.parse(fromAddress);
    }

    if (typeof toAddress === "string") {
      toAddress = JSON.parse(toAddress);
    }

    // make preffered schedule time
    const parseTimeRange = (
      date: any,
      timeRange: { split: (arg0: string) => [any, any] },
    ) => {
      const [start, end] = timeRange.split("-");

      const startTime = new Date(`${date} ${start}`);
      const endTime = new Date(`${date} ${end}`);

      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // in minutes

      return {
        startTime,
        endTime,
        duration,
      };
    };

    const { startTime, endTime, duration } = parseTimeRange(date, timeRange);

    // check service types
    const hasRelocation = services.some(
      (s) => s.type === "installation-uninstallation",
    );
    const hasNormalService = services.some(
      (s) => s.type !== "installation-uninstallation",
    );

    // CASE 1 -- If there is only normal service
    if (!hasRelocation && hasNormalService) {
      if (!serviceAddress) {
        return res.status(400).json({
          success: false,
          message: "Service address is required for normal service",
        });
      }
    }

    // CASE 2 -- If there is only relocation
    if (!hasNormalService && hasRelocation) {
      if (!fromAddress || !toAddress) {
        return res.status(400).json({
          success: false,
          message: "From and to addresses are required for relocation",
        });
      }
    }

    // CASE 3 -- If there is both relocation and normal service
    if (hasNormalService && hasRelocation) {
      if (!fromAddress || !toAddress) {
        return res.status(400).json({
          success: false,
          message: "from and to addresses are required for relocation",
        });
      }

      if (!["fromAddress", "toAddress"].includes(addressType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid address type",
        });
      }
    }

    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Service images are required for job",
      });
    }

    // upload images to cloudinary
    const uploadedImages = await Promise.all(
      files.map((file) => uploadToCloudinary(file, "image")),
    );

    const jobPayload: any = {
      jobId,
      userId,
      brandName,
      modelType,
      problems: problems.map((p: string) => p.trim()),
      remarkByUser,
      preferredDate: {
        startTime,
        endTime,
        duration,
      },
      imageByUser: uploadedImages.map((image: any) => ({
        url: image.url,
        public_id: image.public_id,
      })),
      pricing: {
        subTotal: jobCart.servicePriceTotal,
        gst: jobCart.gstTax,
        finalPrice: jobCart.payableAmount,
      },
      paymentStatus: {
        status: paymentMethod === "cash" ? "unpaid" : "paid",
        paymentMethod,
        paidAt: paymentMethod === "cash" ? null : new Date(),
      },
      status: "pending",
      bookedServices: jobCart.serviceList.map((service: any) => ({
        serviceId: new mongoose.Types.ObjectId(service.serviceId),
        serviceName: service.serviceName,
        serviceType: service.serviceType,
        serviceQuantity: service.serviceQuantity,
        servicePrice: service.servicePrice,
        subTotal: service.subTotal,
        status: "pending",
        subServices: generateSubServices(service.serviceType),
      })),
    };

    // ONLY relocation
    if (hasRelocation && !hasNormalService) {
      jobPayload.fromAddress = fromAddress;
      jobPayload.toAddress = toAddress;
    }

    // ONLY normal service
    if (hasNormalService && !hasRelocation) {
      jobPayload.address = serviceAddress;
    }

    // BOTH services
    if (hasRelocation && hasNormalService) {
      jobPayload.fromAddress = fromAddress;
      jobPayload.toAddress = toAddress;

      if (addressType === "fromAddress") {
        jobPayload.address = fromAddress;
      } else {
        jobPayload.address = toAddress;
      }
    }

    const job = await Job.create(jobPayload);

    // clear cart
    jobCart.serviceList = [] as any;
    jobCart.totalQuantity = 0;
    jobCart.servicePriceTotal = 0;
    jobCart.gstTax = 0;
    jobCart.payableAmount = 0;

    await jobCart.save();

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getOngoingJobController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.userId;

    const jobs = await Job.find({
      userId,
      status: { $nin: ["fullAndPaid", "cancelled"] },
    });

    return res.status(200).json({ message: "Job fetched successfully", jobs });
  } catch (error) {
    return next(error);
  }
}

export async function getHistoryJobController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit } = req.query;
    const userId = req.userId;

    const pageNumber = page ? parseInt(page as string) : 1;
    const limitNumber = limit ? parseInt(limit as string) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const jobs = await Job.find({
      userId,
      status: { $in: ["fullAndPaid", "cancelled"] },
    })
      .skip(skip)
      .limit(limitNumber);

    return res.status(200).json({ message: "Job fetched successfully", jobs });
  } catch (error) {
    return next(error);
  }
}

export async function acceptRescheduleController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;
    const userId = req.userId;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.userId.toString() !== userId.toString()) {
      return res.status(403).json({
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
    job.rescheduleRequest.approvedBy = "user";
    job.rescheduleRequest.approvedAt = new Date();

    // Update job rescheduled if newDate was provided in original request
    if (job.rescheduleRequest.requestedDate) {
      job.rescheduled = {
        preferredDate: job.rescheduleRequest.requestedDate,
        reason: job.rescheduleRequest.reason,
        additionalInfo: job.rescheduleRequest.additionalInfo,
      };
    }

    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Reschedule Accepted",
      stepDescription: "User accepted the technician's reschedule request",
      userId: userId,
      createdAt: new Date(),
    });

    await job.save();

    // TODO.SendNotification: Notify technician that reschedule was accepted

    return res.status(200).json({
      success: true,
      message: "Reschedule request accepted successfully",
      job,
    });
  } catch (error) {
    return next(error);
  }
}

export async function rejectRescheduleController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;
    const { reason } = req.body;
    const userId = req.userId;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Reason for rejection is required",
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to reject this reschedule request",
      });
    }

    if (!job.rescheduleRequest || job.rescheduleRequest.status !== "pending") {
      return res.status(400).json({
        message: "No pending reschedule request for this job",
      });
    }

    // User rejects the reschedule
    job.rescheduleRequest.status = "rejected";
    job.rescheduleRequest.approvedBy = "user";
    job.rescheduleRequest.approvedAt = new Date();

    job.steps.push({
      stepId: "STEP-" + job.steps.length + 1,
      stepName: "Reschedule Rejected",
      stepDescription: `User rejected reschedule request - Reason: ${reason}`,
      userId: userId,
      createdAt: new Date(),
    });

    await job.save();

    // TODO.SendNotification: Notify technician and admin about rejection

    return res.status(200).json({
      success: true,
      message: "Reschedule request rejected successfully",
    });
  } catch (error) {
    return next(error);
  }
}
