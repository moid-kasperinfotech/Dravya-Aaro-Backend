import { Request, Response, NextFunction } from "express";
import Job from "../../models/Services/jobs.js";
import JobCart from "../../models/Services/jobCart.js";
import Service from "../../models/Services/service.js";
import uploadToCloudinary from "../../utils/uploadToCloudinary.js";

const SERVICE_FLOW: Record<string, { type: string }[]> = {
  repair: [],
  installation: [],
  uninstallation: [],
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
    const {
      serviceId,
      serviceQuantity = 1,
      brandName,
      modelType,
      problems,
      remarkByUser,
    } = req.body;
    const userId = req.userId;

    if (!serviceId || serviceQuantity <= 0 || !brandName || !modelType) {
      return res.status(400).json({
        success: false,
        message: "Service ID, quantity, brandName and modelType are required",
      });
    }

    const service = await Service.findById(serviceId);
    if (!service || service.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Service not found or inactive",
      });
    }

    if (service.type === "repair" && !problems) {
      return res.status(400).json({
        success: false,
        message: "Problems are required for repair service type",
      });
    }

    let parsedProblems = problems;
    if (problems && typeof problems === "string") {
      try {
        parsedProblems = JSON.parse(problems);
      } catch (error) {
        parsedProblems = problems
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    if (problems && !Array.isArray(parsedProblems)) {
      return res.status(400).json({
        success: false,
        message: "Problems must be a non-empty array",
      });
    }

    const files = req.files as Express.Multer.File[] | undefined;
    let uploadedImages: any = [];
    if (files && files.length > 0) {
      uploadedImages = await Promise.all(
        files.map((file) => uploadToCloudinary(file, "image")),
      );
    }

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
      existingService.serviceQuantity += Number(serviceQuantity);
      existingService.brandName = brandName;
      existingService.modelType = modelType;
      existingService.problems = parsedProblems || existingService.problems;
      existingService.remarkByUser = remarkByUser;
      if (uploadedImages.length > 0) {
        existingService.imageByUser = uploadedImages.map((image: any) => ({
          url: image.url,
          public_id: image.public_id,
        })) as any;
      }
    } else {
      jobCart.serviceList.push({
        serviceId,
        serviceQuantity,
        brandName,
        modelType,
        problems: parsedProblems,
        remarkByUser,
        imageByUser: uploadedImages.map((image: any) => ({
          url: image.url,
          public_id: image.public_id,
        })),
      } as any);
    }

    jobCart.totalQuantity = jobCart.serviceList.reduce(
      (total, item) => total + item.serviceQuantity,
      0,
    );

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
    const jobCart = await JobCart.findOne({ userId: req.userId }).populate(
      "serviceList.serviceId",
    );
    if (!jobCart) {
      return res.status(404).json({
        success: false,
        message: "Job cart not found",
      });
    }

    let servicePriceTotal = 0;
    let totalDiscount = 0;

    const cartItems = jobCart.serviceList.map((item: any) => {
      const service = item.serviceId;
      const subTotal = service.price * item.serviceQuantity;
      const itemDiscount = (subTotal * (service.discount || 0)) / 100;

      servicePriceTotal += subTotal;
      totalDiscount += itemDiscount;

      return {
        serviceId: service._id,
        serviceName: service.name,
        serviceType: service.type,
        serviceCategory: service.category,
        serviceImage: service.image?.url || "",
        price: service.price,
        discount: service.discount || 0,
        quantity: item.serviceQuantity,
        subTotal,
        brandName: item.brandName,
        modelType: item.modelType,
        problems: item.problems,
        remarkByUser: item.remarkByUser,
        imageByUser: item.imageByUser,
        requiredQuotation: service.requiredQuotation,
      };
    });

    const deliveryCharge = servicePriceTotal >= 2000 ? 0 : 50;
    const gstTax = (servicePriceTotal * 18) / 100;
    const total = servicePriceTotal + gstTax + deliveryCharge - totalDiscount;

    const orderSummary = {
      subtotal: servicePriceTotal,
      delivery: deliveryCharge,
      gst: gstTax,
      gstPercentage: "18.00",
      discount: totalDiscount,
      total,
    };

    return res.status(200).json({
      success: true,
      message: "Job cart fetched successfully",
      data: {
        cartItems,
        totalItems: jobCart.totalQuantity,
        orderSummary,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateServiceCartQuantityController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { serviceId, action } = req.body;
    const userId = req.userId;

    if (!serviceId || !action) {
      return res.status(400).json({
        success: false,
        message: "Service ID and action (increase/decrease) required",
      });
    }

    const jobCart = await JobCart.findOne({ userId });
    if (!jobCart) {
      return res.status(404).json({
        success: false,
        message: "Job cart not found",
      });
    }

    const serviceIndex = jobCart.serviceList.findIndex(
      (item) => item.serviceId.toString() === serviceId,
    );

    if (serviceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Service not found in cart",
      });
    }

    const cartItem = jobCart.serviceList[serviceIndex];

    if (action === "increase") {
      cartItem.serviceQuantity += 1;
    } else if (action === "decrease") {
      if (cartItem.serviceQuantity <= 1) {
        jobCart.serviceList.splice(serviceIndex, 1);
      } else {
        cartItem.serviceQuantity -= 1;
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use 'increase' or 'decrease'",
      });
    }

    jobCart.totalQuantity = jobCart.serviceList.reduce(
      (total, item) => total + item.serviceQuantity,
      0,
    );

    await jobCart.save();

    return res.status(200).json({
      success: true,
      message: "Service cart updated successfully",
      jobCart,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateCartItemQuantityController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { serviceId, serviceQuantity } = req.body;
    const userId = req.userId;

    if (!serviceId || serviceQuantity === undefined || serviceQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Service ID and valid quantity required",
      });
    }

    const jobCart = await JobCart.findOne({ userId });
    if (!jobCart) {
      return res.status(404).json({
        success: false,
        message: "Job cart not found",
      });
    }

    const serviceIndex = jobCart.serviceList.findIndex(
      (item) => item.serviceId.toString() === serviceId,
    );

    if (serviceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Service not found in cart",
      });
    }

    if (serviceQuantity === 0) {
      jobCart.serviceList.splice(serviceIndex, 1);
    } else {
      jobCart.serviceList[serviceIndex].serviceQuantity = serviceQuantity;
    }

    jobCart.totalQuantity = jobCart.serviceList.reduce(
      (total, item) => total + item.serviceQuantity,
      0,
    );

    await jobCart.save();

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      jobCart,
    });
  } catch (error) {
    return next(error);
  }
};

export const removeFromCartController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { serviceId } = req.params;
    const userId = req.userId;

    const jobCart = await JobCart.findOne({ userId });
    if (!jobCart) {
      return res.status(404).json({
        success: false,
        message: "Job cart not found",
      });
    }

    const serviceIndex = jobCart.serviceList.findIndex(
      (item) => item.serviceId.toString() === serviceId,
    );

    if (serviceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Service not found in cart",
      });
    }

    jobCart.serviceList.splice(serviceIndex, 1);

    jobCart.totalQuantity = jobCart.serviceList.reduce(
      (total, item) => total + item.serviceQuantity,
      0,
    );

    await jobCart.save();

    return res.status(200).json({
      success: true,
      message: "Service removed from cart successfully",
      jobCart,
    });
  } catch (error) {
    return next(error);
  }
};

export const clearServicesFromJobCartController = async (
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

    jobCart.serviceList = [] as any;
    jobCart.totalQuantity = 0;

    await jobCart.save();

    return res.status(200).json({
      success: true,
      message: "Services cleared from cart successfully",
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

    const jobCart = await JobCart.findOne({ userId }).populate(
      "serviceList.serviceId",
    );
    if (!jobCart || jobCart.serviceList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No services in cart or cart not found",
      });
    }

    const serviceIds = jobCart.serviceList.map(
      (item: any) => item.serviceId._id,
    );
    const services = await Service.find({ _id: { $in: serviceIds } });

    if (services.length !== serviceIds.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid service id or some services not found",
      });
    }

    let {
      addressType,
      fromAddress,
      toAddress,
      serviceAddress,
      date,
      timeRange,
      paymentMethod,
    } = req.body;

    if (!date || !timeRange || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Date, timeRange, and paymentMethod are required",
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

      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

      return {
        startTime,
        endTime,
        duration,
      };
    };

    const { startTime, endTime, duration } = parseTimeRange(date, timeRange);

    // Calculate pricing from cart
    let servicePriceTotal = 0;
    let totalDiscount = 0;
    jobCart.serviceList.forEach((item: any) => {
      const service = item.serviceId;
      const subTotal = service.price * item.serviceQuantity;
      servicePriceTotal += subTotal;
      totalDiscount += (subTotal * (service.discount || 0)) / 100;
    });
    const gstTax = (servicePriceTotal * 18) / 100;
    const finalPrice = servicePriceTotal + gstTax - totalDiscount;

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
      if (!serviceAddress.house_apartment || !serviceAddress.street_sector || !serviceAddress.fullName || !serviceAddress.mobileNumber) {
        return res.status(400).json({
          success: false,
          message: "Address must include house_apartment, street_sector, fullName, and mobileNumber",
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
      if (!fromAddress.house_apartment || !fromAddress.street_sector || !fromAddress.fullName || !fromAddress.mobileNumber) {
        return res.status(400).json({
          success: false,
          message: "From address must include house_apartment, street_sector, fullName, and mobileNumber",
        });
      }
      if (!toAddress.house_apartment || !toAddress.street_sector || !toAddress.fullName || !toAddress.mobileNumber) {
        return res.status(400).json({
          success: false,
          message: "To address must include house_apartment, street_sector, fullName, and mobileNumber",
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
      if (!fromAddress.house_apartment || !fromAddress.street_sector || !fromAddress.fullName || !fromAddress.mobileNumber) {
        return res.status(400).json({
          success: false,
          message: "From address must include house_apartment, street_sector, fullName, and mobileNumber",
        });
      }
      if (!toAddress.house_apartment || !toAddress.street_sector || !toAddress.fullName || !toAddress.mobileNumber) {
        return res.status(400).json({
          success: false,
          message: "To address must include house_apartment, street_sector, fullName, and mobileNumber",
        });
      }

      if (!["fromAddress", "toAddress"].includes(addressType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid address type",
        });
      }
    }

    const jobPayload: any = {
      jobId,
      userId,
      preferredDate: {
        startTime,
        endTime,
        duration,
      },
      pricing: {
        subTotal: servicePriceTotal,
        gst: gstTax,
        discount: totalDiscount,
        finalPrice,
      },
      paymentStatus: {
        status: paymentMethod === "cash" ? "unpaid" : "paid",
        paymentMethod,
        paidAt: paymentMethod === "cash" ? null : new Date(),
      },
      status: "pending",
      bookedServices: jobCart.serviceList.map((item: any) => {
        const service = item.serviceId;
        return {
          serviceId: service._id,
          serviceName: service.name,
          serviceType: service.type,
          requiredQuotation: service.requiredQuotation,
          serviceQuantity: item.serviceQuantity,
          servicePrice: service.price,
          subTotal: service.price * item.serviceQuantity,
          brandName: item.brandName,
          modelType: item.modelType,
          problems: item.problems,
          remarkByUser: item.remarkByUser,
          imageByUser: item.imageByUser,
          status: "pending",
          subServices: generateSubServices(service.type),
        };
      }),
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
    }).sort({ createdAt: -1 });

    return res.status(200).json({ 
      success: true,
      message: "Ongoing jobs fetched successfully", 
      data: { jobs, count: jobs.length } 
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
    const userId = req.userId;

    const job = await Job.findOne({ _id: jobId, userId });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job details fetched successfully",
      data: job,
    });
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

    const [jobs, total] = await Promise.all([
      Job.find({
        userId,
        status: { $in: ["fullAndPaid", "cancelled"] },
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      Job.countDocuments({
        userId,
        status: { $in: ["fullAndPaid", "cancelled"] },
      }),
    ]);

    return res.status(200).json({ 
      success: true,
      message: "Job history fetched successfully", 
      data: {
        jobs,
        pagination: {
          current: pageNumber,
          total,
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
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

export async function requestCancellationController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId } = req.params;
    const { reason, additionalInfo } = req.body;
    const userId = req.userId;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Reason for cancellation is required",
      });
    }

    const job = await Job.findOne({ _id: jobId, userId });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (["cancelled", "fullAndPaid"].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a job that is already completed or cancelled",
      });
    }

    if (job.cancellationRequest && job.cancellationRequest.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Cancellation request already pending",
      });
    }

    job.cancellationRequest = {
      status: "pending",
      requestedBy: "user",
      reason,
      additionalInfo,
      requestedAt: new Date(),
      refundType: "none",
      refundAmount: 0,
      approvedBy: null,
      approvedAt: null,
      cancelledAt: null,
    };

    job.steps.push({
      stepId: "STEP-" + (job.steps.length + 1),
      stepName: "Cancellation Requested",
      stepDescription: `User requested cancellation - Reason: ${reason}`,
      userId: userId,
      createdAt: new Date(),
    });

    await job.save();

    // TODO.SendNotification: Notify admin about cancellation request

    return res.status(200).json({
      success: true,
      message: "Cancellation request submitted successfully. Admin will review your request.",
      data: job,
    });
  } catch (error) {
    return next(error);
  }
}
