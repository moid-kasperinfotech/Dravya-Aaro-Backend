import { Request, Response, NextFunction } from "express";
import Service from "../../models/Services/service.js";
import ServiceReview from "../../models/Services/review.js";
import Job from "../../models/Services/jobs.js";

interface FilterType {
  status: string;
  category?: string;
  type?: string;
  name?: object;
}

export async function getAllServicesUserController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { category, type, search, page = 1, limit = 20 } = req.query;

    const filter: FilterType = { status: "active" };
    if (category) filter.category = category as string;
    if (type) filter.type = type as string;
    if (search) filter.name = { $regex: search, $options: "i" };

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [services, total] = await Promise.all([
      Service.find(filter).sort({ name: 1 }).skip(skip).limit(limitNum),
      Service.countDocuments(filter),
    ]);

    return res.status(200).json({
      message: "All services fetched successfully",
      data: {
        services,
        pagination: {
          current: page,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getServiceByIdUserController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { serviceId } = req.params;

    const filter = {
      serviceId,
      status: "active",
    };

    const service = await Service.findOne(filter);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    return res
      .status(200)
      .json({ message: "Service fetched successfully", service });
  } catch (error) {
    return next(error);
  }
}

export async function rateServiceByUserController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { jobId, serviceId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.userId;

    // ===== VALIDATION =====
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Rating and comment are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // ===== JOB FETCH =====
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // ===== VERIFY USER =====
    if (job.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ===== FIND SERVICE INSIDE JOB =====
    const service = job.bookedServices.find(
      (s: any) => s.serviceId.toString() === serviceId,
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found in this job",
      });
    }

    // ===== SERVICE COMPLETION CHECK =====
    if (service.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Service is not completed yet",
      });
    }

    // ===== DUPLICATE CHECK =====
    const existingReview = await ServiceReview.findOne({
      serviceId,
      jobId,
      userId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Service already rated",
      });
    }

    // ===== CREATE REVIEW =====
    const newReview = await ServiceReview.create({
      serviceId,
      userId,
      jobId,
      technicianId: job.technicianId,
      rating,
      comment,
    });

    // ===== UPDATE SERVICE STATS =====
    const serviceDoc = await Service.findById(serviceId);

    if (serviceDoc) {
      serviceDoc.reviewCount += 1;
      serviceDoc.avgRating =
        (serviceDoc.avgRating * (serviceDoc.reviewCount - 1) + rating) /
        serviceDoc.reviewCount;

      await serviceDoc.save();
    }

    return res.status(201).json({
      success: true,
      message: "Service rated successfully",
      review: newReview,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getReviewsByServiceIdUserController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { reviewPage = 1, reviewLimit = 10 } = req.query;
    const { serviceId } = req.params;

    if (!serviceId) {
      return res.status(400).json({ message: "serviceId is required" });
    }

    // defaults + safety
    const pageNum = parseInt(reviewPage as string, 10);
    const limitNum = parseInt(reviewLimit as string, 10);

    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      ServiceReview.find({ serviceId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ServiceReview.countDocuments({ serviceId }),
    ]);

    return res.status(200).json({
      message: "Reviews fetched successfully",
      data: {
        reviews: reviews,
        pagination: {
          current: reviewPage,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}
