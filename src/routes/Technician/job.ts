import express from "express";
import { authenticateTechnician } from "../../middlewares/authorisation.js";
import { acceptJobController, cancelJobController, completeJobController, completePaymentCashController, getJobByIdController, getJobController, ratingByTechnicianController, reachedJobController, rescheduleJobController, startJobController } from "../../controllers/Technician/jobController.js";

const router = express.Router();

router.get("/", authenticateTechnician, getJobController); // Done
router.post("/:jobId", authenticateTechnician, getJobByIdController); // Done
router.post("/:jobId/accept", authenticateTechnician, acceptJobController); // Done
router.post("/:jobId/cancel", authenticateTechnician, cancelJobController); // Done
router.post("/:jobId/reschedule", authenticateTechnician, rescheduleJobController); // Done
router.post("/:jobId/reached", authenticateTechnician, reachedJobController); // Done
router.post("/:jobId/start", authenticateTechnician, startJobController); // Done
router.post("/:jobId/complete", authenticateTechnician, completeJobController); // Done
router.post("/:jobId/complete/payment/cash", authenticateTechnician, completePaymentCashController); // Done
router.post("/:jobId/complete/rating", authenticateTechnician, ratingByTechnicianController ); // Done

export default router;