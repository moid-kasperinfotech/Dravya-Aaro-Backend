import admin from "../config/firebase.js";
import type { Message } from "firebase-admin/messaging";

interface sendNotificationOptions {
    fcmToken: string;
    device: {
        platform: "android" | "ios";
        priority?: "normal" | "high";
    };
    title: string;
    body: string;
    data?: Record<string, string | number | boolean>;
}

export async function sendNotification({ fcmToken, device, title, body, data = {}, }: sendNotificationOptions): Promise<{ messageId: string; message: string; }> {
    if (typeof fcmToken !== "string" || !fcmToken.trim()) {
        throw new Error("Invalid FCM token");
    }
    if (!device ||
        typeof device.platform !== "string" ||
        !["android", "ios"].includes(device.platform)) {
        throw new Error("Invalid device platform");
    }
    const priority = device.priority === "normal" ? "normal" : "high";

    // ✅ Firebase requires string-only values in data payload
    const stringData: Record<string, string> = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [
            k,
            typeof v === "string" ? v : JSON.stringify(v),
        ])
    );

    const message: Message = {
        token: fcmToken,
        notification: {
            title,
            body,
        },
        data: stringData,
    };
    if (device.platform === "android") {
        message.android = {
            priority,
        };
    }
    if (device.platform === "ios") {
        message.apns = {
            headers: {
                "apns-priority": priority === "high" ? "10" : "5",
            },
            payload: {
                aps: {
                    alert: {
                        title,
                        body,
                    },
                    sound: "default",
                },
            },
        };
    }
    const messageId = await admin.messaging().send(message);
    return {
        messageId,
        message: "Message sent successfully",
    };
}
