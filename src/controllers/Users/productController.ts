import Product from "../../models/Inventory/Product.js";
import Job from "../../models/Jobs/Job.js";
import User from "../../models/Users/User.js";

export const getProducts = async (req, res, next) => {
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

export const getProductDetails = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).json({
            success: true,
            product,
        });
    } catch (err) {
        next(err);
    }
};

export const orderProduct = async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Product ID and valid quantity required",
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        if (product.stockLevel < quantity) {
            return res.status(400).json({
                success: false,
                message: "Insufficient stock",
            });
        }

        // Create order as a Job (considering it as a delivery job)
        const jobId = `ORD-${Date.now()}`;
        const totalPrice = product.sellingPrice * quantity;

        const newOrder = new Job({
            jobId,
            customerId: req.userId,
            serviceId: null, // Product order doesn't have service
            serviceType: `Product Order: ${product.productName}`,
            price: totalPrice,
            address: "To be provided", // User should provide delivery address
            status: "pending",
            paymentStatus: "pending",
            notes: `${quantity} x ${product.productName}`,
        });

        await newOrder.save();

        // Update user orders
        const user = await User.findById(req.userId);
        if (user) {
            user.orders.push(newOrder._id);
            await user.save();
        }

        // Update product sold count
        product.quantitySoldThisMonth += quantity;
        product.stockLevel -= quantity;
        await product.save();

        res.status(201).json({
            success: true,
            message: "Product ordered successfully",
            order: newOrder,
            totalPrice,
        });
    } catch (err) {
        next(err);
    }
};

export const searchProducts = async (req, res, next) => {
    try {
        const { query } = req.query;

        if (!query || query.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Search query required",
            });
        }

        const products = await Product.find({
            isActive: true,
            $or: [
                { productName: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
                { category: { $regex: query, $options: "i" } },
            ],
        }).limit(20);

        res.status(200).json({
            success: true,
            products,
        });
    } catch (err) {
        next(err);
    }
};
