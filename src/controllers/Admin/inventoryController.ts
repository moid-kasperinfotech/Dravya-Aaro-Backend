import Product from "../../models/Inventory/Product.js";
import { Request, Response, NextFunction } from "express";

interface FilterType {
    isActive: boolean;
    category?: string;
}

export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { category, page = 1, limit = 20 } = req.query;

        let filter: FilterType = { isActive: true };
        if (category) filter.category = category as string;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);

        const skip = (pageNum - 1) * limitNum;

        const products = await Product.find(filter)
            .skip(skip)
            .limit(limitNum);

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            products,
            pagination: {
                current: page,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (err) {
        next(err);
    }
};

export const addProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            productName,
            sku,
            modelNumber,
            category,
            warrantyPeriod,
            warrantyType,
            stockLevel,
            reorderLevel,
            discription,
            mrp,
            costPrice,
            sellingPrice,
            discountPercentage,
            discountAmount,
            taxRate,
            modelType,
            materialType,
            width,
            height,
            netWeight,
            nsfRating
        } = req.body;
 
        // Validation
        if (!productName || !sku || !category || !mrp || !costPrice || !sellingPrice) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        // Check if SKU exists
        const existingSku = await Product.findOne({ sku });
        if (existingSku) {
            return res.status(409).json({
                success: false,
                message: "SKU already exists",
            });
        }

        const profit = sellingPrice - costPrice;

        const obj = {
            productName, 
            sku,
            modelNumber,
            category,
            warranty: {
                period: warrantyPeriod,
                type: warrantyType
            },
            stockLevel,
            reorderLevel,
            discription,
            mrp,
            costPrice,
            sellingPrice,
            profit,
            discount: {
                percentage: discountPercentage,
                amount: discountAmount,
            },
            taxRate,
            modelType,
            materialType,
            specifications: {
                width,
                height,
                netWeight,
                nsfRating
            },
        }
        const newProduct = new Product(obj);

        await newProduct.save();

        return res.status(201).json({
            success: true,
            message: "Product added successfully",
            product: newProduct,
        });
    } catch (err) {
        return next(err);
    }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;
        const updateData = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Update only allowed fields
        Object.assign(product, updateData);

        // Recalculate profit if prices changed
        if (updateData.sellingPrice || updateData.costPrice) {
            product.profit = product.sellingPrice - product.costPrice;
        }

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product,
        });
    } catch (err) {
        return next(err);
    }
};

export const restockProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;
        const { quantity, reason: _reason } = req.body;

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
    } catch (err) {
        return next(err);
    }
};

export const getLowStockProducts = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const products = await Product.find({
            $expr: { $lte: ["$stockLevel", "$reorderLevel"] },
            isActive: true,
        });

        return res.status(200).json({
            success: true,
            products,
        });
    } catch (err) {
        return next(err);
    }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        product.isActive = false;
        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product deactivated successfully",
        });
    } catch (err) {
        return next(err);
    }
};
