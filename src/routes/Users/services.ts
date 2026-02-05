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
router.get("/services", getAllServices); 
router.get("/services/:serviceId", getServiceDetails); 
router.get("/services/search", searchServices); 

// Bookings
router.post("/bookings", authenticateUser, bookService); 
router.get("/orders", authenticateUser, getUserOrders); 
router.get("/orders/:jobId", authenticateUser, getOrderDetails); 
router.post("/orders/:jobId/cancel", authenticateUser, cancelService); 
router.post("/orders/:jobId/reschedule", authenticateUser, rescheduleService); 

// AMC
router.get("/amc-plans", getAMCPlans); 
router.get("/amc-plans/:planId", getPlanDetails); 
router.post("/amc/subscribe", authenticateUser, subscribeAMC); 
router.get("/amc/subscriptions", authenticateUser, getUserAMCSubscriptions); 
router.get("/amc/:subscriptionId", authenticateUser, getAMCDetails); 
router.post("/amc/:subscriptionId/renew", authenticateUser, renewAMC); 

// Products
router.get("/products", getProducts); 
router.get("/products/:productId", getProductDetails); 
router.post("/products/order", authenticateUser, orderProduct); // Confusion(Take care of the logic)
router.get("/products/search", searchProducts); 

export default router;
