import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
  addVendor,
  deleteVendor,
  getVendorDetails,
  getVendorPurchaseHistory,
  getVendors,
  updateVendor,
} from "../../controllers/Vendor/vendorController.js";

/**
 * @swagger
 * tags:
 *   - name: Vendors (👇ADMIN APIs)
 *     description: Vendor management endpoints
 */

/**
 * @swagger
 * /vendor/addVendor:
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
 *               - vendorName
 *               - name
 *               - phoneNumber
 *               - addressLine
 *               - state
 *               - city
 *               - pinCode
 *               - productCategories
 *             properties:
 *               vendorName:
 *                 type: string
 *               name:
 *                 type: string
 *                 description: Contact person name
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               addressLine:
 *                 type: string
 *               state:
 *                 type: string
 *               city:
 *                 type: string
 *               pinCode:
 *                 type: string
 *               productCategories:
 *                 type: array
 *                 items:
 *                   type: string
 *               bankName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               ifscCode:
 *                 type: string
 *               additionalNotes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vendor created successfully
 *       400:
 *         description: Missing or invalid fields
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/getVendors:
 *   get:
 *     tags:
 *       - Vendors
 *     summary: Get all vendors
 *     description: Retrieve list of all vendors
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
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [UNPAID, PARTIAL, PAID]
 *           description: Filter by payment status
 *     responses:
 *       200:
 *         description: Vendors retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/getVendorDetails/{vendorId}:
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
 * /vendor/getVendorPurchaseHistory/{vendorId}:
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
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Vendor history retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/updateVendor/{vendorId}:
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
 *               vendorName:
 *                 type: string
 *               contactPerson.name:
 *                 type: string
 *                 description: Contact person name
 *               contactPerson.phoneNumber:
 *                 type: string
 *               contactPerson.email:
 *                 type: string
 *               address.addressLine:
 *                 type: string
 *               address.state:
 *                 type: string
 *               address.city:
 *                 type: string
 *               address.pinCode:
 *                 type: string
 *               productCategories:
 *                 type: array
 *                 items:
 *                   type: string
 *               bankingInfo.bankName:
 *                 type: string
 *               bankingInfo.accountNumber:
 *                 type: string
 *               bankingInfo.ifscCode:
 *                 type: string
 *               additionalNotes:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Vendor updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
 */

/**
 * @swagger
 * /vendor/deleteVendor/{vendorId}:
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
router.get("/getVendorPurchaseHistory/:vendorId", authenticateAdmin, getVendorPurchaseHistory);

router.put("/updateVendor/:vendorId", authenticateAdmin, updateVendor);
router.delete("/deleteVendor/:vendorId", authenticateAdmin, deleteVendor);

export default router;
