import { Request, Response, NextFunction } from "express";
import Vendor from "../../models/Vendor/vendor.js";
import Purchase from "../../models/Vendor/purchase.js";
import mongoose from "mongoose";

// admin controllers for vendor management
export const addVendor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      vendorName,
      name,
      phoneNumber,
      email,
      addressLine,
      state,
      city,
      pinCode,
      productCategories,
      bankName,
      accountNumber,
      ifscCode,
      additionalNotes,
    } = req.body;

    if (
      !vendorName ||
      !name ||
      !phoneNumber ||
      !addressLine ||
      !state ||
      !city ||
      !pinCode ||
      !productCategories
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const vendor = await Vendor.create({
      vendorName,
      contactPerson: {
        name,
        phoneNumber,
        email,
      },
      address: {
        addressLine,
        state,
        city,
        pinCode,
      },
      productCategories,
      bankingInfo: {
        bankName,
        accountNumber,
        ifscCode,
      },
      additionalNotes,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Vendor added successfully",
      vendor,
    });
  } catch (error) {
    return next(error);
  }
};

export const getVendors = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page = 1, limit = 10, search, paymentStatus } = req.query;

    const query: any = {
      isActive: true,
    };
    if (search) {
      query.$text = { $search: search as string };
    }

    // 💳 Payment Status Filter
    const allowedStatuses = ["PAID", "UNPAID", "PARTIAL"];

    if (paymentStatus && allowedStatuses.includes(paymentStatus as string)) {
      query.paymentStatus = paymentStatus;
    }

    const vendors = await Vendor.find(query)
      .populate("purchaseId")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const totalFilteredVendors = await Vendor.countDocuments(query);
    const totalVendors = await Vendor.countDocuments();

    return res.status(200).json({
      success: true,
      message: "Vendors retrieved successfully",
      vendors,
      pagination: {
        totalVendors,
        activeVendors: totalFilteredVendors,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalVendors / Number(limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getVendorDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId).populate("purchaseId");
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const totalPurchases = await Purchase.countDocuments({
      vendorId: new mongoose.Types.ObjectId(vendorId),
    });
    const totalUnits = await Purchase.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
        },
      },
      {
        $group: {
          _id: null,
          totalUnits: { $sum: "$quantity" },
        },
      },
    ]);

    const totalPaid = await Purchase.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          paymentStatus: "PARTIAL",
        },
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$amountPaid" },
        },
      },
    ]);

    const totalPendingAmount = await Purchase.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          paymentStatus: "PARTIAL",
        },
      },
      {
        $group: {
          _id: null,
          totalPendingAmount: { $sum: "$remainingAmount" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Vendor retrieved successfully",
      vendor,
      totalPurchases,
      totalUnits: totalUnits.length > 0 ? totalUnits[0].totalUnits : 0,
      totalPaid: totalPaid.length > 0 ? totalPaid[0].totalPaid : 0,
      totalPendingAmount:
        totalPendingAmount.length > 0
          ? totalPendingAmount[0].totalPendingAmount
          : 0,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateVendor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { vendorId } = req.params;

    const flattenObject = (obj: any, prefix = ""): any => {
      let result: any = {};

      for (let key in obj) {
        if (
          typeof obj[key] === "object" &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          Object.assign(result, flattenObject(obj[key], `${prefix}${key}.`));
        } else {
          result[`${prefix}${key}`] = obj[key];
        }
      }

      return result;
    };

    const updateData = flattenObject(req.body);

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vendor updated successfully",
      vendor,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteVendor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    vendor.isActive = false;
    await vendor.save();

    return res.status(200).json({
      success: true,
      message: "Vendor deleted successfully",
      vendor,
    });
  } catch (error) {
    return next(error);
  }
};

export const getVendorPurchaseHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const purchases = await Purchase.find({ vendorId })
      .populate("vendorId")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const totalPurchases = await Purchase.countDocuments({ vendorId });

    return res.status(200).json({
      success: true,
      message: "Vendor purchase history retrieved successfully",
      purchases,
      pagination: {
        total: totalPurchases,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalPurchases / Number(limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
};
