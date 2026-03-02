import { deleteServiceByIdController, getAllServicesController, getServiceByIdController, getServiceCountController, servicePostController } from "../../controllers/Admin/service.js";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import upload from "../../middlewares/multer.js";
import express from "express";

const router = express.Router();

router.patch("/", authenticateAdmin, upload.single("image"), servicePostController); // Done

router.get("/count", authenticateAdmin, getServiceCountController); // Done

router.get("/", authenticateAdmin, getAllServicesController); // filter required

router.get("/:serviceId", authenticateAdmin, getServiceByIdController); // Done

router.delete("/:serviceId", authenticateAdmin, deleteServiceByIdController); // Done

export default router;