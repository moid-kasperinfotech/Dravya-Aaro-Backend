import AMCPlan from "../../models/AMC/AMCPlan.js";
import AMCSubscription from "../../models/AMC/AMCSubscription.js";
import Payment from "../../models/Common/Payment.js";

export const getAMCPlans = async (req, res, next) => {
    try {
        const plans = await AMCPlan.find({ isActive: true }).sort("price");

        res.status(200).json({
            success: true,
            plans,
        });
    } catch (err) {
        next(err);
    }
};

export const getPlanDetails = async (req, res, next) => {
    try {
        const { planId } = req.params;

        const plan = await AMCPlan.findById(planId);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found",
            });
        }

        res.status(200).json({
            success: true,
            plan,
        });
    } catch (err) {
        next(err);
    }
};

export const subscribeAMC = async (req, res, next) => {
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

        res.status(201).json({
            success: true,
            message: "AMC subscribed successfully",
            subscription: newSubscription,
        });
    } catch (err) {
        next(err);
    }
};

export const getUserAMCSubscriptions = async (req, res, next) => {
    try {
        const subscriptions = await AMCSubscription.find({
            customerId: req.userId,
        })
            .populate("planId")
            .sort("-createdAt");

        res.status(200).json({
            success: true,
            subscriptions,
        });
    } catch (err) {
        next(err);
    }
};

export const getAMCDetails = async (req, res, next) => {
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
        if (subscription.customerId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        res.status(200).json({
            success: true,
            subscription,
        });
    } catch (err) {
        next(err);
    }
};

export const renewAMC = async (req, res, next) => {
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
        if (subscription.customerId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        // Extend subscription
        const plan = await AMCPlan.findById(subscription.planId);
        const durationMs =
            plan.duration.unit === "years"
                ? plan.duration.value * 365 * 24 * 60 * 60 * 1000
                : plan.duration.value * 30 * 24 * 60 * 60 * 1000;

        subscription.endDate = new Date(subscription.endDate.getTime() + durationMs);
        subscription.status = "active";
        subscription.servicesUsed = 0; // Reset for new period
        await subscription.save();

        res.status(200).json({
            success: true,
            message: "AMC renewed successfully",
            subscription,
        });
    } catch (err) {
        next(err);
    }
};
