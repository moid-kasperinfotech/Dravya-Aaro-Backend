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

const router = express.Router();

router.post("/login", login); // Done
router.post("/verify-otp", verifyOtp); // Done
router.post("/register", authenticateTechnician, technicianRegister); // Done
router.get("/profile", authenticateTechnician, getTechnicianProfile); // Done
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
]), uploadTechnicianDocuments); // Done
router.post("/:technicianId/bank-details", authenticateTechnician, updateBankDetails); // Done
router.post("/status", authenticateTechnician, updateTechnicianStatus); // Done
router.post("/location", authenticateTechnician, updateLocation); // Done

export default router;
