import { Request, Response, NextFunction } from "express";
import Service from "../../models/Services/service.js";
import Review from "../../models/Services/review.js";

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

export async function getReviewsByServiceIdUserController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { serviceId, reviewPage = 1, reviewLimit = 10 } = req.query;

    // defaults + safety
    const pageNum = parseInt(reviewPage as string, 10);
    const limitNum = parseInt(reviewLimit as string, 10);

    const skip = (pageNum - 1) * limitNum;

    const reviews = await Review.find({ serviceId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      message: "Service fetched successfully",
      data: {
        reviews: reviews,
      },
    });
  } catch (error) {
    return next(error);
  }
}
