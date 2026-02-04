import express from "express";
import { adminLogin, getAdminProfile } from "../../controllers/Admin/authController.js";
import { authenticateAdmin } from "../../middlewares/authorisation.js";

const router = express.Router();

// Auth routes
// router.post("/register", adminRegister);
router.post("/login", adminLogin); // Done
router.get("/profile", authenticateAdmin, getAdminProfile); // Done

export default router;
