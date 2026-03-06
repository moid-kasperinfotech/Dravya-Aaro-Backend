import express from "express";
import { adminLogin, getAdminProfile } from "../../controllers/Admin/authController.js";
import { authenticateAdmin } from "../../middlewares/authorisation.js";

/**
 * @swagger
 * tags:
 *   - name: Admin Auth
 *     description: Admin authentication endpoints
 */

/**
 * @swagger
 * /admin/auth/login:
 *   post:
 *     tags:
 *       - Admin Auth
 *     summary: Admin login
 *     description: Login with email and password to get authentication token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 adminId:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /admin/auth/profile:
 *   get:
 *     tags:
 *       - Admin Auth
 *     summary: Get admin profile
 *     description: Get authenticated admin's profile details
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 admin:
 *                   type: object
 *       401:
 *         description: Unauthorized - Missing or invalid authentication
 */

const router = express.Router();

router.post("/login", adminLogin);
router.get("/profile", authenticateAdmin, getAdminProfile);

export default router;
