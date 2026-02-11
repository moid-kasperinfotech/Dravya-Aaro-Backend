import { getAllServicesUserController, getReviewsByServiceIdUserController, getServiceByIdUserController } from "../../controllers/Users/service.js";
import { authenticateUser } from "../../middlewares/authorisation.js";

const express = require("express");

const router = express.Router();

router.get("/", authenticateUser, getAllServicesUserController); // filter required

router.get("/:serviceId", authenticateUser, getServiceByIdUserController); // Done

router.get("/:serviceId/reviews", authenticateUser, getReviewsByServiceIdUserController); // Done

export default router;