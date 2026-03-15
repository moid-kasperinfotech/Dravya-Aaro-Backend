import { Request, Response, NextFunction } from "express";
import Job from "../../models/Services/jobs.js";
import JobCart from "../../models/Services/jobCart.js";
import mongoose from "mongoose";
import Service from "../../models/Services/service.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../../utils/uploadToCloudinary.js";

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

interface AddressInput {
  fullName: string;
  mobileNumber: string;
  latitude?: number;
  longitude?: number;
  house_apartment: string;
  street_sector: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

interface ServiceAddressMap {
  [serviceId: string]: {
    addressIndex?: number; // for normal services
    fromAddressIndex?: number; // for relocation
    toAddressIndex?: number; // for relocation
  };
}

function validateAddress(addr: AddressInput, label: string): string | null {
  const required: (keyof AddressInput)[] = [
    "fullName",
    "mobileNumber",
    "latitude",
    "longitude",
    "house_apartment",
    "street_sector",
    "city",
    "state",
    "pincode",
  ];
  for (const field of required) {
    if (!addr[field] || String(addr[field]).trim() === "") {
      return `${label}: "${field}" is required`;
    }
  }
  if (!/^\d{10}$/.test(addr.mobileNumber)) {
    return `${label}: mobileNumber must be 10 digits`;
  }
  if (!/^\d{6}$/.test(addr.pincode)) {
    return `${label}: pincode must be 6 digits`;
  }
  return null;
}

function getDurationInMinutes(duration: any): number {
  if (!duration?.count) return 0;
  return duration.unit === "hours" ? duration.count * 60 : duration.count;
}

export async function bookServiceController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let uploadedImages: { url: string; public_id: string }[] = [];
  try {
    const userId = req.userId;

    // ── 1. Parse & Basic Validation
    const {
      brandName,
      modelType,
      problems,
      remarkByUser,
      paymentMode,
      slotDate,
      slotStartTime,
      slotEndTime,
      addresses: addressesRaw,
      serviceAddressMap: serviceAddressMapRaw,
    } = req.body;

    // Validate required scalars
    if (!brandName?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "brandName is required" });
    }
    if (!modelType?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "modelType is required" });
    }
    if (!["prepaid", "pay_after"].includes(paymentMode)) {
      return res.status(400).json({
        success: false,
        message: "paymentMode must be 'prepaid' or 'pay_after'",
      });
    }

    // Validate slot
    if (!slotDate || !slotStartTime || !slotEndTime) {
      return res
        .status(400)
        .json({ success: false, message: "Slot date and time are required" });
    }
    const parsedDate = new Date(slotDate);
    const parsedStartTime = new Date(slotStartTime);
    const parsedEndTime = new Date(slotEndTime);

    if (
      isNaN(parsedDate.getTime()) ||
      isNaN(parsedStartTime.getTime()) ||
      isNaN(parsedEndTime.getTime())
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid slot date/time format" });
    }
    if (parsedStartTime >= parsedEndTime) {
      return res.status(400).json({
        success: false,
        message: "slotStartTime must be before slotEndTime",
      });
    }
    if (parsedStartTime <= new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Slot must be in the future" });
    }

    const slotDurationMinutes = Math.round(
      (parsedEndTime.getTime() - parsedStartTime.getTime()) / 60000,
    );

    // ── 2. Fetch Active Cart
    const cart = await JobCart.findOne({ userId, status: "active" });

    if (!cart || cart.serviceItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const serviceIds = cart.serviceItems.map((item) => item.serviceId);
    const servicesData = await Service.find({
      _id: { $in: serviceIds },
      status: "active",
    });

    // Check all services are still active
    if (servicesData.length !== serviceIds.length) {
      const foundIds = servicesData.map((s) => s._id.toString());
      const missing = serviceIds
        .map((id) => id.toString())
        .filter((id) => !foundIds.includes(id));
      return res.status(400).json({
        success: false,
        message: `Some services are no longer available: ${missing.join(", ")}`,
      });
    }

    // Map for quick lookup: serviceId → service doc
    const serviceMap = new Map(servicesData.map((s) => [s._id.toString(), s]));

    const hasRelocation = servicesData.some((s) => s.type === "relocation");
    const hasNonRelocation = servicesData.some((s) => s.type !== "relocation");

    const jobCategory: "normal" | "relocation" | "mixed" =
      hasRelocation && hasNonRelocation
        ? "mixed"
        : hasRelocation
          ? "relocation"
          : "normal";

    // ── 5. Validate Addresses
    let addresses: AddressInput[];
    try {
      addresses =
        typeof addressesRaw === "string"
          ? JSON.parse(addressesRaw)
          : addressesRaw;
    } catch {
      return res
        .status(400)
        .json({ success: false, message: "Invalid addresses format" });
    }

    if (!Array.isArray(addresses)) {
      return res
        .status(400)
        .json({ success: false, message: "addresses must be an array" });
    }

    const expectedAddressCount = jobCategory === "normal" ? 1 : 2;
    if (addresses.length !== expectedAddressCount) {
      return res.status(400).json({
        success: false,
        message:
          jobCategory === "normal"
            ? "Normal job requires exactly 1 address"
            : `${jobCategory} job requires exactly 2 addresses (from and to)`,
      });
    }

    for (let i = 0; i < addresses.length; i++) {
      const label =
        jobCategory === "normal"
          ? "Address"
          : i === 0
            ? "From address"
            : "To address";
      const error = validateAddress(addresses[i], label);
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }
    }

    // ── 6. Validate & Build serviceAddressMap
    let serviceAddressMap: ServiceAddressMap;
    try {
      serviceAddressMap =
        typeof serviceAddressMapRaw === "string"
          ? JSON.parse(serviceAddressMapRaw)
          : serviceAddressMapRaw;
    } catch {
      return res
        .status(400)
        .json({ success: false, message: "Invalid serviceAddressMap format" });
    }

    if (!serviceAddressMap || typeof serviceAddressMap !== "object") {
      return res
        .status(400)
        .json({ success: false, message: "serviceAddressMap is required" });
    }

    // Validate that every service in cart has an address mapping
    for (const cartItem of cart.serviceItems) {
      const id = cartItem.serviceId.toString();
      const mapping = serviceAddressMap[id];
      const svc = serviceMap.get(id)!;

      if (!mapping) {
        return res.status(400).json({
          success: false,
          message: `Address mapping missing for service: ${svc.name}`,
        });
      }

      if (svc.type === "relocation") {
        // Relocation must have both from and to
        if (
          mapping.fromAddressIndex == null ||
          mapping.toAddressIndex == null
        ) {
          return res.status(400).json({
            success: false,
            message: `Relocation service "${svc.name}" needs fromAddressIndex and toAddressIndex`,
          });
        }
        if (
          mapping.fromAddressIndex < 0 ||
          mapping.fromAddressIndex >= addresses.length ||
          mapping.toAddressIndex < 0 ||
          mapping.toAddressIndex >= addresses.length
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid address index for relocation service "${svc.name}"`,
          });
        }
        if (mapping.fromAddressIndex === mapping.toAddressIndex) {
          return res.status(400).json({
            success: false,
            message: `Relocation service "${svc.name}": from and to address cannot be the same`,
          });
        }
      } else {
        // Normal service must have addressIndex
        if (mapping.addressIndex == null) {
          return res.status(400).json({
            success: false,
            message: `Service "${svc.name}" needs an addressIndex`,
          });
        }
        if (
          mapping.addressIndex < 0 ||
          mapping.addressIndex >= addresses.length
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid addressIndex for service "${svc.name}"`,
          });
        }
      }
    }

    // ── 7. Handle Image Uploads
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required to book a job",
      });
    }

    const uploadResults = await Promise.all(
      files.map((file) => uploadToCloudinary(file, "image")),
    );

    // Filter out errors and ensure type safety for uploadedImages
    uploadedImages = uploadResults
      .filter((img): img is any => !("message" in img))
      .map((img) => ({
        url: img.url,
        public_id: img.public_id,
      }));

    const serviceItems = cart.serviceItems.map((cartItem) => {
      const id = cartItem.serviceId.toString();
      const svc = serviceMap.get(id)!;
      const mapping = serviceAddressMap[id];
      const durationMinutes =
        getDurationInMinutes(svc.duration) * cartItem.quantity;

      if (svc.type === "relocation") {
        return {
          serviceId: svc._id,
          serviceType: "relocation" as const,
          serviceName: svc.name,
          price: svc.price * cartItem.quantity,
          duration: durationMinutes,
          fromAddressIndex: mapping.fromAddressIndex,
          toAddressIndex: mapping.toAddressIndex,
          addressIndex: null,
          status: "pending" as const,
        };
      } else {
        return {
          serviceId: svc._id,
          serviceType: svc.type as "installation" | "uninstallation" | "repair",
          serviceName: svc.name,
          price: svc.price * cartItem.quantity,
          duration: durationMinutes,
          addressIndex: mapping.addressIndex,
          fromAddressIndex: null,
          toAddressIndex: null,
          status: "pending" as const,
        };
      }
    });

    // ── 9. Calculate Totals
    // Re-calculate from live service data — never trust cart summary
    const totalPrice = cart.serviceItems.reduce((acc, cartItem) => {
      const svc = serviceMap.get(cartItem.serviceId.toString())!;
      return acc + svc.price * cartItem.quantity;
    }, 0);

    const totalDuration = cart.serviceItems.reduce((acc, cartItem) => {
      const svc = serviceMap.get(cartItem.serviceId.toString())!;
      return acc + getDurationInMinutes(svc.duration) * cartItem.quantity;
    }, 0);

    const jobId = `JOB-${Date.now()}`;

    const job = new Job({
      jobId,
      userId,
      services: serviceItems,
      jobCategory,
      addresses,
      preferredSlot: {
        date: parsedDate,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        duration: slotDurationMinutes,
      },

      // Device info
      jobName: servicesData[0].name, // primary service name
      brandName: brandName.trim(),
      modelType: modelType.trim(),
      problems: Array.isArray(problems) ? problems : [],
      remarkByUser: remarkByUser?.trim() ?? "",

      // Images
      imageByUser: uploadedImages.map((img) => ({
        url: img.url,
        public_id: img.public_id,
      })),

      // Pricing
      totalPrice,
      totalDuration,

      // Payment
      paymentMode,
      paymentStatus: paymentMode === "prepaid" ? "prepaid" : "unpaid",
      paidAt: paymentMode === "prepaid" ? new Date() : null,

      // Status
      status: "pending",

      technicianType: null,
      technicianId: null,
    });

    await job.save();

    cart.status = "checked_out";
    await cart.save();

    return res.status(201).json({
      success: true,
      message: "Job booked successfully",
      data: job,
    });
  } catch (error) {
    // ── Rollback: Delete Cloudinary images if job save failed ──
    if (uploadedImages.length > 0) {
      await Promise.allSettled(
        uploadedImages.map(
          (img) =>
            // deleteFromCloudinary(img.public_id) — add your util here
            deleteFromCloudinary(img.public_id),
          Promise.resolve(),
        ),
      );
    }
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

// export async function acceptRescheduleController(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) {
//   try {
//     const { jobId } = req.params;
//     const userId = req.userId;
//     // get user preference for reschedule - new date and time
//     const { preferredDate, preferredStartTime } = req.body;

//     const job = await Job.findById(jobId);

//     if (!job) {
//       return res.status(404).json({ message: "Job not found" });
//     }

//     if (job.userId.toString() !== userId.toString()) {
//       return res.status(403).json({
//         message: "You are not authorized to accept this reschedule request",
//       });
//     }

//     if (!job.rescheduleRequest || job.rescheduleRequest.status !== "pending") {
//       return res.status(400).json({
//         message: "No pending reschedule request for this job",
//       });
//     }

//     // User accepts the reschedule - update job with new date
//     job.rescheduleRequest.status = "accepted";
//     job.rescheduleRequest.approvedBy = "user";
//     job.rescheduleRequest.approvedAt = new Date();

//     // Update job preferredDate if newDate was provided in original request
//     if (job.rescheduleRequest.requestedDate) {
//       job.preferredDate = {
//         date: preferredDate,
//         startTime: preferredStartTime,
//         endTime: new Date(preferredStartTime.getTime() + 2 * 60 * 60 * 1000), // 2 hour default
//       };
//     }

//     job.steps.push({
//       stepId: "STEP-" + job.steps.length + 1,
//       stepName: "Reschedule Accepted",
//       stepDescription: "User accepted the technician's reschedule request",
//       userId: userId,
//       createdAt: new Date(),
//     });

//     await job.save();

//     // TODO.SendNotification: Notify technician that reschedule was accepted

//     return res.status(200).json({
//       success: true,
//       message: "Reschedule request accepted successfully",
//       job,
//     });
//   } catch (error) {
//     return next(error);
//   }
// }

// export async function rejectRescheduleController(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) {
//   try {
//     const { jobId } = req.params;
//     const { reason } = req.body;
//     const userId = req.userId;

//     if (!reason) {
//       return res.status(400).json({
//         message: "Reason for rejection is required",
//       });
//     }

//     const job = await Job.findById(jobId);

//     if (!job) {
//       return res.status(404).json({ message: "Job not found" });
//     }

//     if (job.userId.toString() !== userId.toString()) {
//       return res.status(403).json({
//         message: "You are not authorized to reject this reschedule request",
//       });
//     }

//     if (!job.rescheduleRequest || job.rescheduleRequest.status !== "pending") {
//       return res.status(400).json({
//         message: "No pending reschedule request for this job",
//       });
//     }

//     // User rejects the reschedule
//     job.rescheduleRequest.status = "rejected";
//     job.rescheduleRequest.approvedBy = "user";
//     job.rescheduleRequest.approvedAt = new Date();

//     job.steps.push({
//       stepId: "STEP-" + job.steps.length + 1,
//       stepName: "Reschedule Rejected",
//       stepDescription: `User rejected reschedule request - Reason: ${reason}`,
//       userId: userId,
//       createdAt: new Date(),
//     });

//     await job.save();

//     // TODO.SendNotification: Notify technician and admin about rejection

//     return res.status(200).json({
//       success: true,
//       message: "Reschedule request rejected successfully",
//     });
//   } catch (error) {
//     return next(error);
//   }
// }
