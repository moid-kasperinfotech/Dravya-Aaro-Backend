import mongoose from "mongoose";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import mongooseISTPlugin from "../utils/mongooseIST.plugin.js";
// console.log("✅ Registering global mongoose plugins");
// MUST be before any model import
mongoose.plugin(mongooseISTPlugin);
mongoose.plugin(mongooseLeanVirtuals);
export default mongoose;
