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

    return res.status(201).json({ message: "Job created successfully", data: job });
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
      return res.status(403).json({ message: "You are not authorized to accept this reschedule request" });
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
      return res.status(403).json({ message: "You are not authorized to reject this reschedule request" });
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
