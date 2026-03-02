import express from "express";
import { authenticateTechnician } from "../../middlewares/authorisation.js";
import {
    technicianRegister,
    uploadTechnicianDocuments,
    updateBankDetails,
    getTechnicianProfile,
    updateTechnicianStatus,
    updateLocation,
} from "../../controllers/Technician/authController.js";
import upload from "../../middlewares/multer.js";
import { login, verifyOtp } from "../../controllers/Users/auth.js";

/**
 * @swagger
 * tags:
 *   - name: Technician Auth
 *     description: Technician authentication and registration endpoints
 */

/**
 * @swagger
 * /technician/auth/login:
 *   post:
 *     tags:
 *       - Technician Auth
 *     summary: Technician login
 *     description: Login with phone/email and get OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /technician/auth/verify-otp:
 *   post:
 *     tags:
 *       - Technician Auth
 *     summary: Verify OTP
 *     description: Verify OTP to complete login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid OTP
 */

/**
 * @swagger
 * /technician/auth/register:
 *   post:
 *     tags:
 *       - Technician Auth
 *     summary: Register technician
 *     description: Complete technician registration
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
 *               serviceCategoryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration successful
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/auth/profile:
 *   get:
 *     tags:
 *       - Technician Auth
 *     summary: Get technician profile
 *     description: Retrieve authenticated technician's profile
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/auth/{technicianId}/documents:
 *   post:
 *     tags:
 *       - Technician Auth
 *     summary: Upload documents
 *     description: Upload required verification documents
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               aadhaarFront:
 *                 type: string
 *                 format: binary
 *               aadhaarBack:
 *                 type: string
 *                 format: binary
 *               panCard:
 *                 type: string
 *                 format: binary
 *               drivingLicenseFront:
 *                 type: string
 *                 format: binary
 *               drivingLicenseBack:
 *                 type: string
 *                 format: binary
 *               vehicleRegistrationFront:
 *                 type: string
 *                 format: binary
 *               vehicleRegistrationBack:
 *                 type: string
 *                 format: binary
 *               vehicleImage:
 *                 type: string
 *                 format: binary
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/auth/{technicianId}/bank-details:
 *   post:
 *     tags:
 *       - Technician Auth
 *     summary: Update bank details
 *     description: Add/update bank account information
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
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
 *               - accountNumber
 *               - bankName
 *               - ifscCode
 *             properties:
 *               accountNumber:
 *                 type: string
 *               bankName:
 *                 type: string
 *               ifscCode:
 *                 type: string
 *               accountHolderName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bank details updated
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/auth/status:
 *   post:
 *     tags:
 *       - Technician Auth
 *     summary: Update technician status
 *     description: Update online/offline and availability status
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isOnline:
 *                 type: boolean
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/auth/location:
 *   post:
 *     tags:
 *       - Technician Auth
 *     summary: Update location
 *     description: Update technician's current location
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location updated
 *       401:
 *         description: Unauthorized
 */

const router = express.Router();

router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/register", authenticateTechnician, technicianRegister);
router.get("/profile", authenticateTechnician, getTechnicianProfile);
router.post("/:technicianId/documents", authenticateTechnician, upload.fields([
    { name: "aadhaarFront", maxCount: 1 },
    { name: "aadhaarBack", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "drivingLicenseFront", maxCount: 1 },
    { name: "drivingLicenseBack", maxCount: 1 },
    { name: "vehicleRegistrationFront", maxCount: 1 },
    { name: "vehicleRegistrationBack", maxCount: 1 },
    { name: "vehicleImage", maxCount: 1 },
    { name: "profilePhoto", maxCount: 1 },
]), uploadTechnicianDocuments);
router.post("/:technicianId/bank-details", authenticateTechnician, updateBankDetails);
router.post("/status", authenticateTechnician, updateTechnicianStatus);
router.post("/location", authenticateTechnician, updateLocation);

export default router;
