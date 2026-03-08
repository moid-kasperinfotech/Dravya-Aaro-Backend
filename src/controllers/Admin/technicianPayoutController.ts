import TechnicianPayout from "../../models/Payment/TechnicianPayout.js";
import Technician from "../../models/Technician/Technician.js";
import Job from "../../models/Services/jobs.js";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

/**
 * GET /admin/technician-payout/stats
 * Get technician payout statistics dashboard
 */
export const getPayoutStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = "week" } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    if (period === "week") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    }

    const stats = await TechnicianPayout.aggregate([
      {
        $match: {
          "period.startDate": { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalPayable: { $sum: "$payments.netPayable" },
          pendingAmount: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$payments.netPayable", 0] } },
          paidAmount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$payments.netPayable", 0] } },
          activeTechnicians: { $sum: 1 },
        },
      },
    ]) as any[];

    const data = stats.length > 0 ? stats[0] : { totalPayable: 0, pendingAmount: 0, paidAmount: 0, activeTechnicians: 0 };

    return res.json({
      success: true,
      data: {
        totalPayable: data.totalPayable || 0,
        pendingAmount: data.pendingAmount || 0,
        paidAmount: data.paidAmount || 0,
        activeTechnicians: data.activeTechnicians || 0,
        period,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/technician-payout/list
 * Get all technicians with due/paid amounts
 */
export const getPayoutList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status = "all", page = "1", limit = "10", sortBy = "netPayable" } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    let matchFilter: any = {};
    if (status !== "all") {
      matchFilter.status = status as string;
    }

    const sortField: any =
      sortBy === "dueAmount"
        ? { "payments.netPayable": -1 }
        : sortBy === "lastPayment"
          ? { createdAt: -1 }
          : { "payments.netPayable": -1 };

    const [payouts, total] = await Promise.all([
      TechnicianPayout.find(matchFilter)
        .populate("technicianId", "technicianId fullName mobileNumber")
        .sort(sortField)
        .skip(skip)
        .limit(limitNum),
      TechnicianPayout.countDocuments(matchFilter),
    ]);

    return res.json({
      success: true,
      data: payouts.map((p: any) => ({
        technicianId: p.technicianId._id,
        technicianName: p.technicianId.fullName,
        mobileNumber: p.technicianId.mobileNumber,
        totalEarnings: p.earnings.total,
        alreadyPaid: p.payments.alreadyPaid,
        netPayable: p.payments.netPayable,
        status: p.status,
        lastPaymentDate:
          p.paymentHistory.length > 0
            ? p.paymentHistory[p.paymentHistory.length - 1].date
            : null,
        paymentCount: p.paymentHistory.length,
      })),
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/technician-payout/:technicianId/details
 * Get full technician payout details (earnings, payment history, jobs)
 */
export const getPayoutDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { technicianId } = req.params;

    if (!isValidId(technicianId)) {
      return res.status(400).json({ success: false, message: "Invalid technicianId" });
    }

    const [technician, payouts, jobStats] = await Promise.all([
      Technician.findById(technicianId).select(
        "technicianId fullName mobileNumber email totalJobsCompleted totalEarnings averageRating currentStatus"
      ),
      TechnicianPayout.find({ technicianId: new mongoose.Types.ObjectId(technicianId) }).sort({
        "period.startDate": -1,
      }),
      Job.aggregate([
        { $match: { technicianId: new mongoose.Types.ObjectId(technicianId), status: "completed" } },
        {
          $group: {
            _id: null,
            totalCompleted: { $sum: 1 },
            totalEarnings: { $sum: "$totalPrice" },
            avgRating: { $avg: 4.5 }, // Placeholder, would need review data
          },
        },
      ]) as any,
    ]);

    if (!technician) {
      return res.status(404).json({ success: false, message: "Technician not found" });
    }

    const latestPayout = payouts.length > 0 ? payouts[0] : null;
    const jobData = jobStats.length > 0 ? jobStats[0] : { totalCompleted: 0, totalEarnings: 0 };

    return res.json({
      success: true,
      data: {
        technician,
        earningsBreakdown: {
          totalFromJobs: latestPayout?.earnings.totalFromJobs || jobData.totalEarnings || 0,
          commission: latestPayout?.earnings.commission || 0,
          deductions: latestPayout?.earnings.deductions || 0,
          netPayable: latestPayout?.payments.netPayable || 0,
        },
        paymentHistory: latestPayout?.paymentHistory || [],
        jobSummary: {
          completed: jobData.totalCompleted || 0,
          earnings: jobData.totalEarnings || 0,
        },
        payoutStatus: latestPayout?.status || "pending",
        period: latestPayout?.period || null,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /admin/technician-payout/:technicianId/jobs
 * Get all jobs assigned to technician with earnings
 */
export const getTechnicianPayoutJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { technicianId } = req.params;
    const { status = "all", page = "1", limit = "10" } = req.query;

    if (!isValidId(technicianId)) {
      return res.status(400).json({ success: false, message: "Invalid technicianId" });
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    let matchFilter: any = { technicianId: new mongoose.Types.ObjectId(technicianId) };
    if (status !== "all") {
      matchFilter.status = status as string;
    }

    const [jobs, total] = await Promise.all([
      Job.find(matchFilter)
        .select("jobId jobName totalPrice payment status createdAt updatedAt")
        .populate("userId", "fullName mobileNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Job.countDocuments(matchFilter),
    ]);

    return res.json({
      success: true,
      data: jobs.map((j: any) => ({
        jobId: j.jobId,
        jobName: j.jobName,
        customer: j.userId,
        amount: j.totalPrice,
        paymentStatus: j.payment,
        status: j.status,
        date: j.createdAt,
        refund: null, // TODO: Add refund info when job model is enhanced
      })),
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/technician-payout/mark-paid
 * Mark technician payout as paid
 */
export const markPayoutAsPaid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { technicianId, amount, paymentMethod, transactionId, date, notes } = req.body;

    if (!isValidId(technicianId)) {
      return res.status(400).json({ success: false, message: "Invalid technicianId" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "amount must be positive number" });
    }

    // Get latest payout record
    const payout = await TechnicianPayout.findOne({ technicianId: new mongoose.Types.ObjectId(technicianId) }).sort({
      "period.startDate": -1,
    });

    if (!payout) {
      return res.status(404).json({ success: false, message: "No payout record found for technician" });
    }

    // Add payment to history
    payout.paymentHistory.push({
      amount,
      date: date ? new Date(date) : new Date(),
      method: paymentMethod || "bank_transfer",
      transactionId,
      notes,
      processedBy: new mongoose.Types.ObjectId(req.adminId),
    });

    // Update paid amount and status
    payout.payments.alreadyPaid += amount;
    payout.payments.pending = Math.max(0, payout.payments.netPayable - payout.payments.alreadyPaid);

    // If all paid, mark as paid
    if (payout.payments.alreadyPaid >= payout.payments.netPayable) {
      payout.status = "paid";
    }

    await payout.save();

    return res.json({
      success: true,
      message: "Payout marked as paid",
      data: {
        technicianId,
        amount,
        alreadyPaid: payout.payments.alreadyPaid,
        netPayable: payout.payments.netPayable,
        pending: payout.payments.pending,
        status: payout.status,
      },
    });
  } catch (err) {
    return next(err);
  }
};
