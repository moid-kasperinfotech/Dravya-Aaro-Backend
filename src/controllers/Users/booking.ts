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

    if (services.some((service: string) => !mongoose.Types.ObjectId.isValid(service))) {
      return res.status(400).json({ message: "Invalid service id" });
    }

    const servicesData = await Service.find({ _id: { $in: services } });

    if (servicesData.length !== services.length) {
      return res.status(400).json({ message: "Invalid service id" });
    }

    const totalPrice = servicesData.reduce((acc: number, service: any) => {
      return acc + service.price;
    }, 0);

    const job = new Job({
      jobId,
      services,
      userId,
      brandName,
      problems,
      remarkByUser,
      preferredDate: {
        startTime: preferredStartTime,
        duration: preferredDuration,
      },
      totalPrice,
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
