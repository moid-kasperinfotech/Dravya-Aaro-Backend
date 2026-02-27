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
