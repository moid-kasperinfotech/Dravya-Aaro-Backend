import { Request, Response, NextFunction } from "express";
import AMCPlan from "../../models/Amc/amcPlan.js";
import AMCPlanSubscription from "../../models/Amc/amcSubscription.js";

// private controller to add amc plan details by admin
export const addAmcPlan = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      planName,
      planDescription,
      price,
      value,
      unit,
      scheduledService,
      sparePartsIncluded,
      emergencyVisits,
      remoteSupport,
      priorityService,
      extendedWarranty,
      additionalBenefits,
      excludedBenefits,
      includedPlanFeatures,
      excludedPlanFeatures,
      isPopular,
      isActive,
      termsAndConditions,
    } = req.body;

    if (
      !planName ||
      !planDescription ||
      price === undefined ||
      value === undefined ||
      !unit ||
      !scheduledService ||
      sparePartsIncluded === undefined ||
      emergencyVisits === undefined ||
      remoteSupport === undefined ||
      priorityService === undefined ||
      extendedWarranty === undefined ||
      isPopular === undefined ||
      isActive === undefined ||
      !termsAndConditions
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingPlan = await AMCPlan.findOne({
      planName: planName.trim().toLowerCase(),
    });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: "Plan already exists",
      });
    }

    // amc plan unit should be either months or years
    if (!["months", "years"].includes(unit)) {
      return res.status(400).json({
        success: false,
        message: "Invalid unit",
      });
    }

    // price and value should be positive numbers
    if (price < 0 || value < 0) {
      return res.status(400).json({
        success: false,
        message: "Price and value should be positive numbers",
      });
    }

    // additional benefits and excluded benefits should be arrays
    if (
      !Array.isArray(additionalBenefits) ||
      !Array.isArray(excludedBenefits) ||
      !Array.isArray(includedPlanFeatures) ||
      !Array.isArray(excludedPlanFeatures)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Additional benefits, excluded benefits, included plan features, and excluded plan features should be arrays",
      });
    }

    // additional benefits and excluded benefits should not be empty
    if (
      additionalBenefits.length === 0 ||
      excludedBenefits.length === 0 ||
      includedPlanFeatures.length === 0 ||
      excludedPlanFeatures.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Additional benefits, excluded benefits, included plan features, and excluded plan features should not be empty",
      });
    }

    const newPlan = AMCPlan.create({
      planName,
      planDescription,
      price,
      duration: {
        value,
        unit,
      },
      planBenefits: {
        scheduledService,
        sparePartsIncluded,
        emergencyVisits,
        remoteSupport,
        priorityService,
        extendedWarranty,
      },
      includedPlanFeatures: includedPlanFeatures.map((feature: string) =>
        feature.trim(),
      ),
      excludedPlanFeatures: excludedPlanFeatures.map((feature: string) =>
        feature.trim(),
      ),
      additionalBenefits: additionalBenefits.map((benefit: string) =>
        benefit.trim(),
      ),
      excludedBenefits: excludedBenefits.map((benefit: string) =>
        benefit.trim(),
      ),
      isPopular,
      isActive,
      termsAndConditions,
    });

    return res.status(201).json({
      success: true,
      message: "Plan added successfully",
      plan: newPlan,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateAmcPlan = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { planId } = req.params;
    const updateData = req.body;

    const amcPlan = await AMCPlan.findById(planId);
    if (!amcPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // If price or value is being updated, validate them
    if (
      (updateData.price !== undefined && updateData.price < 0) ||
      (updateData.duration &&
        updateData.duration.value !== undefined &&
        updateData.duration.value < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Price and value should be positive numbers",
      });
    }

    // If additionalBenefits, excludedBenefits, includedPlanFeatures, or excludedPlanFeatures are being updated, validate them
    if (
      (updateData.additionalBenefits &&
        !Array.isArray(updateData.additionalBenefits)) ||
      (updateData.excludedBenefits &&
        !Array.isArray(updateData.excludedBenefits)) ||
      (updateData.includedPlanFeatures &&
        !Array.isArray(updateData.includedPlanFeatures)) ||
      (updateData.excludedPlanFeatures &&
        !Array.isArray(updateData.excludedPlanFeatures))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Additional benefits, excluded benefits, included plan features, and excluded plan features should be arrays",
      });
    }

    const updatedAmcPlan = await AMCPlan.findByIdAndUpdate(
      planId,
      { ...updateData },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      plan: updatedAmcPlan,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteAmcPlan = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { planId } = req.params;
    const amcPlan = await AMCPlan.findById(planId);
    if (!amcPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // Check if there are any active subscriptions for this plan
    const activeSubcriptions = await AMCPlanSubscription.find({
      planId,
    });

    if (activeSubcriptions.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete AMC plan with active subscriptions",
      });
    }

    amcPlan.isActive = false;
    await amcPlan.save();

    return res.status(200).json({
      success: true,
      message: "Plan deleted successfully",
      plan: amcPlan,
    });
  } catch (error) {
    return next(error);
  }
};

// public controller to get amc plan details by id
export const subscribeAmcPlan = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { planId, brandName, modelName, serialNumber, autoRenewal } =
      req.body;
    if (
      !planId ||
      !brandName ||
      !modelName ||
      !serialNumber ||
      autoRenewal === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Plan ID, device info, and autoRenewal status are required",
      });
    }

    const amcPlan = await AMCPlan.findById(planId);
    if (!amcPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    const subscriptionId = `AMC-${Date.now()}`;

    const durationValue = amcPlan.duration?.value ?? 0;
    const durationUnit = amcPlan.duration?.unit;

    const duration =
      durationUnit === "years"
        ? durationValue * 365 * 24 * 60 * 60 * 1000
        : durationValue * 30 * 24 * 60 * 60 * 1000;

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + duration);

    const newSubscription = await AMCPlanSubscription.create({
      subscriptionId,
      customerId: req.userId,
      planId,
      deviceInfo: {
        brandName: brandName,
        modelName: modelName,
        serialNumber: serialNumber,
      },
      duration: {
        startDate,
        endDate,
      },
      status: "active",
      totalServiceIncluded:
        amcPlan.planBenefits?.scheduledService === "unlimited"
          ? "999"
          : String(amcPlan.planBenefits?.scheduledService),

      payment: {
        paymentStatus: "pending",
      },
      price: amcPlan.price,
      autoRenewal,
    });

    return res.status(201).json({
      success: true,
      message: "Subscribed to AMC plan successfully",
      newSubscription,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAmcDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { planId } = req.params;
    const amcPlan = await AMCPlan.findById(planId);
    if (!amcPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Plan details fetched successfully",
      amcPlan,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllAmcPlans = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const amcPlans = await AMCPlan.find({ isActive: true })
      .sort({
        createdAt: -1,
      })
      .lean();
    return res.status(200).json({
      success: true,
      message: "AMC plans fetched successfully",
      amcPlans,
    });
  } catch (error) {
    return next(error);
  }
};

// private controller to get subcribed amc plan details by customer id
export const getSubscribedAmcPlanDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { customerId } = req.params;
    const subscribedAmc = await AMCPlanSubscription.find({ customerId })
      .populate("planId")
      .populate("serviceHistory.technicianId")
      .sort({ createdAt: -1 })
      .lean();

    if (!subscribedAmc || subscribedAmc.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found for this customer",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subscribed AMC plan details fetched successfully",
      subscribedAmc,
    });
  } catch (error) {
    return next(error);
  }
};

export const renewAmc = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { subscriptionId } = req.params;

    const subscription =
      await AMCPlanSubscription.findById(subscriptionId).populate("planId");
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // Check if subscription is eligible for renewal (e.g., expiring within 30 days or already expired)
    const currentDate = new Date();
    const endDate = new Date(subscription.duration?.endDate || 0);
    const timeToExpiry = endDate.getTime() - currentDate.getTime();
    const daysToExpiry = timeToExpiry / (1000 * 60 * 60 * 24);

    if (daysToExpiry > 7 && subscription.status !== "expired") {
      return res.status(400).json({
        success: false,
        message: "Subscription is not eligible for renewal",
      });
    }
    if (subscription.status === "expired") {
      subscription.status = "pending_renewal";
      await subscription.save();
      return res.status(200).json({
        success: true,
        message: "Subscription marked for renewal. Please proceed to payment.",
        subscription,
      });
    }

    // verify onwership of subscription
    if (subscription.customerId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to renew this subscription",
      });
    }

    // Extend subscription
    const amcPlan = await AMCPlan.findById(subscription.planId);
    if (!amcPlan) {
      return res.status(404).json({
        success: false,
        messsage: "Associated AMC plan not found",
      });
    }

    const durationValue = amcPlan.duration?.value ?? 0;
    const durationUnit = amcPlan.duration?.unit;

    const duration =
      durationUnit === "years"
        ? durationValue * 365 * 24 * 60 * 60 * 1000
        : durationValue * 30 * 24 * 60 * 60 * 1000;

    if (subscription.duration) {
      subscription.duration.endDate = new Date(
        subscription.duration.endDate.getTime() + duration,
      );
    }
    subscription.status = "active";
    subscription.serviceUsed = 0;
    await subscription.save();

    return res.status(200).json({
      success: true,
      message: "AMC subscription renewed successfully",
      subscription,
    });
  } catch (error) {
    return next(error);
  }
};
