import express from "express";
import { authenticateTechnician } from "../../middlewares/authorisation.js";
import { getTodayDashboard } from "../../controllers/Technician/authController.js";

/**
 * @swagger
 * tags:
 *   - name: Technician Status & Dashboard (new)
 *     description: Technician dashboard endpoints
 */

/**
 * @swagger
 * /technician/dashboard:
 *   get:
 *     tags:
 *       - Technician Status & Dashboard (new)
 *     summary: Get today's performance dashboard
 *     description: Retrieve today's job statistics, total earnings, and rating
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     todaysJobs:
 *                       type: object
 *                       properties:
 *                         new:
 *                           type: integer
 *                           description: Count of new assigned jobs today
 *                         ongoing:
 *                           type: integer
 *                           description: Count of in-progress jobs today
 *                         completed:
 *                           type: integer
 *                           description: Count of completed jobs today
 *                     totalEarnings:
 *                       type: number
 *                       description: Total earnings from completed jobs today
 *                     rating:
 *                       type: number
 *                       description: Technician's average rating
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Technician not found
 */

const router = express.Router();

router.get("/", authenticateTechnician, getTodayDashboard);

export default router;
