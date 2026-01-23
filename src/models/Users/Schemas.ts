import mongoose from "mongoose";

export const deviceSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
    },
    fcmToken: {
        type: String,
        required: true,
    },
    platform: {
        type: String,
        enum: ["android", "ios"],
        required: true,
    }
}, { timestamps: true, _id: false });
