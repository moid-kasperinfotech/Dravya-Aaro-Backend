import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
  addPurchase,
  getPaymentHistory,
  getPurchaseDetails,
  getPurchases,
  makePayment,
} from "../../controllers/Vendor/purchaseController.js";

const router = express.Router();

router.post("/addPurchase", authenticateAdmin, addPurchase);
router.get("/getPurchases", authenticateAdmin, getPurchases);
router.get(
  "/getPurchaseDetails/:purchaseId",
  authenticateAdmin,
  getPurchaseDetails,
);

router.post("/makePayment/:purchaseId", authenticateAdmin, makePayment);
router.get(
  "/getPaymentHistory/:purchaseId",
  authenticateAdmin,
  getPaymentHistory,
);

export default router;
