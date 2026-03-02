import express from "express";
import {
  authenticateAdmin,
  authenticateUser,
} from "../../middlewares/authorisation.js";
import {
  addAmcPlan,
  cancelAmcByAdmin,
  cancelAmcByUser,
  deleteAmcPlan,
  getAllAmcPlans,
  getAllSubscribedAmcUsers,
  getAmcDetails,
  getSubscribedAmcPlanDetails,
  getSubscribedAmcUserDetails,
  renewAmc,
  subscribeAmcPlan,
  updateAmcPlan,
} from "../../controllers/Amc/amcController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: AMC Plans
 *     description: Annual Maintenance Contract (AMC) management endpoints
 */

/**
 * @swagger
 * /vendor/amc/addAMC:
 *   post:
 *     tags:
 *       - AMC Plans
 *     summary: Create AMC plan
 *     description: Create a new Annual Maintenance Contract plan
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - duration
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               duration:
 *                 type: integer
 *               durationUnit:
 *                 type: string
 *                 enum: [months, years]
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: AMC plan created
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/amc/updateAMC/{planId}:
 *   put:
 *     tags:
 *       - AMC Plans
 *     summary: Update AMC plan
 *     description: Update an existing AMC plan
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               features:
 *                 type: array
 *     responses:
 *       200:
 *         description: AMC plan updated
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/amc/allSubsribedUsers:
 *   get:
 *     tags:
 *       - AMC Plans
 *     summary: Get AMC subscribers
 *     description: Get all users subscribed to AMC plans
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subscribers retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/amc/subscribedUserDetails/{subscriptionId}:
 *   get:
 *     tags:
 *       - AMC Plans
 *     summary: Get subscriber details
 *     description: Get details of an AMC subscriber
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscriber details retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/amc/deleteAMC/{planId}:
 *   delete:
 *     tags:
 *       - AMC Plans
 *     summary: Delete AMC plan
 *     description: Delete an AMC plan
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AMC plan deleted
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/amc/cancelAMC/{subscriptionId}:
 *   patch:
 *     tags:
 *       - AMC Plans
 *     summary: Cancel AMC subscription
 *     description: Cancel an AMC subscription (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription cancelled
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/amc/AMCDetails/{planId}:
 *   get:
 *     tags:
 *       - AMC Plans
 *     summary: Get AMC plan details
 *     description: Get details of a specific AMC plan
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan details retrieved
 */

/**
 * @swagger
 * /vendor/amc/allAMC:
 *   get:
 *     tags:
 *       - AMC Plans
 *     summary: Get all AMC plans
 *     description: Retrieve all available AMC plans
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: AMC plans retrieved
 */

/**
 * @swagger
 * /vendor/amc/subscribeAMC/{planId}:
 *   post:
 *     tags:
 *       - AMC Plans
 *     summary: Subscribe to AMC plan
 *     description: User subscribes to an AMC plan
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription created
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/amc/myAMC:
 *   get:
 *     tags:
 *       - AMC Plans
 *     summary: Get user's AMC subscription
 *     description: Get active AMC subscription for authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Subscription details retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/amc/renewAMC/{subscriptionId}:
 *   post:
 *     tags:
 *       - AMC Plans
 *     summary: Renew AMC subscription
 *     description: Renew an expiring AMC subscription
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription renewed
 *       401:
 *         description: Unauthorized
 */

// Admin Routes
router.post("/addAMC", authenticateAdmin, addAmcPlan);
router.put("/updateAMC/:planId", authenticateAdmin, updateAmcPlan);
router.get("/allSubsribedUsers", authenticateAdmin, getAllSubscribedAmcUsers);
router.get(
  "/subscribedUserDetails/:subscriptionId",
  authenticateAdmin,
  getSubscribedAmcUserDetails,
);
router.delete("/deleteAMC/:planId", authenticateAdmin, deleteAmcPlan);
router.patch("/cancelAMC/:subscriptionId", authenticateAdmin, cancelAmcByAdmin);

// public routes
router.get("/AMCDetails/:planId", getAmcDetails);
router.get("/allAMC", getAllAmcPlans);

// user routes
router.post("/subscribeAMC/:planId", authenticateUser, subscribeAmcPlan);
router.get("/myAMC", authenticateUser, getSubscribedAmcPlanDetails);
router.post("/renewAMC/:subscriptionId", authenticateUser, renewAmc);
router.patch("/cancelAMC/:subscriptionId", authenticateUser, cancelAmcByUser);

export default router;
