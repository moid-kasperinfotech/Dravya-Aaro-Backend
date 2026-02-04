import AMCPlan from "../../models/AMC/AMCPlan.js";
import AMCSubscription from "../../models/AMC/AMCSubscription.js";
import { Request, Response, NextFunction } from "express";

export const getAMCPlans = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const plans = await AMCPlan.find({ isActive: true }).sort("price");

        return res.status(200).json({
            success: true,
            plans,
        });
    } catch (err) {
        return next(err);
    }
};

export const getPlanDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { planId } = req.params;

        const plan = await AMCPlan.findById(planId);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found",
            });
        }

        return res.status(200).json({
            success: true,
            plan,
        });
    } catch (err) {
        return next(err);
    }
};

export const subscribeAMC = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { planId, deviceInfo } = req.body;

        if (!planId || !deviceInfo) {
            return res.status(400).json({
                success: false,
                message: "Plan ID and device info required",
            });
        }

        const plan = await AMCPlan.findById(planId);
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found",
            });
        }

        // Generate subscription ID
        const subscriptionId = `AMC-${Date.now()}`;

        // Create subscription
        const startDate = new Date();
        const durationMs =
            plan.duration.unit === "years"
                ? plan.duration.value * 365 * 24 * 60 * 60 * 1000
                : plan.duration.value * 30 * 24 * 60 * 60 * 1000;
        const endDate = new Date(startDate.getTime() + durationMs);

        const newSubscription = new AMCSubscription({
            subscriptionId,
            customerId: req.userId,
            planId,
            deviceInfo,
            startDate,
            endDate,
            status: "active",
            price: plan.price,
            totalServicesIncluded: plan.scheduledServices === "unlimited" ? 999 : plan.scheduledServices,
        });

        await newSubscription.save();

        // TODO: Create payment transaction

        return res.status(201).json({
            success: true,
            message: "AMC subscribed successfully",
            subscription: newSubscription,
        });
    } catch (err) {
        return next(err);
    }
};

export const getUserAMCSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const subscriptions = await AMCSubscription.find({
            customerId: req.userId,
        })
            .populate("planId")
            .sort("-createdAt");

        return res.status(200).json({
            success: true,
            subscriptions,
        });
    } catch (err) {
        return next(err);
    }
};

export const getAMCDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { subscriptionId } = req.params;

        const subscription = await AMCSubscription.findById(subscriptionId)
            .populate("planId")
            .populate("paymentId");

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found",
            });
        }

        // Verify ownership
        if (subscription.customerId.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        return res.status(200).json({
            success: true,
            subscription,
        });
    } catch (err) {
        return next(err);
    }
};

export const renewAMC = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { subscriptionId } = req.params;

        const subscription = await AMCSubscription.findById(subscriptionId);
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found",
            });
        }

        // Verify ownership
        if (subscription.customerId.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        // Extend subscription
        const plan = await AMCPlan.findById(subscription.planId);
        if (!plan) { 
            return res.status(404).json({
                success: false,
                message: "Plan not found",
            });
        }
        const durationMs =
            plan.duration.unit === "years"
                ? plan.duration.value * 365 * 24 * 60 * 60 * 1000
                : plan.duration.value * 30 * 24 * 60 * 60 * 1000;

        subscription.endDate = new Date(subscription.endDate.getTime() + durationMs);
        subscription.status = "active";
        subscription.servicesUsed = 0; // Reset for new period
        await subscription.save();

        return res.status(200).json({
            success: true,
            message: "AMC renewed successfully",
            subscription,
        });
    } catch (err) {
        return next(err);
    }
};
