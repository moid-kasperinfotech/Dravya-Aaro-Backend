import express from "express";
import { authenticateUser } from "../../middlewares/authorisation.js";
import {
  bookServiceController,
  getHistoryJobController,
  getOngoingJobController,
  acceptRescheduleController,
  rejectRescheduleController,
  addJobToCartController,
  getJobCartController,
  updateCartItemQuantityController,
  updateServiceCartQuantityController,
  removeFromCartController,
  clearServicesFromJobCartController,
} from "../../controllers/Users/booking.js";
import upload from "../../middlewares/multer.js";

/**
 * @swagger
 * tags:
 *   - name: User Bookings (👇USER APIs)
 *     description: User service booking endpoints
 */

/**
 * @swagger
 * /user/booking/add-job/cart:
 *   post:
 *     tags:
 *       - User Bookings (👇USER APIs)
 *     summary: Add service to cart with details
 *     description: Add a service to cart with brand, model, and optional problems/images. Problems are mandatory only for repair service type. If service already exists in cart, quantity will be incremented.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - brandName
 *               - modelType
 *             properties:
 *               serviceId:
 *                 type: string
 *                 description: Service ID to add to cart
 *                 example: 507f1f77bcf86cd799439011
 *               serviceQuantity:
 *                 type: number
 *                 description: Quantity of service to add
 *                 default: 1
 *                 minimum: 1
 *                 example: 2
 *               brandName:
 *                 type: string
 *                 description: Brand name of the appliance/equipment
 *                 example: LG
 *               modelType:
 *                 type: string
 *                 description: Model type of the appliance/equipment
 *                 example: AC500Z
 *               problems:
 *                 type: string
 *                 description: JSON array of problems (mandatory for repair service type only, optional for installation-uninstallation)
 *                 example: '["Not cooling properly", "Making noise"]'
 *               remarkByUser:
 *                 type: string
 *                 description: Additional remarks or notes from user
 *                 example: Please check the compressor
 *               imageByUser:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional - Upload up to 5 images of the issue
 *     responses:
 *       200:
 *         description: Service added to cart successfully
 *       400:
 *         description: Invalid request, missing required fields, or problems required for repair type
 *       404:
 *         description: Service not found or inactive
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/booking/job-cart:
 *   get:
 *     tags:
 *       - User Bookings (👇USER APIs)
 *     summary: Get job cart
 *     description: Retrieve the user's current job cart with all services
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Job cart fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 jobCart:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     serviceList:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totalQuantity:
 *                       type: number
 *                     servicePriceTotal:
 *                       type: number
 *                     gstTax:
 *                       type: number
 *                     payableAmount:
 *                       type: number
 *       404:
 *         description: Job cart not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/booking/clear-job-cart:
 *   delete:
 *     tags:
 *        - User Bookings (👇USER APIs)
 *     summary: Clear all services from job cart
 *     description: Remove all services from the user's job cart and reset totals
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Services cleared from cart successfully
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
 *                   example: Services cleared from cart successfully
 *                 jobCart:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     serviceList:
 *                       type: array
 *                       items:
 *                         type: object
 *                       example: []
 *                     totalQuantity:
 *                       type: number
 *                       example: 0
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job cart not found
 */

/**
 * @swagger
 * /user/booking:
 *   post:
 *     tags:
 *       - User Bookings (👇USER APIs)
 *     summary: Book services from cart
 *     description: Book all services from cart with location and schedule details only
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - timeRange
 *               - paymentMethod
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2024-03-10
 *               timeRange:
 *                 type: string
 *                 example: 10:00-12:00
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, online]
 *                 example: cash
 *               addressType:
 *                 type: string
 *                 enum: [fromAddress, toAddress]
 *                 example: fromAddress
 *                 description: Required only if cart has both relocation and normal services
 *               serviceAddress:
 *                 type: object
 *                 description: Required for normal services
 *                 properties:
 *                   house_apartment:
 *                     type: string
 *                     example: Apartment 301
 *                   street_sector:
 *                     type: string
 *                     example: Sector 5
 *                   landmark:
 *                     type: string
 *                     example: Near Park
 *                   latitude:
 *                     type: string
 *                     example: 28.7041
 *                   longitude:
 *                     type: string
 *                     example: 77.1025
 *                   fullName:
 *                     type: string
 *                     example: John Doe
 *                   mobileNumber:
 *                     type: string
 *                     example: 9876543210
 *               fromAddress:
 *                 type: object
 *                 description: Required for relocation services
 *                 properties:
 *                   house_apartment:
 *                     type: string
 *                     example: Apartment 301
 *                   street_sector:
 *                     type: string
 *                     example: Sector 5
 *                   landmark:
 *                     type: string
 *                     example: Near Park
 *                   latitude:
 *                     type: string
 *                     example: 28.7041
 *                   longitude:
 *                     type: string
 *                     example: 77.1025
 *                   fullName:
 *                     type: string
 *                     example: John Doe
 *                   mobileNumber:
 *                     type: string
 *                     example: 9876543210
 *               toAddress:
 *                 type: object
 *                 description: Required for relocation services
 *                 properties:
 *                   house_apartment:
 *                     type: string
 *                     example: Apartment 401
 *                   street_sector:
 *                     type: string
 *                     example: Sector 6
 *                   landmark:
 *                     type: string
 *                     example: Near Mall
 *                   latitude:
 *                     type: string
 *                     example: 28.7051
 *                   longitude:
 *                     type: string
 *                     example: 77.1035
 *                   fullName:
 *                     type: string
 *                     example: John Doe
 *                   mobileNumber:
 *                     type: string
 *                     example: 9876543210
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Invalid booking request or empty cart
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/booking/job:
 *   get:
 *     tags:
 *       - User Bookings (👇USER APIs)
 *     summary: Get ongoing jobs
 *     description: Retrieve list of currently ongoing service jobs for the user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Ongoing jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/booking/job/history:
 *   get:
 *     tags:
 *       - User Bookings (👇USER APIs)
 *     summary: Get job history
 *     description: Retrieve history of completed and past jobs
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
 *         description: Job history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *                 count:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/booking/{jobId}/accept-reschedule:
 *   post:
 *     tags:
 *       - User Bookings (👇USER APIs)
 *     summary: Accept reschedule request
 *     description: User accepts technician's rescheduling request for a job
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reschedule request accepted successfully
 *       400:
 *         description: No pending reschedule request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */

/**
 * @swagger
 * /user/booking/{jobId}/reject-reschedule:
 *   post:
 *     tags:
 *       - User Bookings (👇USER APIs)
 *     summary: Reject reschedule request
 *     description: User rejects technician's rescheduling request for a job
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reschedule request rejected successfully
 *       400:
 *         description: No pending reschedule request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */

const router = express.Router();

router.post(
  "/add-job/cart",
  upload.array("imageByUser", 5),
  authenticateUser,
  addJobToCartController,
);
router.get("/job-cart", authenticateUser, getJobCartController);
router.patch(
  "/update-cart-quantity",
  authenticateUser,
  updateServiceCartQuantityController,
);
router.patch(
  "/update-cart",
  authenticateUser,
  updateCartItemQuantityController,
);
router.delete(
  "/remove-from-cart/:serviceId",
  authenticateUser,
  removeFromCartController,
);
router.delete(
  "/clear-job-cart",
  authenticateUser,
  clearServicesFromJobCartController,
);
router.post("/", authenticateUser, bookServiceController);
router.get("/job", authenticateUser, getOngoingJobController);
router.get("/job/history", authenticateUser, getHistoryJobController);
router.post(
  "/:jobId/accept-reschedule",
  authenticateUser,
  acceptRescheduleController,
);
router.post(
  "/:jobId/reject-reschedule",
  authenticateUser,
  rejectRescheduleController,
);

export default router;

/**
 * @swagger
 * /user/booking/update-cart-quantity:
 *   patch:
 *     tags:
 *       - User Bookings (👇USER APIs)
 *     summary: Update service cart quantity (increase/decrease)
 *     description: Increase or decrease service quantity in cart by 1. Auto-removes if quantity becomes 0.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - action
 *             properties:
 *               serviceId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               action:
 *                 type: string
 *                 enum: [increase, decrease]
 *                 example: increase
 *     responses:
 *       200:
 *         description: Service cart updated successfully
 *       400:
 *         description: Invalid action
 *       404:
 *         description: Cart or service not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/booking/update-cart:
 *   patch:
 *     tags:
 *       - User Bookings (👇USER APIs)
 *     summary: Update cart item quantity (set specific value)
 *     description: Update the quantity of a service in the cart to a specific value (set to 0 to remove)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - serviceQuantity
 *             properties:
 *               serviceId:
 *                 type: string
 *                 example: SERV-1733707200000
 *               serviceQuantity:
 *                 type: number
 *                 example: 3
 *                 description: Set to 0 to remove item from cart
 *     responses:
 *       200:
 *         description: Cart updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Cart or service not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/booking/remove-from-cart/{serviceId}:
 *   delete:
 *     tags:
 *       - User Bookings (👇USER APIs)
 *     summary: Remove service from cart
 *     description: Remove a specific service from the cart
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         example: SERV-1733707200000
 *     responses:
 *       200:
 *         description: Service removed from cart successfully
 *       404:
 *         description: Cart or service not found
 *       401:
 *         description: Unauthorized
 */
