import { Request, Response, NextFunction } from "express";
import Service from "../../models/Services/service.js";
import uploadToCloudinary, {
  deleteFromCloudinary,
} from "../../utils/uploadToCloudinary.js";

interface ServiceFilter {
  category?: string;
  status?: string;
  markAsPopular?: boolean;
}

export async function createServiceController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let uploadedImages: string[] = [];

  try {
    const adminId = req.adminId;

    // Parse JSON fields from form-data
    const parseJSONField = (field: any) => {
      if (field && typeof field === "string") {
        try {
          return JSON.parse(field);
        } catch {
          return field;
        }
      }
      return field;
    };

    // Get data from request body
    const serviceData = {
      serviceId: `SERV-${Date.now()}`,
      type: req.body.type,
      category: req.body.category,
      name: req.body.name,
      description: req.body.description || "",
      price: req.body.price ? parseFloat(req.body.price) : undefined,
      gstRate: req.body.gstRate ? parseFloat(req.body.gstRate) : 0,
      duration: parseJSONField(req.body.duration),
      process: parseJSONField(req.body.process),
      includes: parseJSONField(req.body.includes),
      prerequisites: parseJSONField(req.body.prerequisites),
      frequentlyAskedQuestions: parseJSONField(
        req.body.frequentlyAskedQuestions,
      ),
      status: req.body.status || "active",
      markAsPopular: req.body.markAsPopular === "true",
      meta: parseJSONField(req.body.meta),
      warranty: parseJSONField(req.body.warranty),
    };

    // Validate required fields
    if (
      !serviceData.type ||
      !serviceData.category ||
      !serviceData.name ||
      !serviceData.price ||
      !serviceData.duration
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Handle multiple image uploads
    const files = req.files as Express.Multer.File[] | undefined;
    const images = [];

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const fileType = file.mimetype.includes("image") ? "image" : "raw";
          const result = await uploadToCloudinary(file, fileType);

          if (result?.public_id) {
            uploadedImages.push(result.public_id);
            images.push({
              url: result.secure_url,
              public_id: result.public_id,
              isPrimary: i === 0, // First image as primary
            });
          }
        } catch (uploadError: any) {
          console.error(
            `Error uploading file: ${file.originalname}`,
            uploadError,
          );
        }
      }
    }

    // Create new service
    const service = new Service({
      ...serviceData,
      images: images,
      createdBy: adminId,
      rating: {
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
      totalBookings: 0,
      completionRate: 0,
    });

    await service.save();

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      service: service,
    });
  } catch (error: any) {
    // Cleanup uploaded images if there was an error
    if (uploadedImages.length > 0) {
      for (const publicId of uploadedImages) {
        try {
          await deleteFromCloudinary(publicId);
        } catch (deleteError) {
          console.error(`Failed to delete image ${publicId}:`, deleteError);
        }
      }
    }
    return next(error);
  }
}

export async function updateServiceController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { serviceId } = req.params;

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: "Service ID is required",
      });
    }

    // Find existing service
    const service = await Service.findOne({ _id: serviceId });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Parse JSON fields helper
    const parseJSONField = (field: any) => {
      if (field && typeof field === "string") {
        try {
          return JSON.parse(field);
        } catch {
          return field;
        }
      }
      return field;
    };

    // UPDATE ONLY TEXT FIELDS - NO IMAGES
    // Type update
    if (req.body.type) {
      const validTypes = [
        "repair",
        "installation",
        "uninstallation",
        "relocation",
      ];
      if (!validTypes.includes(req.body.type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        });
      }
      service.type = req.body.type;
    }

    // Category update
    if (req.body.category) {
      const validCategories = ["home", "industry"];
      if (!validCategories.includes(req.body.category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        });
      }
      service.category = req.body.category;
    }

    // Name update (with uniqueness check)
    if (req.body.name && req.body.name !== service.name) {
      const existingService = await Service.findOne({
        name: req.body.name,
        serviceId: { $ne: serviceId },
      });
      if (existingService) {
        return res.status(409).json({
          success: false,
          message: "Another service with this name already exists",
        });
      }
      service.name = req.body.name;
    }

    // Description update
    if (req.body.description !== undefined) {
      service.description = req.body.description;
    }

    // Price update
    if (req.body.price !== undefined) {
      const price = parseFloat(req.body.price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a positive number",
        });
      }
      service.price = price;
    }

    // GST rate update
    if (req.body.gstRate !== undefined) {
      const gstRate = parseFloat(req.body.gstRate);
      if (isNaN(gstRate) || gstRate < 0 || gstRate > 100) {
        return res.status(400).json({
          success: false,
          message: "GST rate must be between 0 and 100",
        });
      }
      service.gstRate = gstRate;
    }

    // Duration update
    if (req.body.duration) {
      const duration = parseJSONField(req.body.duration);
      if (duration && duration.count && duration.unit) {
        if (duration.count < 15) {
          return res.status(400).json({
            success: false,
            message: "Duration count must be at least 15 minutes",
          });
        }
        if (!["minutes", "hours"].includes(duration.unit)) {
          return res.status(400).json({
            success: false,
            message: "Duration unit must be 'minutes' or 'hours'",
          });
        }
        service.duration = duration;
      }
    }

    // Process update
    if (req.body.process) {
      service.process = parseJSONField(req.body.process);
    }

    // Includes update
    if (req.body.includes) {
      service.includes = parseJSONField(req.body.includes);
    }

    // Prerequisites update
    if (req.body.prerequisites) {
      service.prerequisites = parseJSONField(req.body.prerequisites);
    }

    // FAQs update
    if (req.body.frequentlyAskedQuestions) {
      service.frequentlyAskedQuestions = parseJSONField(
        req.body.frequentlyAskedQuestions,
      );
    }

    // Status update
    if (req.body.status) {
      const validStatuses = ["active", "inactive", "coming_soon"];
      if (!validStatuses.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }
      service.status = req.body.status;
    }

    // Popular flag update
    if (req.body.markAsPopular !== undefined) {
      service.markAsPopular = req.body.markAsPopular === "true";
    }

    // Meta update
    if (req.body.meta) {
      service.meta = parseJSONField(req.body.meta);
    }

    // Warranty update
    if (req.body.warranty) {
      service.warranty = parseJSONField(req.body.warranty);
    }

    await service.save();

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service,
    });
  } catch (error: any) {
    return next(error);
  }
}

export async function getServiceByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { serviceId } = req.params;

    const service = await Service.findOne({ _id: serviceId });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service fetched successfully",
      service,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAllServicesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Get filters from query params (not body)
    const { category, status, popular } = req.query;

    const filter: ServiceFilter = {};

    // Apply category filter if provided
    if (category && typeof category === "string") {
      const validCategories = ["home", "industry"];
      if (validCategories.includes(category)) {
        filter.category = category;
      }
    }

    // Apply status filter if provided
    if (status && typeof status === "string") {
      const validStatuses = ["active", "inactive", "coming_soon"];
      if (validStatuses.includes(status)) {
        filter.status = status;
      }
    }

    // Apply popular filter if provided
    if (popular !== undefined) {
      filter.markAsPopular = popular === "true";
    }

    // Fetch services with filters
    const services = await Service.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Services fetched successfully",
      data: {
        services,
        total: services.length,
        filters: {
          category: category || null,
          status: status || null,
          popular: popular || null,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getServiceCountController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const [result] = await Service.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          inactive: {
            $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] },
          },
          comingSoon: {
            $sum: { $cond: [{ $eq: ["$status", "coming_soon"] }, 1, 0] },
          },
          popular: {
            $sum: { $cond: [{ $eq: ["$markAsPopular", true] }, 1, 0] },
          },
          home: {
            $sum: { $cond: [{ $eq: ["$category", "home"] }, 1, 0] },
          },
          industry: {
            $sum: { $cond: [{ $eq: ["$category", "industry"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          active: 1,
          inactive: 1,
          comingSoon: 1,
          popular: 1,
          home: 1,
          industry: 1,
        },
      },
    ]);

    // Default values if no result
    const counts = result || {
      total: 0,
      active: 0,
      inactive: 0,
      comingSoon: 0,
      popular: 0,
      home: 0,
      industry: 0,
    };

    return res.status(200).json({
      success: true,
      message: "Service count fetched successfully",
      data: counts, // Wrap in data object to avoid _id confusion
    });
  } catch (error) {
    console.error("Get service count error:", error);
    return next(error);
  }
}

export async function deleteServiceByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // DELETE IMAGES FROM CLOUDINARY
    const images = service.images || [];
    const deletionErrors: string[] = [];

    if (images.length > 0) {
      // Delete all images from Cloudinary
      for (const image of images) {
        if (image.public_id) {
          try {
            await deleteFromCloudinary(image.public_id);
            console.log(`Deleted image: ${image.public_id}`);
          } catch (error) {
            console.error(`Failed to delete image ${image.public_id}:`, error);
            deletionErrors.push(image.public_id);
          }
        }
      }
    }

    // DELETE SERVICE FROM DATABASE
    await Service.findByIdAndDelete(serviceId);

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error: any) {
    return next(error);
  }
}

export const softDeleteServiceByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    service.status = "inactive";
    await service.save();
    return res.status(200).json({
      success: true,
      message: "Service soft deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};
// export async function servicePostController(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) {
//   let uploadedImages: string[] = [];
//   let service: any = null;
//   try {
//     let { serviceId } = req.params;
//     const adminId = req.adminId;

//     // Parse JSON fields from form-data
//     const parseJSONField = (field: any) => {
//       if (field && typeof field === "string") {
//         try {
//           return JSON.parse(field);
//         } catch {
//           return field;
//         }
//       }
//       return field;
//     };

//     // Get data from request body
//     const serviceData = {
//       type: req.body.type,
//       category: req.body.category,
//       name: req.body.name,
//       description: req.body.description || "",
//       price: req.body.price ? parseFloat(req.body.price) : undefined,
//       gstRate: req.body.gstRate ? parseFloat(req.body.gstRate) : 0,
//       duration: parseJSONField(req.body.duration),
//       process: parseJSONField(req.body.process),
//       includes: parseJSONField(req.body.includes),
//       prerequisites: parseJSONField(req.body.prerequisites),
//       frequentlyAskedQuestions: parseJSONField(
//         req.body.frequentlyAskedQuestions,
//       ),
//       status: req.body.status || "active",
//       markAsPopular: req.body.markAsPopular === "true",
//       meta: parseJSONField(req.body.meta),
//       warranty: parseJSONField(req.body.warranty),
//     };

//     // Validate required fields
//     const requiredFields = ["type", "category", "name", "price", "duration"];
//     for (const field of requiredFields) {
//       if (!serviceData[field as keyof typeof serviceData]) {
//         return res.status(400).json({
//           message: `${field} is required`,
//         });
//       }
//     }

//     // Validate enum values
//     const validTypes = [
//       "repair",
//       "installation",
//       "uninstallation",
//       "relocation",
//     ];
//     if (!validTypes.includes(serviceData.type)) {
//       return res.status(400).json({
//         message: "Invalid service type",
//       });
//     }

//     const validCategories = ["home", "industry"];
//     if (!validCategories.includes(serviceData.category)) {
//       return res.status(400).json({
//         message: "Invalid category",
//       });
//     }

//     // Handle file uploads
//     const files = req.files as Express.Multer.File[] | undefined;
//     const uploadedImagesData = [];

//     if (files && files.length > 0) {
//       for (let i = 0; i < files.length; i++) {
//         const file = files[i];
//         try {
//           const fileType = file.mimetype.includes("image") ? "image" : "raw";
//           const result = await uploadToCloudinary(file, fileType);

//           if (result?.public_id) {
//             uploadedImages.push(result.public_id);
//             uploadedImagesData.push({
//               url: result.secure_url,
//               public_id: result.public_id,
//               isPrimary: i === 0, // First image as primary
//             });
//           }
//         } catch (uploadError: any) {
//           console.error(
//             `Error uploading file: ${file.originalname}`,
//             uploadError,
//           );
//         }
//       }
//     }

//     // Create or update service
//     if (!serviceId) {
//       // Create new service
//       const newServiceId = `SERV-${Date.now()}`;

//       service = new Service({
//         serviceId: newServiceId,
//         ...serviceData,
//         images: uploadedImagesData,
//         createdBy: adminId,
//         rating: {
//           average: 0,
//           count: 0,
//           distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
//         },
//         totalBookings: 0,
//         completionRate: 0,
//       });

//       await service.save();

//       return res.status(201).json({
//         message: "Service created successfully",
//         service: service,
//       });
//     } else {
//       // Update existing service
//       service = await Service.findOne({ serviceId });

//       if (!service) {
//         // Cleanup uploaded images if service not found
//         if (uploadedImages.length > 0) {
//           await Promise.all(
//             uploadedImages.map((publicId) =>
//               deleteFromCloudinary(publicId).catch((err) =>
//                 console.error(`Failed to delete image ${publicId}:`, err),
//               ),
//             ),
//           );
//         }

//         return res.status(404).json({
//           message: "Service not found",
//         });
//       }

//       // Update fields
//       if (serviceData.type) service.type = serviceData.type;
//       if (serviceData.category) service.category = serviceData.category;
//       if (serviceData.name) service.name = serviceData.name;
//       if (serviceData.description !== undefined)
//         service.description = serviceData.description;
//       if (serviceData.price) service.price = serviceData.price;
//       if (serviceData.gstRate !== undefined)
//         service.gstRate = serviceData.gstRate;
//       if (serviceData.duration) service.duration = serviceData.duration;
//       if (serviceData.process) service.process = serviceData.process;
//       if (serviceData.includes) service.includes = serviceData.includes;
//       if (serviceData.prerequisites)
//         service.prerequisites = serviceData.prerequisites;
//       if (serviceData.frequentlyAskedQuestions) {
//         service.frequentlyAskedQuestions = serviceData.frequentlyAskedQuestions;
//       }
//       if (serviceData.status) service.status = serviceData.status;
//       if (serviceData.markAsPopular !== undefined) {
//         service.markAsPopular = serviceData.markAsPopular;
//       }
//       if (serviceData.meta) service.meta = serviceData.meta;
//       if (serviceData.warranty) service.warranty = serviceData.warranty;

//       // Add new images to existing ones
//       if (uploadedImagesData.length > 0) {
//         service.images = [...(service.images || []), ...uploadedImagesData];
//       }

//       await service.save();

//       return res.status(200).json({
//         message: "Service updated successfully",
//         service: service,
//       });
//     }
//   } catch (error: any) {
//     // Cleanup uploaded images if there was an error
//     if (uploadedImages.length > 0) {
//       // Don't await, just trigger cleanup
//       Promise.all(
//         uploadedImages.map((publicId) =>
//           deleteFromCloudinary(publicId).catch((err) =>
//             console.error(`Failed to delete image ${publicId}:`, err),
//           ),
//         ),
//       );
//     }

//     // Handle duplicate key error
//     if (error.code === 11000) {
//       return res.status(409).json({
//         message: "Service with this ID already exists",
//       });
//     }

//     // Handle validation error
//     if (error.name === "ValidationError") {
//       return res.status(400).json({
//         message: "Validation error",
//         errors: Object.values(error.errors).map((e: any) => e.message),
//       });
//     }

//     console.error("Service creation error:", error);
//     return next(error);
//   }
// }
