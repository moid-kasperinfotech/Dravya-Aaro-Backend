import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
    getAllJobs,
    getJobDetails,
    assignTechnician,
    reassignJob,
    rescheduleJob,
    cancelJob,
} from "../../controllers/Admin/jobController.js";

const router = express.Router();

router.get("/", authenticateAdmin, getAllJobs); // Done
router.get("/:jobId", authenticateAdmin, getJobDetails); // Done
router.post("/:jobId/assign", authenticateAdmin, assignTechnician); // Done
router.post("/:jobId/reassign", authenticateAdmin, reassignJob); 
router.post("/:jobId/reschedule", authenticateAdmin, rescheduleJob); 
router.post("/:jobId/cancel", authenticateAdmin, cancelJob); 

export default router;
