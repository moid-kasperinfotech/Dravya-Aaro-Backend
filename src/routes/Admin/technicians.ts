import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
    getAllTechnicians,
    getTechnicianDetails,
    approveTechnicianRegistration,
    rejectTechnicianRegistration,
    deactivateTechnician,
    verifyTechnicianDocuments,
} from "../../controllers/Admin/technicianController.js";

const router = express.Router();

router.get("/", authenticateAdmin, getAllTechnicians); 
router.get("/:technicianId", authenticateAdmin, getTechnicianDetails); // (missing jobs and ratings)
router.post("/:technicianId/approve", authenticateAdmin, approveTechnicianRegistration); 
router.post("/:technicianId/reject", authenticateAdmin, rejectTechnicianRegistration); 
router.post("/:technicianId/deactivate", authenticateAdmin, deactivateTechnician); 
router.post("/:technicianId/verify-document", authenticateAdmin, verifyTechnicianDocuments); 

export default router;
