export default function mongooseISTPlugin(schema) {
    if (!schema.options.timestamps)
        return;
    schema.virtual("createdAtIST").get(function () {
        return this.createdAt
            ? new Date(this.createdAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
            })
            : null;
    });
    schema.virtual("updatedAtIST").get(function () {
        return this.updatedAt
            ? new Date(this.updatedAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
            })
            : null;
    });
    schema.set("toJSON", { virtuals: true });
    schema.set("toObject", { virtuals: true });
}
