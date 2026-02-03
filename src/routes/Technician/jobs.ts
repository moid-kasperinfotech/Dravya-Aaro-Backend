import express from "express";
import { authenticateTechnician } from "../../middlewares/authorisation.js";
import {
    getAssignedJobs,
    getJobDetails,
    acceptJob,
    rejectJob,
    createQuote,
    completeJob,
    collectPayment,
    cancelJob,
} from "../../controllers/Technician/jobController.js";

const router = express.Router();

router.get("/", authenticateTechnician, getAssignedJobs);
router.get("/:jobId", authenticateTechnician, getJobDetails);
router.post("/:jobId/accept", authenticateTechnician, acceptJob);
router.post("/:jobId/reject", authenticateTechnician, rejectJob);
router.post("/:jobId/quote", authenticateTechnician, createQuote);
router.post("/:jobId/complete", authenticateTechnician, completeJob);
router.post("/:jobId/payment", authenticateTechnician, collectPayment);
router.post("/:jobId/cancel", authenticateTechnician, cancelJob);

export default router;
