import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
    getAllTechnicians,
    getTechnicianDetails,
    approveTechnicianRegistration,
    rejectTechnicianRegistration,
    deactivateTechnician,
    verifyTechnicianDocuments,
    getTechnicianRatings,
} from "../../controllers/Admin/technicianController.js";

const router = express.Router();

router.get("/", authenticateAdmin, getAllTechnicians); // Done
router.get("/:technicianId", authenticateAdmin, getTechnicianDetails); // Done
router.post("/:technicianId/approve", authenticateAdmin, approveTechnicianRegistration); // Done
router.post("/:technicianId/reject", authenticateAdmin, rejectTechnicianRegistration); // Done
router.post("/:technicianId/deactivate", authenticateAdmin, deactivateTechnician); // Done
router.post("/:technicianId/verify-document", authenticateAdmin, verifyTechnicianDocuments); // Done

router.get("/:technicianId/rating", authenticateAdmin, getTechnicianRatings); // Done

export default router;
