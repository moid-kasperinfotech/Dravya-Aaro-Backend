import express from "express";
import { authenticateTechnician } from "../../middlewares/authorisation.js";
import {
    technicianRegister,
    verifyTechnicianOtp,
    uploadTechnicianDocuments,
    updateBankDetails,
    getTechnicianProfile,
    updateTechnicianStatus,
    updateLocation,
} from "../../controllers/Technician/authController.js";
import upload from "../../middlewares/multer.js";

const router = express.Router();

router.post("/register", technicianRegister);
router.post("/verify-otp", verifyTechnicianOtp);
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
