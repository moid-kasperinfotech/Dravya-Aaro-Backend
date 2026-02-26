import { Request, Response, NextFunction } from "express";
import Job from "../../models/Services/jobs.js";
import mongoose from "mongoose";
import Service from "../../models/Services/service.js";

export async function bookServiceController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
      return acc + service.price;
    }, 0);

    const totalDuration = servicesData.reduce((acc: number, service: any) => {
      return acc + service.duration.count;
    }, 0);

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

    return res.status(201).json({ message: "Job created successfully" });
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
    const { userId } = req.user;

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
    const { userId } = req.user;

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
