import { Request, Response, NextFunction } from "express";
import User from "../../models/Users/User.js";
import Service from "../../models/Services/service.js";
import Review from "../../models/Services/review.js";
import Order from "../../models/inventory/order.js";
import Job from "../../models/Services/jobs.js";
import Quotation from "../../models/Services/quotation.js";
import mongoose from "mongoose";

export const getCustomerStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          inactiveCustomers: {
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalCustomers: 0,
      activeCustomers: 0,
      inactiveCustomers: 0,
    };

    return res.status(200).json({
      success: true,
      message: "Customer stats fetched successfully",
      ...result,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page = 1, limit = 20, search, date, status } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    // search filter (name, email, mobile)
    if (search) {
      filter.$or = [
        // { name: { $regex: search as string, $options: "i" } },
        // { email: { $regex: search as string, $options: "i" } },
        { mobileNumber: { $regex: search as string, $options: "i" } },
      ];
    }

    // status filter
    if (status !== undefined) {
      filter.isActive = status === "active";
    }

    // date filter (same day)
    if (date) {
      const start = new Date(date as string);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date as string);
      end.setHours(23, 59, 59, 999);

      filter.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    const customers = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await User.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      customers,
      pagination: {
        currentPage: pageNum,
        totalRecords: total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getCustomerDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;

    const customer = await User.findById(userId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // 1. total services
    const totalServices = await Service.countDocuments({ userId });

    // 2. active warranties
    const warranties = await Order.aggregate([
      {
        $match: {
          customerId: new mongoose.Types.ObjectId(userId),
          status: "delivered",
        },
      },
      { $unwind: "$orderItems" },
      {
        $match: {
          "orderItems.warrantyExpiryDate": { $gte: new Date() },
        },
      },
      {
        $project: {
          _id: 0,
          productId: "$orderItems.productId",
          name: "$orderItems.name",
          image: "$orderItems.image",
          sellingPrice: "$orderItems.price.sellingPrice",
          costPrice: "$orderItems.price.costPrice",
          quantity: "$orderItems.quantity",
          startDate: "$deliveredAt",
          expiryDate: "$orderItems.warrantyExpiryDate",
        },
      },
    ]);

    const warrantyCount = warranties.length;

    // 3. avg rating (customer specific)
    const avgRating = await Review.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    // 4. total spent
    const totalSpent = await Order.aggregate([
      {
        $match: {
          customerId: new mongoose.Types.ObjectId(userId),
          status: "delivered",
        },
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$pricing.finalPrice" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Customer details fetched successfully",
      customer,
      stats: {
        totalServices,
        productWarranties: warrantyCount,
        avgRating: avgRating[0]?.averageRating || 0,
        totalReviews: avgRating[0]?.totalReviews || 0,
        totalSpent: totalSpent[0]?.totalSpent || 0,
      },
      activeWarranties: warranties,
    });
  } catch (error) {
    return next(error);
  }
};

export const getCustomerJobHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // check customer
    const customer = await User.findById(userId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // total jobs count
    const totalJobs = await Job.countDocuments({ userId });

    // job history
    const jobs = await Job.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Customer job history fetched successfully",
      pagination: {
        totalJobs,
        currentPage: pageNum,
        totalPages: Math.ceil(totalJobs / limitNum),
        limit: limitNum,
      },
      jobs,
    });
  } catch (error) {
    return next(error);
  }
};

export const jobDetailsAttchedToCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findOne({ _id: jobId })
      .populate("userId", "mobileNumber")
      .populate("technicianId", "fullName mobileNumber")
      .populate("services", "name price duration")
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const response = {
      jobId: job.jobId,
      status: job.status,

      customer: {
        name: job.address?.fullName,
        phone: (job.userId as any)?.mobileNumber,
        address: `${job.address?.house_apartment}, ${job.address?.street_sector}, ${job.address?.landmark}`,
      },

      jobDetails: {
        serviceName: job.jobName,
        price: job.totalPrice,
        slot: job.preferredDate?.startTime,
      },

      productDetails: {
        brandName: job.brandName,
        modelType: job.modelType,
        description: job.remarkByUser,
      },

      productPhoto: job.imageByUser?.url,

      technician: job.technicianId
        ? {
            name: (job.technicianId as any).fullName,
            phone: (job.technicianId as any).mobileNumber,
          }
        : null,

      timeline: job.steps || [],

      payment: {
        status: job.payment,
        amount: job.totalPrice,
      },

      review: job.ratingByTechnician || null,

      createdAt: job.createdAt,
    };

    return res.status(200).json({
      success: true,
      message: "Job details fetched successfully",
      data: response,
    });
  } catch (error) {
    return next(error);
  }
};

export const getQuotationDetailsAttchedToJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { quotationId } = req.params;

    const quotation = await Quotation.findOne({ _id: quotationId })
      .populate("jobId", "jobId status serviceType")
      .populate("technicianId", "fullName phoneNumber")
      .lean();

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Quotation details fetched successfully",
      data: quotation,
    });
  } catch (error) {
    return next(error);
  }
};
