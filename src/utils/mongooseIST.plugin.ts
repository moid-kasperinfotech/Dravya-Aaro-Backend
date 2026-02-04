import type { Schema } from "mongoose";

type TimestampedDoc = {
    createdAt: Date;
    updatedAt: Date;
};

export default function mongooseISTPlugin(schema: Schema) {
    if (!schema.options.timestamps)
        return;
    schema.virtual("createdAtIST").get(function (this: TimestampedDoc) {
        return this.createdAt
            ? new Date(this.createdAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
            })
            : null;
    });
    schema.virtual("updatedAtIST").get(function (this: TimestampedDoc) {
        return this.updatedAt
            ? new Date(this.updatedAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
            })
            : null;
    });
    schema.set("toJSON", { virtuals: true });
    schema.set("toObject", { virtuals: true });
}
