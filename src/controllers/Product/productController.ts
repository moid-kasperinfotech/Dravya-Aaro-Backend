import { Request, Response, NextFunction } from "express";
import Product from "../../models/inventory/product.js";
import Order from "../../models/inventory/order.js";
import Cart from "../../models/inventory/cart.js";
import User from "../../models/Users/User.js";

interface FilterType {
  isActive: boolean;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sellingPrice?: any;
}

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    let filter: FilterType = { isActive: true };
    if (req.query.category) filter.category = category as string;

    if (req.query.minPrice || req.query.maxPrice) {
      filter.sellingPrice = {};
      if (req.query.minPrice)
        filter.sellingPrice.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice)
        filter.sellingPrice.$lte = Number(req.query.maxPrice);
    }

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

export const getProductDetails = async (
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

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    return next(error);
  }
};

export const searchProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = req.query.query as string;
    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query required",
      });
    }
    const product = await Product.find({
      isActive: true,
      $or: [
        { productName: { $regex: query, $options: "i" } },
        { brandName: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    }).limit(20);

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    return next(error);
  }
};

export const topSellingProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const products = await Product.find({
      isActive: true,
    })
      .sort({ quantitySoldThisMonth: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Top selling products fetched successfully",
      products,
      pagination: {
        current: pageNumber,
        total: products.length,
        pages: Math.ceil(products.length / limitNumber),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const addToCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity required",
      });
    }

    const product = await Product.findById(productId);
    if (!product || product.isActive !== true) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (quantity > product.stockLevel) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    let cart = await Cart.findOne({ customerId: req.userId });
    if (!cart) {
      cart = await Cart.create({
        customerId: req.userId,
        productList: [],
      });
    }

    const existingProduct = cart.productList.find(
      (item) => item.productId.toString() === productId,
    );

    if (existingProduct) {
      existingProduct.quantity += quantity;

      if (existingProduct.quantity > product.stockLevel) {
        return res.status(400).json({
          success: false,
          message: "Insufficient stock",
        });
      }
    } else {
      cart.productList.push({
        productId,
        quantity,
      });
    }

    cart.totalQuantity = cart.productList.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      cart,
    });
  } catch (error) {
    return next(error);
  }
};

export const getCartDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cart = await Cart.findOne({ customerId: req.userId }).lean();

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      cart,
    });
  } catch (error) {
    return next(error);
  }
};

// TODO: Implement updateCart, removeFromCart, updateOrderStatus, processPayment, etc.

export const orderProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { paymentMethod, shippingAddress } = req.body;

    // Validation
    if (!paymentMethod || !shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Payment method and shipping address required",
      });
    }

    const cart = await Cart.findOne({
      customerId: req.userId,
    });

    if (!cart || cart.productList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const productIds = cart.productList.map((item) => item.productId);

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    });

    if (products.length !== cart.productList.length) {
      return res.status(400).json({
        success: false,
        message: "Some products are not available",
      });
    }

    const orderId = `ORD-${Date.now()}`;

    if (paymentMethod === "cash") {
      const order = await Order.create({
        orderId,
        customerId: req.userId,
        customerDetails: {
          name: shippingAddress.name,
          email: shippingAddress.email,
          mobileNumber: shippingAddress.mobileNumber,
        },
        expectedDeliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
        status: "confirmed",
        payment: {
          paymentMethod,
          paymentStatus: "pending",
        },
        pricing: {
          subTotal: cart.productSellingPriceTotal,
          shippingCharge: cart.shippingCharge,
          gst: cart.gstTax,
          finalPrice: cart.payableAmount,
        },
        shippingAddress: {
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: shippingAddress.country,
          pincode: shippingAddress.pincode,
          address: shippingAddress.address,
          landMark: shippingAddress.landMark,
        },
        orderItems: cart.productList.map((item) => ({
          productId: item.productId,
          name: item.name,
          image: item.image,
          price: {
            sellingPrice: item.price?.sellingPrice,
            costPrice: item.price?.costPrice,
          },
          quantity: item.quantity,
          warranty: {
            warrantyPeriod: item.warranty?.warrantyPeriod,
            warrantyType: item.warranty?.warrantyType,
          },
        })),
      });

      const bulkOperation = cart.productList.map((item) => ({
        updateOne: {
          filter: {
            _id: item.productId,
            stockLevel: { $gte: item.quantity },
          },
          update: {
            $inc: {
              stockLevel: -item.quantity,
              quantitySoldThisMonth: item.quantity,
            },
          },
        },
      }));

      const result = await Product.bulkWrite(bulkOperation);

      if (result.modifiedCount !== cart.productList.length) {
        return res.status(400).json({
          success: false,
          message: "Some products are not available",
        });
      }

      cart.productList = [] as any;
      cart.totalQuantity = 0;
      cart.productCostPriceTotal = 0;
      cart.productSellingPriceTotal = 0;
      cart.shippingCharge = 0;
      cart.gstTax = 0;
      cart.payableAmount = 0;

      const user = await User.findById(req.userId);
      if (user) {
        user.orders.push(order._id);
        await user.save();
      }

      await cart.save();

      return res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order,
      });
    }
  } catch (error) {
    return next(error);
  }
};

export const getOrderDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      customerId: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      order,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const orders = await Order.find({
      customerId: req.userId,
    })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    const totalOrders = await Order.countDocuments({
      customerId: req.userId,
    });

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders,
      pagination: {
        current: pageNumber,
        total: orders.length,
        pages: Math.ceil(orders.length / limitNumber),
        totalOrders,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      customerId: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        success: true,
        message: "Order not found",
      });
    }

    // check order paid or not
    if (order.payment?.paymentStatus !== "paid") {
      order.status = "cancelled";
      order.cancelledAt = new Date();
      await order.save();
    } else {
      return res.status(400).json({
        success: false,
        message: "Order already paid and cannot be cancelled",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    return next(error);
  }
};

export const returnOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      customerId: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        success: true,
        message: "Order not found",
      });
    }

    // check order delivered or not
    if (order.status === "delivered") {
      order.returnReason = reason;
      await order.save();
      return res.status(200).json({
        success: true,
        message: "Order return iniated successfully",
        order,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Order not delivered yet",
      });
    }
  } catch (error) {
    return next(error);
  }
};

// admin controllers
export const getStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ["$stockLevel", "$reorderLevel"] },
      isActive: true,
    });

    const outOfStockProducts = await Product.countDocuments({
      stockLevel: 0,
      isActive: true,
    });

    return res.status(200).json({
      success: true,
      message: "Stats fetched successfully",
      stats: {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllOrdersAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const orders = await Order.find().skip(skip).limit(limitNumber).lean();

    const totalOrders = await Order.countDocuments();

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders,
      pagination: {
        current: pageNumber,
        totalOrders,
        pages: Math.ceil(totalOrders / limitNumber),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getOrderDetailsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order details fetched successfully",
      order,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId).populate(
      "orderItems.productId",
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = status;

    if (status === "delivered") {
      order.deliveredAt = new Date();

      order.orderItems.forEach((item: any) => {
        const warrantyPeriod = item.warranty?.warrantyPeriod;

        if (!warrantyPeriod) return;

        const expiry = new Date(order.deliveredAt!);

        const match = warrantyPeriod.match(
          /(\d+)\s*(year|years|month|months)/i,
        );

        if (match) {
          const value = parseInt(match[1]);
          const unit = match[2].toLowerCase();

          if (unit.includes("year")) {
            expiry.setFullYear(expiry.getFullYear() + value);
          } else if (unit.includes("month")) {
            expiry.setMonth(expiry.getMonth() + value);
          }
        }

        item.warrantyExpiryDate = expiry;
      });
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    return next(error);
  }
};

export const updatePaymentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status === "delivered") {
      if (order.payment) {
        order.payment.paymentStatus = paymentStatus;
      }
      await order.save();
    } else {
      return res.status(400).json({
        success: false,
        message: "Order not delivered yet",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      order,
    });
  } catch (error) {
    return next(error);
  }
};

export const refundOrderAmount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;
    const { refundAmount } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // payment check
    if (order.payment?.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Order is not paid yet",
      });
    }

    // order status check
    if (order.status !== "returned" && order.status !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Refund allowed only for returned or cancelled orders",
      });
    }

    // refund validation
    if (refundAmount > order.pricing?.finalPrice!) {
      return res.status(400).json({
        success: false,
        message: "Refund amount cannot exceed paid amount",
      });
    }

    // process refund
    order.payment.refundedAmount = refundAmount;
    order.payment.refundedAt = new Date();

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      order,
    });
  } catch (error) {
    return next(error);
  }
};
