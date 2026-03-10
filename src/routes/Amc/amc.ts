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
 * /amc/addAMC:
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
 *               - planName
 *               - planDescription
 *               - price
 *               - value
 *               - unit
 *               - scheduledService
 *               - sparePartsIncluded
 *               - emergencyVisits
 *               - remoteSupport
 *               - priorityService
 *               - extendedWarranty
 *               - isPopular
 *               - isActive
 *               - termsAndConditions
 *             properties:
 *               planName:
 *                 type: string
 *               planDescription:
 *                 type: string
 *               price:
 *                 type: number
 *               value:
 *                 type: number
 *               unit:
 *                 type: string
 *                 enum: [months, years]
 *                 description: Duration unit (months or years)
 *               scheduledService:
 *                 type: string
 *               sparePartsIncluded:
 *                 type: boolean
 *               emergencyVisits:
 *                 type: boolean
 *               remoteSupport:
 *                 type: boolean
 *               priorityService:
 *                 type: boolean
 *               extendedWarranty:
 *                 type: boolean
 *               additionalBenefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               excludedBenefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               includedPlanFeatures:
 *                 type: array
 *                 items:
 *                   type: string
 *               excludedPlanFeatures:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPopular:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *               termsAndConditions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Plan added successfully
 *       400:
 *         description: Missing or invalid fields
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /amc/updateAMC/{planId}:
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
 *               planName:
 *                 type: string
 *               planDescription:
 *                 type: string
 *               price:
 *                 type: number
 *               value:
 *                 type: number
 *               unit:
 *                 type: string
 *                 enum: [months, years]
 *                 description: Duration unit (months or years)
 *               scheduledService:
 *                 type: string
 *               sparePartsIncluded:
 *                 type: boolean
 *               emergencyVisits:
 *                 type: boolean
 *               remoteSupport:
 *                 type: boolean
 *               priorityService:
 *                 type: boolean
 *               extendedWarranty:
 *                 type: boolean
 *               additionalBenefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               excludedBenefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               includedPlanFeatures:
 *                 type: array
 *                 items:
 *                   type: string
 *               excludedPlanFeatures:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPopular:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *               termsAndConditions:
 *                 type: string
 *     responses:
 *       200:
 *         description: Plan updated successfully
 *       400:
 *         description: Invalid update data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Plan not found
 */

/**
 * @swagger
 * /amc/allSubsribedUsers:
 *   get:
 *     tags:
 *       - AMC Plans
 *     summary: Get AMC subscribers
 *     description: Get all users subscribed to AMC plans
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Subscribers retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 allSubsribedUser:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     totalSubscribedUsers:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /amc/subscribedUserDetails/{subscriptionId}:
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 subscription:
 *                   type: object
 *       404:
 *         description: Subscription not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /amc/deleteAMC/{planId}:
 *   delete:
 *     tags:
 *       - AMC Plans
 *     summary: Delete AMC plan
 *     description: Delete an AMC plan (mark inactive)
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 plan:
 *                   type: object
 *       404:
 *         description: Plan not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /amc/cancelAMC/{subscriptionId}:
 *   patch:
 *     tags:
 *       - AMC Plans
 *     summary: Cancel AMC subscription
 *     description: Cancel an AMC subscription (admin or user)
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
 *         description: Subscription cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 subscription:
 *                   type: object
 *       404:
 *         description: Subscription not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /amc/AMCDetails/{planId}:
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 amcPlan:
 *                   type: object
 *       404:
 *         description: Plan not found
 */

/**
 * @swagger
 * /amc/allAMC:
 *   get:
 *     tags:
 *       - AMC Plans
 *     summary: Get all AMC plans
 *     description: Retrieve all available AMC plans
 *     responses:
 *       200:
 *         description: AMC plans retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 amcPlans:
 *                   type: array
 *                   items:
 *                     type: object
 */

/**
 * @swagger
 * /amc/subscribeAMC/{planId}:
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brandName
 *               - modelName
 *               - serialNumber
 *               - autoRenewal
 *             properties:
 *               brandName:
 *                 type: string
 *               modelName:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               autoRenewal:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Subscription created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 newSubscription:
 *                   type: object
 *       400:
 *         description: Missing fields or invalid plan
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Plan not found
 */

/**
 * @swagger
 * /amc/myAMC:
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 subscribedAmc:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: No active subscription
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /amc/renewAMC/{subscriptionId}:
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 subscription:
 *                   type: object
 *       400:
 *         description: Subscription not eligible for renewal or not authorized
 *       404:
 *         description: Subscription not found
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
