import express from "express";
import {
  authenticateAdmin,
  authenticateUser,
} from "../../middlewares/authorisation.js";
import {
  addAmcPlan,
  cancelAmcByAdmin,
  cancelAmcByUser,
  deleteAmcPlan,
  getAllAmcPlans,
  getAllSubscribedAmcUsers,
  getAmcDetails,
  getSubscribedAmcPlanDetails,
  getSubscribedAmcUserDetails,
  renewAmc,
  subscribeAmcPlan,
  updateAmcPlan,
} from "../../controllers/Amc/amcController.js";

const router = express.Router();

// Admin Routes
router.post("/addAMC", authenticateAdmin, addAmcPlan);
router.put("/updateAMC/:planId", authenticateAdmin, updateAmcPlan);
router.get("/allSubsribedUsers", authenticateAdmin, getAllSubscribedAmcUsers);
router.get(
  "/subscribedUserDetails/:subscriptionId",
  authenticateAdmin,
  getSubscribedAmcUserDetails,
);
router.delete("/deleteAMC/:planId", authenticateAdmin, deleteAmcPlan);
router.patch("/cancelAMC/:subscriptionId", authenticateAdmin, cancelAmcByAdmin);

// public routes
router.get("/AMCDetails/:planId", getAmcDetails);
router.get("/allAMC", getAllAmcPlans);

// user routes
router.post("/subscribeAMC/:planId", authenticateUser, subscribeAmcPlan);
router.get("/myAMC", authenticateUser, getSubscribedAmcPlanDetails);
router.post("/renewAMC/:subscriptionId", authenticateUser, renewAmc);
router.patch("/cancelAMC/:subscriptionId", authenticateUser, cancelAmcByUser);

export default router;
