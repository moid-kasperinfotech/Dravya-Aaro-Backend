import express from "express";
import { authenticateUser } from "../../middlewares/authorisation.js";
import {
    getAllServices,
    getServiceDetails,
    searchServices,
} from "../../controllers/Users/serviceController.js";
import {
    bookService,
    getUserOrders,
    getOrderDetails,
    cancelService,
    rescheduleService,
} from "../../controllers/Users/bookingController.js";
import {
    getAMCPlans,
    getPlanDetails,
    subscribeAMC,
    getUserAMCSubscriptions,
    getAMCDetails,
    renewAMC,
} from "../../controllers/Users/amcController.js";
import {
    getProducts,
    getProductDetails,
    orderProduct,
    searchProducts,
} from "../../controllers/Users/productController.js";

const router = express.Router();

// Services
router.get("/services", getAllServices); // Done
router.get("/services/:serviceId", getServiceDetails); // Done
router.get("/services/search", searchServices); // Done

// Bookings
router.post("/bookings", authenticateUser, bookService); // Done
router.get("/orders", authenticateUser, getUserOrders); // Done
router.get("/orders/:jobId", authenticateUser, getOrderDetails); // Done
router.post("/orders/:jobId/cancel", authenticateUser, cancelService); // Done
router.post("/orders/:jobId/reschedule", authenticateUser, rescheduleService); // Done

// AMC
router.get("/amc-plans", getAMCPlans); // Done
router.get("/amc-plans/:planId", getPlanDetails); // Done
router.post("/amc/subscribe", authenticateUser, subscribeAMC); // Done
router.get("/amc/subscriptions", authenticateUser, getUserAMCSubscriptions); // Done
router.get("/amc/:subscriptionId", authenticateUser, getAMCDetails); // Done
router.post("/amc/:subscriptionId/renew", authenticateUser, renewAMC); // Done

// Products
router.get("/products", getProducts); // Done
router.get("/products/:productId", getProductDetails); // Done
router.post("/products/order", authenticateUser, orderProduct); // Confusion(Take care of the logic)
router.get("/products/search", searchProducts); // Done

export default router;
