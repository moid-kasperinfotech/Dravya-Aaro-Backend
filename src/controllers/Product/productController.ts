import { Request, Response, NextFunction } from "express";
import Product from "../../models/inventory/product.js";
import Order from "../../models/inventory/order.js";
import Cart from "../../models/inventory/cart.js";
import User from "../../models/Users/User.js";
import ProductReview from "../../models/inventory/review.js";
import Wishlist from "../../models/inventory/wishlist.js";

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
    const cart = await Cart.findOne({ customerId: req.userId }).populate(
      "productList.productId",
    );

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Filter out products that don't exist or are null
    const validProducts = cart.productList.filter(
      (item: any) => item.productId && item.productId._id,
    );

    // Recalculate totalQuantity
    const correctTotalQuantity = validProducts.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    // Update cart if products were removed or totalQuantity is wrong
    if (
      validProducts.length !== cart.productList.length ||
      cart.totalQuantity !== correctTotalQuantity
    ) {
      cart.productList = validProducts as any;
      cart.totalQuantity = correctTotalQuantity;
      await cart.save();
    }

    if (validProducts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        data: {
          cartItems: [],
          totalItems: 0,
          orderSummary: {
            subtotal: 0,
            shippingCharge: 0,
            gst: 0,
            discount: 0,
            total: 0,
          },
        },
      });
    }

    let subtotal = 0;
    let totalDiscount = 0;
    let shippingCharge = 0;
    let gstTax = 0;

    const cartItems = validProducts.map((item: any) => {
      const product = item.productId;
      const subTotal = product.sellingPrice * item.quantity;
      const itemDiscount =
        (subTotal * (product.discount?.discountPercentage || 0)) / 100;

      subtotal += subTotal;
      totalDiscount += itemDiscount;
      shippingCharge = product.shippingCharge || 0;

      return {
        productId: product._id,
        name: product.productName,
        image: product.productImages[0]?.url || "",
        category: product.category,
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice,
        mrp: product.mrp,
        shippingCharge: product.shippingCharge,
        expectedDeliveryDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        discount: product.discount?.discountPercentage || 0,
        taxRate: product.taxRate,
        quantity: item.quantity,
        subTotal,
        warranty: product.warranty,
      };
    });

    if (validProducts.length > 0) {
      const firstProduct: any = validProducts[0].productId;
      gstTax = (subtotal * (firstProduct.taxRate || 0)) / 100;
    }

    const total = subtotal + shippingCharge + gstTax - totalDiscount;

    const orderSummary = {
      subtotal,
      shippingCharge,
      gst: gstTax,
      discount: totalDiscount,
      total,
    };

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data: {
        cartItems,
        totalItems: cart.totalQuantity,
        orderSummary,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateCartQuantity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId, action } = req.body;

    if (!productId || !action) {
      return res.status(400).json({
        success: false,
        message: "Product ID and action (increase/decrease) required",
      });
    }

    const cart = await Cart.findOne({ customerId: req.userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const productIndex = cart.productList.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const cartItem = cart.productList[productIndex];

    if (action === "increase") {
      if (cartItem.quantity + 1 > product.stockLevel) {
        return res.status(400).json({
          success: false,
          message: "Insufficient stock",
        });
      }
      cartItem.quantity += 1;
    } else if (action === "decrease") {
      if (cartItem.quantity <= 1) {
        cart.productList.splice(productIndex, 1);
      } else {
        cartItem.quantity -= 1;
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use 'increase' or 'decrease'",
      });
    }

    cart.totalQuantity = cart.productList.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart,
    });
  } catch (error) {
    return next(error);
  }
};

export const removeFromCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = req.body;

    const cart = await Cart.findOne({ customerId: req.userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const productIndex = cart.productList.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    cart.productList.splice(productIndex, 1);

    cart.totalQuantity = cart.productList.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from cart successfully",
      cart,
    });
  } catch (error) {
    return next(error);
  }
};

export const clearCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cart = await Cart.findOne({ customerId: req.userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.productList = [] as any;
    cart.totalQuantity = 0;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    return next(error);
  }
};

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
    }).populate("productList.productId");

    if (!cart || cart.productList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const productIds = cart.productList.map((item: any) => item.productId._id);

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

    // Calculate pricing
    let subtotal = 0;
    let totalDiscount = 0;
    let shippingCharge = 0;
    let gstTax = 0;

    const orderItems = cart.productList.map((item: any) => {
      const product = item.productId;
      const subTotal = product.sellingPrice * item.quantity;
      const itemDiscount =
        (subTotal * (product.discount?.discountPercentage || 0)) / 100;

      subtotal += subTotal;
      totalDiscount += itemDiscount;
      shippingCharge = product.shippingCharge || 0;

      return {
        productId: product._id,
        name: product.productName,
        image: product.productImages[0]?.url || "",
        price: {
          sellingPrice: product.sellingPrice,
          costPrice: product.costPrice,
        },
        quantity: item.quantity,
        warranty: {
          warrantyPeriod: product.warranty?.warrantyPeriod,
          warrantyType: product.warranty?.warrantyType,
        },
      };
    });

    if (cart.productList.length > 0) {
      const firstProduct: any = cart.productList[0].productId;
      gstTax = (subtotal * (firstProduct.taxRate || 0)) / 100;
    }

    const finalPrice = subtotal + shippingCharge + gstTax - totalDiscount;

    if (paymentMethod === "cash") {
      const order = await Order.create({
        orderId,
        customerId: req.userId,
        customerDetails: {
          name: shippingAddress.name,
          mobileNumber: shippingAddress.mobileNumber,
        },
        expectedDeliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
        status: "confirmed",
        payment: {
          paymentMethod,
          paymentStatus: "pending",
        },
        pricing: {
          subTotal: subtotal,
          shippingCharge,
          gst: gstTax,
          finalPrice,
        },
        shippingAddress: {
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: shippingAddress.country,
          pincode: shippingAddress.pincode,
          address: shippingAddress.address,
          addressType: shippingAddress.addressType,
          ...(shippingAddress?.landMark && {
            landMark: shippingAddress.landMark,
          }),
        },
        orderItems,
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

      // clear cart
      cart.productList = [] as any;
      cart.totalQuantity = 0;

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
    const { page = 1, limit = 20, type } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // ===== STATUS FILTER =====
    let statusFilter: any = {};

    if (type === "ongoing") {
      statusFilter.status = {
        $in: ["pending", "confirmed", "processing"],
      };
    } else if (type === "history") {
      statusFilter.status = {
        $in: ["delivered", "returned", "cancelled"],
      };
    }

    // ===== FINAL FILTER =====
    const filter = {
      customerId: req.userId,
      ...statusFilter,
    };

    const orders = await Order.find(filter)
      .skip(skip)
      .limit(limitNumber)
      .lean();

    const totalOrders = await Order.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders,
      pagination: {
        current: pageNumber,
        total: totalOrders,
        pages: Math.ceil(totalOrders / limitNumber),
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
    const { page = 1, limit = 20, status, date, search } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    let filter: any = {};

    // ===== STATUS FILTER =====
    if (status && status !== "all") {
      filter.status = status;
    }

    // ===== DATE FILTER =====
    if (date) {
      const selectedDate = new Date(date as string);

      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

      filter.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    // ===== SEARCH FILTER =====
    if (search) {
      const searchRegex = new RegExp(search as string, "i");

      filter.$or = [
        { orderId: searchRegex },
        { "customerDetails.name": searchRegex },
      ];
    }

    // ===== QUERY =====
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    const totalOrders = await Order.countDocuments(filter);

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

export const addReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Product ID, rating, and comment are required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const existingReview = await ProductReview.findOne({
      productId,
      userId: req.userId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const review = await ProductReview.create({
      productId,
      userId: req.userId,
      rating,
      comment,
    });

    const allReviews = await ProductReview.find({ productId });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = totalRating / allReviews.length;
    product.reviews = allReviews.length;
    await product.save();

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    return next(error);
  }
};

export const getProductReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const reviews = await ProductReview.find({ productId })
      .populate("userId", "name email")
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 })
      .lean();

    const totalReviews = await ProductReview.countDocuments({ productId });

    return res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      reviews,
      pagination: {
        current: pageNumber,
        total: totalReviews,
        pages: Math.ceil(totalReviews / limitNumber),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = req.params;
    const { deliveryTime, aboutThisItem } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (deliveryTime) product.deliveryTime = deliveryTime;
    if (aboutThisItem) product.aboutThisItem = aboutThisItem;

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

export const addToWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let wishlist = await Wishlist.findOne({ userId: req.userId });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        userId: req.userId,
        products: [{ productId }],
      });
    } else {
      const existingProduct = wishlist.products.find(
        (item) => item.productId.toString() === productId,
      );

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "Product already in wishlist",
        });
      }

      wishlist.products.push({ productId } as any);
      await wishlist.save();
    }

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist successfully",
      wishlist,
    });
  } catch (error) {
    return next(error);
  }
};

export const getWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.userId }).populate(
      "products.productId",
    );

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        message: "Wishlist is empty",
        wishlist: { products: [] },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Wishlist fetched successfully",
      wishlist,
    });
  } catch (error) {
    return next(error);
  }
};

export const removeFromWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId: req.userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    const productIndex = wishlist.products.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      });
    }

    wishlist.products.splice(productIndex, 1);
    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist successfully",
      wishlist,
    });
  } catch (error) {
    return next(error);
  }
};
