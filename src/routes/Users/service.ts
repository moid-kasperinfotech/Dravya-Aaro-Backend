import { getAllServicesUserController, getReviewsByServiceIdUserController, getServiceByIdUserController } from "../../controllers/Users/service.js";
import { authenticateUser } from "../../middlewares/authorisation.js";
import express from "express";

const router = express.Router();

router.get("/", authenticateUser, getAllServicesUserController);

router.get("/:serviceId", authenticateUser, getServiceByIdUserController);

router.get("/:serviceId/reviews", authenticateUser, getReviewsByServiceIdUserController);

export default router;