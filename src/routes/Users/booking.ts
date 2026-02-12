import express from "express";
import { authenticateUser } from "../../middlewares/authorisation.js";
import { bookServiceController } from "../../controllers/Users/booking.js";

const router = express.Router();

router.post("/", authenticateUser, bookServiceController); // Done

export default router;