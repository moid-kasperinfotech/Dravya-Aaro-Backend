import Job from "../../models/Services/jobs.js";
import Order from "../../models/inventory/order.js";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

/**
 * GET /admin/payment-billings/stats
 * Get payment & billing statistics dashboard
 */
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) {
        const ed = new Date(endDate as string);
        ed.setHours(23, 59, 59, 999);
        dateFilter.$lte = ed;
      }
    }

    const matchStage = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [jobStats, orderStats] = await Promise.all([
      Job.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            totalRevenue: { $sum: "$totalPrice" },
            paidJobs: { $sum: { $cond: [{ $eq: ["$payment", "paid"] }, 1, 0] } },
            pendingJobs: { $sum: { $cond: [{ $ne: ["$payment", "paid"] }, 1, 0] } },
          },
        },
      ]) as any,
      Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$pricing.finalPrice" },
            paidOrders: { $sum: { $cond: [{ $eq: ["$payment.paymentStatus", "paid"] }, 1, 0] } },
            refundedAmount: { $sum: { $cond: ["$payment.refundedAmount", "$payment.refundedAmount", 0] } },
            totalGST: { $sum: "$pricing.gst" },
          },
        },
      ]) as any,
    ]);

    const jobData = jobStats.length > 0 ? jobStats[0] : { totalRevenue: 0, refundedAmount: 0, totalGST: 0 };
    const orderData = orderStats.length > 0 ? orderStats[0] : { totalRevenue: 0, refundedAmount: 0, totalGST: 0 };

    const totalRevenue = (jobData.totalRevenue || 0) + (orderData.totalRevenue || 0);
    const totalRefunds = (jobData.refundedAmount || 0) + (orderData.refundedAmount || 0);
    const totalGST = (orderData.totalGST || 0);

    return res.json({
      success: true,
      data: {
        totalRevenue,
        totalRefunds,
        taxCollected: totalGST,
        transactionCount: (jobData.totalJobs || 0) + (orderData.totalOrders || 0),
        jobs: {
          total: jobData.totalJobs || 0,
          paid: jobData.paidJobs || 0,
          pending: jobData.pendingJobs || 0,
          revenue: jobData.totalRevenue || 0,
        },
        orders: {
          total: orderData.totalOrders || 0,
          paid: orderData.paidOrders || 0,
          revenue: orderData.totalRevenue || 0,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/payment-billings/transactions
 * Get all transactions (jobs + orders) with filters
 */
export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type = "all", paymentStatus = "all", startDate, endDate, page = "1", limit = "10" } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    let jobMatches: any[] = [];
    let orderMatches: any[] = [];
    let jobCount = 0;
    let orderCount = 0;

    if (type === "job" || type === "all") {
      let jobFilter: any = {};
      if (paymentStatus !== "all") jobFilter.payment = paymentStatus;
      if (startDate || endDate) {
        const df: any = {};
        if (startDate) df.$gte = new Date(startDate as string);
        if (endDate) {
          const ed = new Date(endDate as string);
          ed.setHours(23, 59, 59, 999);
          df.$lte = ed;
        }
        jobFilter.createdAt = df;
      }

      [jobMatches, jobCount] = await Promise.all([
        Job.find(jobFilter)
          .select("jobId jobName totalPrice payment userId technicianId createdAt status")
          .populate("userId", "fullName mobileNumber")
          .sort({ createdAt: -1 })
          .skip(type === "job" ? skip : 0)
          .limit(type === "job" ? limitNum : 1000),
        Job.countDocuments(jobFilter),
      ]);
    }

    if (type === "order" || type === "all") {
      let orderFilter: any = {};
      if (paymentStatus !== "all") orderFilter["payment.paymentStatus"] = paymentStatus;
      if (startDate || endDate) {
        const df: any = {};
        if (startDate) df.$gte = new Date(startDate as string);
        if (endDate) {
          const ed = new Date(endDate as string);
          ed.setHours(23, 59, 59, 999);
          df.$lte = ed;
        }
        orderFilter.createdAt = df;
      }

      [orderMatches, orderCount] = await Promise.all([
        Order.find(orderFilter)
          .select("orderId customerId pricing payment status createdAt")
          .populate("customerId", "fullName mobileNumber email")
          .sort({ createdAt: -1 })
          .skip(type === "order" ? skip : 0)
          .limit(type === "order" ? limitNum : 1000),
        Order.countDocuments(orderFilter),
      ]);
    }

    const transactions = [
      ...jobMatches.map((j: any) => ({
        id: j._id,
        transactionId: j.jobId,
        type: "job",
        amount: j.totalPrice,
        status: j.payment,
        customer: j.userId,
        createdAt: j.createdAt,
      })),
      ...orderMatches.map((o: any) => ({
        id: o._id,
        transactionId: o.orderId,
        type: "order",
        amount: o.pricing.finalPrice,
        status: o.payment.paymentStatus,
        customer: o.customerId,
        createdAt: o.createdAt,
      })),
    ]
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(skip, skip + limitNum);

    const total = type === "job" ? jobCount : type === "order" ? orderCount : jobCount + orderCount;

    return res.json({
      success: true,
      data: transactions,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/payment-billings/jobs/:jobId
 * Get job transaction details
 */
export const getJobTransactionDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;

    if (!isValidId(jobId)) {
      return res.status(400).json({ success: false, message: "Invalid jobId" });
    }

    const job = await Job.findById(jobId)
      .populate("userId", "fullName mobileNumber email address")
      .populate("services", "name category price")
      .populate("technicianId", "fullName mobileNumber");

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.json({
      success: true,
      data: {
        jobId: job.jobId,
        customer: job.userId,
        technician: job.technicianId,
        services: job.bookedServices,
        amount: job.pricing?.finalPrice,
        paymentStatus: job.paymentStatus?.paymentMethod,
        jobStatus: job.status,
        createdAt: job.createdAt,
        timeline: job.steps || [],
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/payment-billings/orders/:orderId
 * Get order transaction details
 */
export const getOrderTransactionDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;

    if (!isValidId(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid orderId" });
    }

    const order = await Order.findById(orderId).populate("customerId", "fullName mobileNumber email address");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json({
      success: true,
      data: {
        orderId: order.orderId,
        customer: order.customerId,
        items: (order as any).cartItems || [],
        pricing: order.pricing,
        paymentStatus: order.payment?.paymentStatus,
        paymentMethod: order.payment?.paymentMethod,
        paidAt: order.payment?.paidAt,
        refunds: order.payment?.refundedAmount ? [{ amount: order.payment.refundedAmount, date: order.payment.refundedAt }] : [],
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/payment-billings/mark-received
 * Mark money received (collected → paid)
 */
export const markMoneyReceived = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId, type, amount, paymentMethod, notes } = req.body;

    if (!["job", "order"].includes(type)) {
      return res.status(400).json({ success: false, message: "type must be job or order" });
    }

    if (type === "job") {
      if (!isValidId(transactionId)) {
        return res.status(400).json({ success: false, message: "Invalid jobId" });
      }

      const job = await Job.findById(transactionId);
      if (!job) {
        return res.status(404).json({ success: false, message: "Job not found" });
      }

      // Mark as paid
      if (job.paymentStatus) {
        job.paymentStatus.status = "paid";
      } else {
        job.paymentStatus = { status: "paid" } as any;
      }

      if (!job.steps) (job as any).steps = [];
      if (job.steps) {
        job.steps.push({
          stepId: "PAYMENT-" + Date.now(),
          stepName: "Payment Received",
          stepDescription: `${amount || job.pricing?.finalPrice} received via ${paymentMethod}. ${notes || ""}`,
          adminId: req.adminId,
          createdAt: new Date(),
        });
      }

      await job.save();

      return res.json({
        success: true,
        message: "Payment marked as received for job",
        data: { jobId: job.jobId, paymentStatus: job.paymentStatus?.status },
      });
    } else {
      if (!isValidId(transactionId)) {
        return res.status(400).json({ success: false, message: "Invalid orderId" });
      }

      const order = await Order.findById(transactionId);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      if (order.payment) {
        order.payment.paymentStatus = "paid";
        order.payment.paidAt = new Date();
      }
      await order.save();

      return res.json({
        success: true,
        message: "Payment marked as received for order",
        data: { orderId: order.orderId, paymentStatus: order.payment?.paymentStatus },
      });
    }
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/payment-billings/refund
 * Process refund (partial or full)
 */
export const processRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId, type, refundAmount, reason, refundMethod } = req.body;

    if (!["job", "order"].includes(type)) {
      return res.status(400).json({ success: false, message: "type must be job or order" });
    }

    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({ success: false, message: "refundAmount must be positive number" });
    }

    if (type === "job") {
      if (!isValidId(transactionId)) {
        return res.status(400).json({ success: false, message: "Invalid jobId" });
      }

      const job = await Job.findById(transactionId);
      if (!job) {
        return res.status(404).json({ success: false, message: "Job not found" });
      }

      if (!job.steps) (job as any).steps = [];
      if (job.steps) {
        job.steps.push({
          stepId: "REFUND-" + Date.now(),
          stepName: "Refund Processed",
          stepDescription: `₹${refundAmount} refunded via ${refundMethod}. Reason: ${reason}`,
          adminId: req.adminId,
          createdAt: new Date(),
        });
      }

      await job.save();

      return res.json({
        success: true,
        message: "Refund processed for job",
        data: { jobId: job.jobId, refundAmount, status: job.paymentStatus?.status },
      });
    } else {
      if (!isValidId(transactionId)) {
        return res.status(400).json({ success: false, message: "Invalid orderId" });
      }

      const order = await Order.findById(transactionId);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      if (order.payment && order.pricing) {
        const currentRefunded = order.payment.refundedAmount || 0;
        order.payment.refundedAmount = currentRefunded + refundAmount;
        order.payment.refundedAt = new Date();
        order.payment.paymentStatus = refundAmount >= order.pricing.finalPrice ? "refunded" : "failed";
      }

      await order.save();

      return res.json({
        success: true,
        message: "Refund processed for order",
        data: {
          orderId: order.orderId,
          refundAmount,
          totalRefunded: order.payment?.refundedAmount,
          status: order.payment?.paymentStatus,
        },
      });
    }
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/payment-billings/refunds
 * Get all refunds with filters
 */
export const getRefunds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, page = "1", limit = "10" } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    let dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) {
        const ed = new Date(endDate as string);
        ed.setHours(23, 59, 59, 999);
        dateFilter.$lte = ed;
      }
    }

    const matchStage = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [refunds, total] = await Promise.all([
      Order.find({ "payment.refundedAmount": { $gt: 0 }, ...matchStage })
        .select("orderId customerId pricing payment status createdAt")
        .populate("customerId", "fullName mobileNumber")
        .sort({ "payment.refundedAt": -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments({ "payment.refundedAmount": { $gt: 0 }, ...matchStage }),
    ]);

    const refundList = refunds.map((r: any) => ({
      orderId: r.orderId,
      customer: r.customerId,
      originalAmount: r.pricing.finalPrice,
      refundedAmount: r.payment.refundedAmount,
      refundedAt: r.payment.refundedAt,
      status: r.payment.paymentStatus,
    }));

    return res.json({
      success: true,
      data: refundList,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/payment-billings/due-payments
 * Get pending payment requests (collected but not paid to operator)
 */
export const getDuePayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = "1", limit = "10" } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));

    // Jobs with collected status (in an enhanced model)
    // For now, return placeholder
    return res.json({
      success: true,
      data: [],
      message: "Due payments tracking - requires Job model enhancement",
      pagination: { page: pageNum, limit: limitNum, total: 0, pages: 0 },
    });
  } catch (err) {
    return next(err);
  }
};
