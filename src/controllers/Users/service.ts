import { Request, Response, NextFunction } from "express";
import Service from "../../models/Services/service.js";
import Review from "../../models/Services/review.js";

export async function getAllServicesUserController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { category } = req.body;

    if (!category || !["home", "industry"].includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const filter = {
      category,
      status: "active",
    };

    const services = await Service.find(filter);

    return res
      .status(200)
      .json({ message: "All services fetched successfully", services });
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
