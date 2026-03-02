import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
  addVendor,
  deleteVendor,
  getVendorDetails,
  getVendors,
  updateVendor,
  vendorHistory,
} from "../../controllers/Vendor/vendorController.js";

const router = express.Router();

router.post("/addVendor", authenticateAdmin, addVendor);
router.get("/getVendors", authenticateAdmin, getVendors);
router.get("/getVendorDetails/:vendorId", authenticateAdmin, getVendorDetails);
router.get("/vendorHistory/:vendorId", authenticateAdmin, vendorHistory);

router.put("/updateVendor/:vendorId", authenticateAdmin, updateVendor);
router.delete("/deleteVendor/:vendorId", authenticateAdmin, deleteVendor);

export default router;
