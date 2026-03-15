import { Request, Response, NextFunction } from "express";
import Job from "../../models/Services/jobs.js";
import JobCart from "../../models/Services/jobCart.js";
import mongoose from "mongoose";
import Service from "../../models/Services/service.js";
import uploadToCloudinary from "../../utils/uploadToCloudinary.js";

export const addJobToCartController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const { serviceId, quantity = 1 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service id",
      });
    }

    // find service
    const service = await Service.findOne({ _id: serviceId, status: "active" });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or inactive",
      });
    }

    if (quantity > 10 || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity should be between 1 and 10",
      });
    }

    const cartId = `CART-${Date.now()}`;
    let jobCart = await JobCart.findOne({
      userId,
      status: "active",
    });

    if (!jobCart) {
      jobCart = await JobCart.create({
        cartId,
        userId,
        serviceItems: [],
        summary: {
          totalItems: 0,
          subtotal: 0,
          totalGst: 0,
          grandTotal: 0,
          totalDuration: 0,
        },
        status: "active",
      });
    }

    // Helper to get duration in minutes
    const getDurationInMinutes = (duration: any) => {
      if (!duration || !duration.count) return 0;
      if (duration.unit === "hours") return duration.count * 60;
      return duration.count; // minutes
    };

    const durationInMinutes = getDurationInMinutes(service.duration);

    const existingItems = jobCart.serviceItems.find(
      (item) => item.serviceId.toString() === serviceId,
    );

    if (existingItems) {
      existingItems.quantity += quantity;
      existingItems.price = service.price;
      existingItems.gstRate = service.gstRate;
      existingItems.duration = service.duration;
      existingItems.warranty = service.warranty;
      existingItems.category = service.category;
      existingItems.type = service.type;
      existingItems.name = service.name;
      existingItems.subTotal = existingItems.price * existingItems.quantity;
      existingItems.totalDuration = durationInMinutes * existingItems.quantity;
      existingItems.image =
        service.images.length > 0
          ? {
              url: service.images[0].url,
              public_id: service.images[0].public_id,
            }
          : undefined;
    } else {
      jobCart.serviceItems.push({
        serviceId,
        name: service.name,
        type: service.type,
        category: service.category,
        price: service.price,
        gstRate: service.gstRate,
        duration: {
          count: service.duration?.count,
          unit: service.duration?.unit,
        },
        image:
          service.images.length > 0
            ? {
                url: service.images[0].url,
                public_id: service.images[0].public_id,
              }
            : undefined,
        warranty: {
          provided: service.warranty?.provided,
          period: service.warranty?.period,
        },
        quantity,
        subTotal: service.price * quantity,
        totalDuration: durationInMinutes * quantity,
      });
    }

    if (jobCart.summary) {
      jobCart.summary.totalItems = jobCart.serviceItems.length;
      jobCart.summary.totalQuantity = jobCart.serviceItems.reduce(
        (acc, item) => acc + (item.quantity || 0),
        0,
      );
      jobCart.summary.subtotal = jobCart.serviceItems.reduce(
        (acc, item) => acc + (item.subTotal || 0),
        0,
      );
      jobCart.summary.totalGst = jobCart.serviceItems.reduce(
        (acc, item) =>
          acc +
          (item.price || 0) *
            (item.quantity || 0) *
            ((item.gstRate || 0) / 100),
        0,
      );
      jobCart.summary.grandTotal =
        jobCart.summary.subtotal + jobCart.summary.totalGst;
      jobCart.summary.totalDuration = jobCart.serviceItems.reduce(
        (acc, item) => acc + (item.totalDuration || 0),
        0,
      );
    }

    await jobCart.save();

    return res.status(200).json({
      success: true,
      message: "Service added to cart",
      data: jobCart,
    });
  } catch (error) {
    return next(error);
  }
};

export const getCartDetailsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const jobCart = await JobCart.findOne({
      userId,
      status: "active",
    });

    if (!jobCart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart details fetched successfully",
      data: jobCart,
    });
  } catch (error) {
    return next(error);
  }
};

// export const updateCartController = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const userId = req.userId;
//     const { serviceId } = req.params;
//     const { quantity } = req.body;

//   } catch (error) {
//     return next(error);
//   }
// };

export const clearCartController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;

    const jobCart = await JobCart.findOne({
      userId,
      status: "active",
    });

    if (!jobCart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    jobCart.serviceItems = [] as any;
    jobCart.summary = {
      totalItems: 0,
      totalQuantity: 0,
      subtotal: 0,
      totalGst: 0,
      grandTotal: 0,
      totalDuration: 0,
    };

    await jobCart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: jobCart,
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
  let uploadedImages: any = [];
  try {
    const {
      services,
      brandName,
      modelType,
      problems,
      remarkByUser,
      preferredStartTime,
      preferredDuration,
      house_apartment,
      street_sector,
      landmark,
      fullName,
    } = req.body;
    const userId = req.userId;
    console.log(req.body);

    const jobId = `JOB-${Date.now()}`;

    if (
      !Array.isArray(services) ||
      services.length === 0 ||
      services.some(
        (service: string) => !mongoose.Types.ObjectId.isValid(service),
      )
    ) {
      return res.status(400).json({ message: "Invalid service id" });
    }

    const servicesData = await Service.find({ _id: { $in: services } });

    if (servicesData.length !== services.length) {
      return res.status(400).json({ message: "Invalid service id" });
    }

    const totalPrice = servicesData.reduce((acc: number, service: any) => {
      return acc + Number(service.price);
    }, 0);

    const totalDuration = servicesData.reduce((acc: number, service: any) => {
      return acc + service.duration.count;
    }, 0);

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Service images are required for job",
      });
    }

    // upload images to cloudinary
    uploadedImages = await Promise.all(
      files.map((file) => uploadToCloudinary(file, "image")),
    );

    const job = new Job({
      jobId,
      services,
      userId,
      jobName: servicesData[0].name,
      brandName,
      modelType,
      problems,
      remarkByUser,
      preferredDate: {
        startTime: preferredStartTime,
        duration: preferredDuration,
      },
      imageByUser: uploadedImages.map((image: any) => ({
        url: image.url,
        public_id: image.public_id,
      })),
      totalPrice,
      totalDuration,
      address: {
        house_apartment,
        street_sector,
        landmark,
        fullName,
      },
    });

    await job.save();

    return res
      .status(201)
      .json({ message: "Job created successfully", data: job });
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
    // get user preference for reschedule - new date and time
    const { preferredDate, preferredStartTime } = req.body;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to accept this reschedule request",
      });
    }

    if (!job.rescheduleRequest || job.rescheduleRequest.status !== "pending") {
      return res.status(400).json({
        message: "No pending reschedule request for this job",
      });
    }

    // User accepts the reschedule - update job with new date
    job.rescheduleRequest.status = "accepted";
    job.rescheduleRequest.approvedBy = "user";
    job.rescheduleRequest.approvedAt = new Date();

    // Update job preferredDate if newDate was provided in original request
    if (job.rescheduleRequest.requestedDate) {
      job.preferredDate = {
        date: preferredDate,
        startTime: preferredStartTime,
        endTime: new Date(preferredStartTime.getTime() + 2 * 60 * 60 * 1000), // 2 hour default
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
