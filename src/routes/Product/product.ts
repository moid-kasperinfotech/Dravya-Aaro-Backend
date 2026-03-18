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
  getStats,
  orderProduct,
  refundOrderAmount,
  returnOrder,
  searchProduct,
  topSellingProducts,
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
 * /products/getProducts:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all products (👇USER API)
 *     description: Retrieve list of available products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
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
 * /products/getProductDetails/{productId}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get product details (👇USER API)
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
 * /products/search:
 *   get:
 *     tags:
 *       - Products
 *     summary: Search products (👇USER API)
 *     description: Search products by name or category
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results retrieved
 */

/**
 * @swagger
 * /products/addToCart:
 *   post:
 *     tags:
 *       - Products
 *     summary: Add product to cart (👇USER API)
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
 * /products/cartDetails:
 *   post:
 *     tags:
 *       - Products
 *     summary: Get cart details (👇USER API)
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
 * /products/orderProduct:
 *   post:
 *     tags:
 *       - Products
 *     summary: Create order (👇USER API)
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
 *               - paymentMethod
 *               - shippingAddress
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, online]
 *                 description: Payment method for order
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - name
 *                   - email
 *                   - mobileNumber
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   mobileNumber:
 *                     type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid order or cart empty
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /products/orderDetails/{orderId}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get order details (👇USER API)
 *     description: Retrieve details for a specific order by ID
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
 *         description: Order retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /products/allOrders:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all user orders (👇USER API)
 *     description: Retrieve all orders for authenticated user
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Orders retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /products/cancelOrder/{orderId}:
 *   patch:
 *     tags:
 *       - Products
 *     summary: Cancel order (👇USER API)
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
 * /products/returnOrder/{orderId}:
 *   post:
 *     tags:
 *       - Products
 *     summary: Return order (👇USER API)
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
 * /products/allOrdersAdmin:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all orders (👇ADMIN API)
 *     description: Admin view of all orders
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Orders retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /products/orderDetailsAdmin/{orderId}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get order details (👇ADMIN API)
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
 *  /products/updateOrderStatus/{orderId}:
 *   patch:
 *     tags:
 *       - Products
 *     summary: Update order status (👇ADMIN API)
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
 *                 enum: [pending, confirmed, processing, delivered, returned, cancelled]
 *                 description: Order status
 *     responses:
 *       200:
 *         description: Order status updated
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /products/updatePaymentStatus/{orderId}:
 *   patch:
 *     tags:
 *       - Products
 *     summary: Update payment status (👇ADMIN API)
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
 *                 enum: [pending, paid, failed, refunded]
 *                 description: Payment status
 *     responses:
 *       200:
 *         description: Payment status updated
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /products/refund/{orderId}:
 *   post:
 *     tags:
 *       - Products
 *     summary: Refund order (👇ADMIN API)
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

// user routes
router.get("/getProducts", authenticateUser, getProducts);
router.get(
  "/getProductDetails/:productId",
  authenticateUser,
  getProductDetails,
);
router.get("/search", authenticateUser, searchProduct);
router.get("/topSellingProducts", authenticateUser, topSellingProducts);
router.post("/addToCart", authenticateUser, addToCart);
router.get("/cartDetails", authenticateUser, getCartDetails);
router.post("/orderProduct", authenticateUser, orderProduct);
router.get("/orderDetails/:orderId", authenticateUser, getOrderDetails);
router.get("/allOrders", authenticateUser, getAllOrders);
router.patch("/cancelOrder/:orderId", authenticateUser, cancelOrder);
router.post("/returnOrder/:orderId", authenticateUser, returnOrder);

// admin routes
router.get("/getStats", authenticateAdmin, getStats);
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
