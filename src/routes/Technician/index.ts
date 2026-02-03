import express from "express";
import { authenticateTechnician } from "../../middlewares/authorisation.js";
import {
    getEarnings,
    getPaymentHistory,
    getDailySchedule,
} from "../../controllers/Technician/earningsController.js";

const router = express.Router();

router.get("/", authenticateTechnician, getEarnings);
router.get("/history", authenticateTechnician, getPaymentHistory);
router.get("/schedule", authenticateTechnician, getDailySchedule);

export default router;
