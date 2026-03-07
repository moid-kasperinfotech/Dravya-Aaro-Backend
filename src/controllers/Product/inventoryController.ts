import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "./../../utils/uploadToCloudinary.js";
import { Request, Response, NextFunction } from "express";
import Product from "../../models/inventory/product.js";
import Technician from "../../models/Technician/Technician.js";
import {
  TechnicianInventory,
  TechnicianInventoryLog,
} from "../../models/inventory/technicianInventory.js";

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
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
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

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product images are required",
      });
    }

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
        public_id: image.public_id,
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
        uploadedImages.map((img: any) => deleteFromCloudinary(img.public_id)),
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

// Technician Issue / returned products APIS
export const issueProductsToTechnician = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId, quantity, remarks } = req.body;
    const { technicianId } = req.params;

    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity required",
      });
    }

    // check product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // check technician
    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    // check stock
    if (product.stockLevel < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient product stock",
      });
    }

    // reduce main stock
    product.stockLevel -= quantity;
    await product.save();

    // update technician inventory
    let inventory = await TechnicianInventory.findOne({
      technicianId,
      productId,
    });

    if (inventory) {
      inventory.quantity += quantity;
      await inventory.save();
    } else {
      inventory = await TechnicianInventory.create({
        technicianId,
        productId,
        quantity,
        remarks,
      });
    }

    // create log
    await TechnicianInventoryLog.create({
      technicianId,
      productId,
      quantity,
      type: "ISSUED",
      issuedBy: req.userId,
      remarks,
    });

    return res.status(200).json({
      success: true,
      message: "Product issued to technician successfully",
      inventory,
    });
  } catch (error) {
    return next(error);
  }
};

export const getIssuedProductsByTechnician = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await TechnicianInventory.countDocuments({
      technicianId: req.technicianId,
    });

    const issuedProducts = await TechnicianInventory.find({
      technicianId: req.technicianId,
    })
      .populate("productId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Issued products fetched successfully",
      issuedProducts,
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

export const getIssuedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await TechnicianInventory.countDocuments();

    const issuedProducts = await TechnicianInventory.find()
      .populate("productId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Issued products fetched successfully",
      issuedProducts,
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

export const getIssuedProductDetailsByTechnician = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { inventoryId } = req.params;

    const inventory =
      await TechnicianInventory.findById(inventoryId).populate("productId");
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Issued product not found",
      });
    }

    if (inventory.technicianId?.toString() !== req.technicianId?.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Issued product details fetched successfully",
      inventory,
    });
  } catch (error) {
    return next(error);
  }
};

export const getIssuedProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { inventoryId } = req.params;

    const inventory =
      await TechnicianInventory.findById(inventoryId).populate("productId");
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Issued product not found",
      });
    }

    // How many technician have issued this product
    const technician = await Technician.find({
      _id: inventory.technicianId,
    });

    return res.status(200).json({
      success: true,
      message: " Issued product details fetched successfully",
      inventory,
      technician,
    });
  } catch (error) {
    return next(error);
  }
};

export const returnProductsByTechnician = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { inventoryId, quantity, remarks } = req.body;
    const { technicianId } = req.params;

    if (!inventoryId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "inventoryId and quantity are required",
      });
    }

    const qty = Number(quantity);

    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a valid number greater than 0",
      });
    }

    // check technician
    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    // find inventory
    const inventory = await TechnicianInventory.findById(inventoryId);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    // check inventory belongs to technician
    if (inventory.technicianId.toString() !== technicianId) {
      return res.status(400).json({
        success: false,
        message: "Inventory does not belong to this technician",
      });
    }

    // check quantity
    if (inventory.quantity < qty) {
      return res.status(400).json({
        success: false,
        message: "Return quantity exceeds technician stock",
      });
    }

    // update technician inventory
    if (inventory.quantity === qty) {
      await inventory.deleteOne();
    } else {
      inventory.quantity -= qty;
      await inventory.save();
    }

    // increase main product stock
    await Product.findByIdAndUpdate(inventory.productId, {
      $inc: { stockLevel: qty },
    });

    // create log
    await TechnicianInventoryLog.create({
      technicianId,
      productId: inventory.productId,
      quantity: qty,
      type: "RETURNED",
      issuedBy: req.userId,
      remarks,
    });

    return res.status(200).json({
      success: true,
      message: "Product returned successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export const getReturnedProductsByTechnician = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { technicianId } = req.params;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // check technician
    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    // authorization check
    if (technicianId !== req.technicianId?.toString()) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // total count
    const total = await TechnicianInventoryLog.countDocuments({
      technicianId,
      type: "RETURNED",
    });

    const returnedProducts = await TechnicianInventoryLog.find({
      technicianId,
      type: "RETURNED",
    })
      .populate("productId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Returned products fetched successfully",
      returnedProducts,
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

export const getReturnedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // total count
    const total = await TechnicianInventoryLog.countDocuments({
      type: "RETURNED",
    });

    const returnedProducts = await TechnicianInventoryLog.find({
      type: "RETURNED",
    })
      .populate("productId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Returned products fetched successfully",
      returnedProducts,
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

export const useProductsByTechnician = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { inventoryId, quantity, remarks } = req.body;
    const { technicianId } = req.params;

    if (!inventoryId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "inventoryId and quantity are required",
      });
    }

    // check technician
    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    // authorization
    if (technicianId !== req.technicianId?.toString()) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // check inventory
    const inventory = await TechnicianInventory.findById(inventoryId);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    // quantity validation
    if (inventory.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Use quantity exceeds technician stock",
      });
    }

    // reduce inventory
    inventory.quantity -= quantity;
    await inventory.save();

    // TODO: get serviceId as well and store it 
    // create log
    await TechnicianInventoryLog.create({
      technicianId,
      productId: inventory.productId,
      quantity,
      type: "USED",
      remarks,
    });

    return res.status(200).json({
      success: true,
      message: "Product used successfully",
      inventory,
    });
  } catch (error) {
    return next(error);
  }
};
