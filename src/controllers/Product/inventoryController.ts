import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "./../../utils/uploadToCloudinary.js";
import { Request, Response, NextFunction } from "express";
import Product from "../../models/inventory/product.js";

interface FilterType {
  isActive: boolean;
  category?: string;
}

export const addProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let uploadedImages: any = [];
  try {
    const {
      productName,
      sku,
      category,
      brandName,
      modelNumber,
      modelType,
      mrp,
      costPrice,
      sellingPrice,
      discountPercentage,
      discountAmount,
      taxRate,
      stockLevel,
      reorderLevel,
      materialType,
      width,
      height,
      netWeight,
      nsfRating,
      warrantyPeriod,
      warrantyType,
      isActive,
    } = req.body;

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product images are required",
      });
    }

    if (
      !productName ||
      !sku ||
      !category ||
      !modelNumber ||
      !modelType ||
      !mrp ||
      !costPrice ||
      !sellingPrice ||
      !taxRate ||
      !stockLevel ||
      !materialType ||
      !width ||
      !height ||
      !netWeight ||
      !nsfRating ||
      !warrantyPeriod ||
      !warrantyType ||
      !isActive
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check existing product
    const existingProduct = await Product.findOne({ sku, productName });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product already exists",
      });
    }

    const profit = sellingPrice - costPrice;

    // upload images to cloudinary
    uploadedImages = await Promise.all(
      files.map((file) => uploadToCloudinary(file, "image")),
    );

    const newProduct = await Product.create({
      productName,
      sku,
      category,
      brandName,
      modelNumber,
      modelType,
      mrp,
      costPrice,
      sellingPrice,
      discount: {
        discountPercentage,
        discountAmount,
      },
      profit,
      taxRate,
      reorderLevel,
      specifications: {
        materialType,
        width,
        height,
        netWeight,
        nsfRating,
      },
      warranty: {
        warrantyPeriod,
        warrantyType,
      },
      productImages: uploadedImages.map((image: any) => ({
        url: image.url,
        public_id: image.publicId,
      })),
      isActive,
    });

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: newProduct,
    });
  } catch (error) {
    if (uploadedImages.length > 0) {
      await Promise.all(
        uploadedImages.map((img: any) => deleteFromCloudinary(img.publicId)),
      );
    }
    return next(error);
  }
};

export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    let filter: FilterType = { isActive: true };
    if (category) filter.category = category as string;

    let pageNumber = parseInt(page as string, 10);
    let limitNumber = parseInt(limit as string, 10);

    const skip = (pageNumber - 1) * limitNumber;

    const products = await Product.find(filter)
      .skip(skip)
      .limit(limitNumber)
      .lean();

    const totalProducts = await Product.countDocuments();
    const filteredTotalProducts = await Product.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      products,
      pagination: {
        current: pageNumber,
        total: totalProducts,
        filteredTotal: filteredTotalProducts,
        pages: Math.ceil(filteredTotalProducts / limitNumber),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let isUpdated: boolean = false;

    const allowedFields = [
      "productName",
      "category",
      "brandName",
      "modelNumber",
      "modelType",
      "mrp",
      "costPrice",
      "sellingPrice",
      "discountPercentage",
      "discountAmount",
      "taxRate",
      "stockLevel",
      "reorderLevel",
      "materialType",
      "width",
      "height",
      "netWeight",
      "nsfRating",
      "warrantyPeriod",
      "warrantyType",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (product as any)[field] = req.body[field];
        isUpdated = true;
      }
    });

    // recalculate profit if price changes
    if (req.body.sellingPrice || req.body.costPrice) {
      product.profit = product.sellingPrice - product.costPrice;
    }

    if (!isUpdated) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProductStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    product.isActive = !product.isActive;
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product status updated successfully",
      product,
    });
  } catch (error) {
    return next(error);
  }
};

export const restockProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.stockLevel += quantity;
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product restocked successfully",
      product,
    });
  } catch (error) {
    return next(error);
  }
};

export const getLowStockProducts = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ["$stockLevel", "$reorderLevel"] },
      isActive: true,
    });

    return res.status(200).json({
      success: true,
      message: "Low stock products fetched successfully",
      products,
    });
  } catch (error) {
    return next(error);
  }
};
