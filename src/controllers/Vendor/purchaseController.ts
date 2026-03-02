import { Request, Response, NextFunction } from "express";
import Payment from "../../models/Vendor/payment.js";
import Purchase from "../../models/Vendor/purchase.js";
import Vendor from "../../models/Vendor/vendor.js";
import uploadToCloudinary from "../../utils/uploadToCloudinary.js";

// admin controllers for purchase management
export const addPurchase = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let uploadedImages: any = [];
  try {
    const {
      vendorId,
      productName,
      brand,
      category,
      warrantyPeriod,
      quantity,
      unitPrice,
      taxPercent,
      additionalCharge = 0,
      amountPaid = 0,
      paymentMethod,
      notes,
    } = req.body;

    if (
      !vendorId ||
      !productName ||
      !brand ||
      !category ||
      !warrantyPeriod ||
      quantity == null ||
      unitPrice == null ||
      taxPercent == null
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // 1️⃣ Calculate totals
    const subTotal = quantity * unitPrice;
    const taxAmount = (taxPercent / 100) * subTotal;
    const totalAmount = subTotal + taxAmount + additionalCharge;
    const remainingAmount = totalAmount - amountPaid;

    let paymentStatus: "PAID" | "PARTIAL" | "UNPAID";

    if (remainingAmount <= 0) {
      paymentStatus = "PAID";
    } else if (amountPaid > 0) {
      paymentStatus = "PARTIAL";
    } else {
      paymentStatus = "UNPAID";
    }

    // 2️⃣ Create Purchase
    const purchase = await Purchase.create({
      vendorId,
      productName,
      brand,
      category,
      warrantyPeriod,
      quantity,
      unitPrice,
      taxPercent,
      additionalCharge,
      totalAmount,
      amountPaid,
      remainingAmount,
      paymentStatus,
      notes,
      paidAt: paymentStatus === "PAID" ? new Date() : undefined,
    });

    // add ref purchase id to vendor
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }
    vendor.purchaseId = purchase._id;
    await vendor.save();

    // Upload receipt
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Payment receipt is required",
      });
    }

    // upload reciept to cloudinary
    uploadedImages = await Promise.all(
      files.map((file) => uploadToCloudinary(file, "receipt")),
    );

    // 3️⃣ If payment done during creation
    if (amountPaid > 0) {
      await Payment.create({
        purchaseId: purchase._id,
        amount: amountPaid,
        paymentMethod: paymentMethod || "CASH",
        paymentDate: new Date(),
        receipt: uploadedImages[0]
          ? {
              url: uploadedImages[0].url,
              publicId: uploadedImages[0].publicId,
            }
          : undefined,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Purchase added successfully",
      purchase: purchase,
    });
  } catch (error) {
    return next(error);
  }
};

export const getPurchases = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page = 1, limit = 10, search, paymentStatus } = req.query;

    const query: any = {};

    // 🔎 Search
    if (search) {
      query.$text = { $search: search as string };
    }

    // 💳 Payment Status Filter
    const allowedStatuses = ["PAID", "UNPAID", "PARTIAL"];

    if (paymentStatus && allowedStatuses.includes(paymentStatus as string)) {
      query.paymentStatus = paymentStatus;
    }

    const purchases = await Purchase.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const totalPurchases = await Purchase.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Purchases retrieved successfully",
      purchases,
      pagination: {
        totalPurchases,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalPurchases / Number(limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getPurchaseDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { purchaseId } = req.params;

    const purchase = await Purchase.findById(purchaseId).populate("vendor");
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Purchase retrieved successfully",
      purchase,
    });
  } catch (error) {
    return next(error);
  }
};

export const makePayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let uploadedImages: any[] = [];

  try {
    const { purchaseId } = req.params;
    const { amount, paymentMethod, paymentDate } = req.body;

    if (amount == null || !paymentMethod || !paymentDate) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const purchase = await Purchase.findById(purchaseId);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    if (purchase.paymentStatus === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Purchase already fully paid",
      });
    }

    if (amount > purchase.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: "Amount exceeds remaining balance",
      });
    }

    // Upload receipt
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Payment receipt required",
      });
    }

    uploadedImages = await Promise.all(
      files.map((file) => uploadToCloudinary(file, "receipt")),
    );

    // 1️⃣ Create Payment document
    await Payment.create({
      purchaseId,
      amount,
      paymentMethod,
      paymentDate,
      receipt: uploadedImages[0]
        ? {
            url: uploadedImages[0].url,
            publicId: uploadedImages[0].publicId,
          }
        : undefined,
    });

    // 2️⃣ Update Purchase summary
    purchase.amountPaid += amount;
    purchase.remainingAmount -= amount;

    if (purchase.remainingAmount === 0) {
      purchase.paymentStatus = "PAID";
      purchase.paidAt = new Date();
    } else {
      purchase.paymentStatus = "PARTIAL";
    }

    await purchase.save();

    return res.status(200).json({
      success: true,
      message: "Payment successful",
    });
  } catch (error) {
    return next(error);
  }
};

export const getPaymentHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { purchaseId } = req.params;

    const purchase = await Purchase.findById(purchaseId).populate("payment");
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment history retrieved successfully",
      purchase,
    });
  } catch (error) {
    return next(error);
  }
};
