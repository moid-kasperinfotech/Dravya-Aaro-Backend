import express from "express";
import {
  authenticateAdmin,
  authenticateUser,
} from "../../middlewares/authorisation.js";
import {
  addToCart,
  cancelOrder,
  getAllOrders,
  getAllOrdersAdmin,
  getCartDetails,
  getOrderDetails,
  getOrderDetailsAdmin,
  getProductDetails,
  getProducts,
  orderProduct,
  refundOrderAmount,
  returnOrder,
  searchProduct,
  updateOrderStatus,
  updatePaymentStatus,
} from "../../controllers/Product/productController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product browsing and ordering endpoints
 */

/**
 * @swagger
 * /product/products/getProducts:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all products
 *     description: Retrieve list of available products
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */

/**
 * @swagger
 * /product/products/getProductDetails/{productId}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get product details
 *     description: Retrieve detailed information about a product
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details retrieved
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /product/products/search:
 *   get:
 *     tags:
 *       - Products
 *     summary: Search products
 *     description: Search products by name or category
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results retrieved
 */

/**
 * @swagger
 * /product/products/addToCart:
 *   post:
 *     tags:
 *       - Products
 *     summary: Add product to cart
 *     description: Add item to shopping cart
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item added to cart
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /product/products/cartDetails:
 *   post:
 *     tags:
 *       - Products
 *     summary: Get cart details
 *     description: Retrieve shopping cart contents
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cart details retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /product/products/orderProduct:
 *   post:
 *     tags:
 *       - Products
 *     summary: Create order
 *     description: Place an order from cart
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliveryAddress
 *             properties:
 *               deliveryAddress:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order created successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /product/products/orderDetails:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get user's orders
 *     description: Retrieve list of user's orders
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orders retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /product/products/allOrders:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all user orders
 *     description: Retrieve all orders for authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /product/products/cancelOrder/{orderId}:
 *   patch:
 *     tags:
 *       - Products
 *     summary: Cancel order
 *     description: Cancel a pending order
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /product/products/returnOrder/{orderId}:
 *   post:
 *     tags:
 *       - Products
 *     summary: Return order
 *     description: Request return for delivered order
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return request submitted
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /product/products/allOrdersAdmin:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all orders (Admin)
 *     description: Admin view of all orders
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orders retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /product/products/orderDetailsAdmin/{orderId}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get order details (Admin)
 *     description: Admin view of order details
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /product/products/updateOrderStatus/{orderId}:
 *   patch:
 *     tags:
 *       - Products
 *     summary: Update order status
 *     description: Admin update order status
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /product/products/updatePaymentStatus/{orderId}:
 *   patch:
 *     tags:
 *       - Products
 *     summary: Update payment status
 *     description: Admin update payment status
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentStatus
 *             properties:
 *               paymentStatus:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment status updated
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /product/products/refund/{orderId}:
 *   post:
 *     tags:
 *       - Products
 *     summary: Refund order
 *     description: Process refund for order
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Refund processed
 *       401:
 *         description: Unauthorized
 */

// public routes
router.get("/getProducts", getProducts);
router.get("/getProductDetails/:productId", getProductDetails);
router.get("/search", searchProduct);

// user routes
router.post("/addToCart", authenticateUser, addToCart);
router.post("/cartDetails", authenticateUser, getCartDetails);
router.post("/orderProduct", authenticateUser, orderProduct);
router.get("/orderDetails", authenticateUser, getOrderDetails);
router.get("/allOrders", authenticateUser, getAllOrders);
router.patch("/cancelOrder/:orderId", authenticateUser, cancelOrder);
router.post("/returnOrder/:orderId", authenticateUser, returnOrder);

// admin routes
router.get("/allOrdersAdmin", authenticateAdmin, getAllOrdersAdmin);
router.get(
  "/orderDetailsAdmin/:orderId",
  authenticateAdmin,
  getOrderDetailsAdmin,
);
router.patch(
  "/updateOrderStatus/:orderId",
  authenticateAdmin,
  updateOrderStatus,
);
router.patch(
  "/updatePaymentStatus/:orderId",
  authenticateAdmin,
  updatePaymentStatus,
);
router.post("/refund/:orderId", authenticateAdmin, refundOrderAmount);

export default router;
