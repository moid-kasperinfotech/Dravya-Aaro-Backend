import Product from "../../models/Inventory/Product.js";

export const getAllProducts = async (req, res, next) => {
    try {
        const { category, page = 1, limit = 20 } = req.query;

        let filter = { isActive: true };
        if (category) filter.category = category;

        const skip = (page - 1) * limit;

        const products = await Product.find(filter)
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            products,
            pagination: {
                current: page,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        next(err);
    }
};

export const addProduct = async (req, res, next) => {
    try {
        const {
            productName,
            sku,
            category,
            brandName,
            mrp,
            costPrice,
            sellingPrice,
            stockLevel,
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

        const newProduct = new Product({
            productName,
            sku,
            category,
            brandName,
            mrp,
            costPrice,
            sellingPrice,
            stockLevel,
            profit,
        });

        await newProduct.save();

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            product: newProduct,
        });
    } catch (err) {
        next(err);
    }
};

export const updateProduct = async (req, res, next) => {
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

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product,
        });
    } catch (err) {
        next(err);
    }
};

export const restockProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { quantity, reason } = req.body;

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

        res.status(200).json({
            success: true,
            message: "Product restocked successfully",
            product,
        });
    } catch (err) {
        next(err);
    }
};

export const getLowStockProducts = async (req, res, next) => {
    try {
        const products = await Product.find({
            $expr: { $lte: ["$stockLevel", "$reorderLevel"] },
            isActive: true,
        });

        res.status(200).json({
            success: true,
            products,
        });
    } catch (err) {
        next(err);
    }
};

export const deleteProduct = async (req, res, next) => {
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

        res.status(200).json({
            success: true,
            message: "Product deactivated successfully",
        });
    } catch (err) {
        next(err);
    }
};
