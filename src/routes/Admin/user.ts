import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
  getAllCustomers,
  getCustomerDetails,
  getCustomerStats,
  jobDetailsAttchedToCustomer,
} from "../../controllers/Admin/userController.js";

const router = express.Router();

router.get("/getCustomerStats", authenticateAdmin, getCustomerStats);
router.get("/getAllCustomers", authenticateAdmin, getAllCustomers);
router.get(
  "/getCustomerDetails/:userId",
  authenticateAdmin,
  getCustomerDetails,
);
router.get(
  "/jobDetailsAttchedToCustomer/:jobId",
  authenticateAdmin,
  jobDetailsAttchedToCustomer,
);

export default router;
