import express from "express";
import { authenticateUser } from "../../middlewares/authorisation.js";
import { bookServiceController, getHistoryJobController, getOngoingJobController } from "../../controllers/Users/booking.js";

const router = express.Router();

router.post("/", authenticateUser, bookServiceController); // Done
router.get("/job", authenticateUser, getOngoingJobController); // Done
router.get("/job/history", authenticateUser, getHistoryJobController); // Done

export default router;