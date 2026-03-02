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

/**
 * @swagger
 * tags:
 *   - name: Vendors
 *     description: Vendor management endpoints
 */

/**
 * @swagger
 * /vendor/vendors/addVendor:
 *   post:
 *     tags:
 *       - Vendors
 *     summary: Add new vendor
 *     description: Create a new vendor account
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
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               businessName:
 *                 type: string
 *               bankDetails:
 *                 type: object
 *     responses:
 *       200:
 *         description: Vendor created successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/vendors/getVendors:
 *   get:
 *     tags:
 *       - Vendors
 *     summary: Get all vendors
 *     description: Retrieve list of all vendors
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
 *         description: Vendors retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/vendors/getVendorDetails/{vendorId}:
 *   get:
 *     tags:
 *       - Vendors
 *     summary: Get vendor details
 *     description: Retrieve details of a specific vendor
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor details retrieved
 *       404:
 *         description: Vendor not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/vendors/vendorHistory/{vendorId}:
 *   get:
 *     tags:
 *       - Vendors
 *     summary: Get vendor history
 *     description: Retrieve transaction/purchase history for a vendor
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Vendor history retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/vendors/updateVendor/{vendorId}:
 *   put:
 *     tags:
 *       - Vendors
 *     summary: Update vendor
 *     description: Update vendor information
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
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
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               businessName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vendor updated
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/vendors/deleteVendor/{vendorId}:
 *   delete:
 *     tags:
 *       - Vendors
 *     summary: Delete vendor
 *     description: Delete a vendor account
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor deleted
 *       401:
 *         description: Unauthorized
 */

const router = express.Router();

router.post("/addVendor", authenticateAdmin, addVendor);
router.get("/getVendors", authenticateAdmin, getVendors);
router.get("/getVendorDetails/:vendorId", authenticateAdmin, getVendorDetails);
router.get("/vendorHistory/:vendorId", authenticateAdmin, vendorHistory);

router.put("/updateVendor/:vendorId", authenticateAdmin, updateVendor);
router.delete("/deleteVendor/:vendorId", authenticateAdmin, deleteVendor);

export default router;
