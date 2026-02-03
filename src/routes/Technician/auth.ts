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

const router = express.Router();

router.post("/register", technicianRegister);
router.post("/verify-otp", verifyTechnicianOtp);
router.get("/profile", authenticateTechnician, getTechnicianProfile);
router.post("/:technicianId/documents", authenticateTechnician, uploadTechnicianDocuments);
router.post("/:technicianId/bank-details", authenticateTechnician, updateBankDetails);
router.post("/status", authenticateTechnician, updateTechnicianStatus);
router.post("/location", authenticateTechnician, updateLocation);

export default router;
