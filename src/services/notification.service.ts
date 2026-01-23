import admin from "../config/firebase.js";
export async function sendNotification({ fcmToken, device, title, body, data = {}, }) {
    if (typeof fcmToken !== "string" || !fcmToken.trim()) {
        throw new Error("Invalid FCM token");
    }
    if (!device ||
        typeof device.platform !== "string" ||
        !["android", "ios"].includes(device.platform)) {
        throw new Error("Invalid device platform");
    }
    const priority = device.priority === "normal" ? "normal" : "high";
    const message = {
        token: fcmToken,
        notification: {
            title,
            body,
        },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [
            String(k),
            typeof v === "string" ? v : JSON.stringify(v),
        ])),
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
