import express from "express";
import { adminRegister, adminLogin, adminLogout, getAdminProfile } from "../controllers/Admin/authController.js";
import { authenticateAdmin } from "../middlewares/authorisation.js";

const router = express.Router();

// Auth routes
router.post("/register", adminRegister);
router.post("/login", adminLogin);
router.post("/logout", authenticateAdmin, adminLogout);
router.get("/profile", authenticateAdmin, getAdminProfile);

export default router;
