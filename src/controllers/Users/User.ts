import User from "../../models/Users/User.js";
import { Request, Response, NextFunction } from "express";

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        return res.status(200).json({
            success: true,
            user,
        });
    }
    catch (err) {
        return next(err);
    }
};

export const setFcmToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fcmToken, deviceId, platform } = req.body || {};
        if (typeof fcmToken !== "string" ||
            typeof deviceId !== "string" ||
            typeof platform !== "string") {
            return res.status(400).json({
                success: false,
                message: "fcmToken, deviceId and platform are required",
            });
        }
        const userId = req.userId || req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        // const Model = req.isAdmin ? Admin : User;
        const Model = User;
        await Model.bulkWrite([
            // 1️⃣ Try update existing device
            {
                updateOne: {
                    filter: {
                        _id: userId,
                        "devices.deviceId": deviceId,
                        "devices.platform": platform,
                    },
                    update: {
                        $set: {
                            "devices.$.fcmToken": fcmToken,
                        },
                    },
                },
            },
            // 2️⃣ Insert only if device does not exist
            {
                updateOne: {
                    filter: {
                        _id: userId,
                        devices: {
                            $not: {
                                $elemMatch: { deviceId, platform },
                            },
                        },
                    },
                    update: {
                        $push: {
                            devices: {
                                deviceId,
                                platform,
                                fcmToken,
                            },
                        },
                    },
                },
            },
        ]);
        return res.json({
            success: true,
            message: "FCM token registered successfully",
        });
    }
    catch (error) {
        return next(error);
    }
};
