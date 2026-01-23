import "./config/mongoose-bootstrap.js";
import express from "express";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import logger from "morgan";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import indexRouter from "./routes/index.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";
import { globalRateLimitOptions } from "./utils/rateLimit.js";
import "./config/firebase.js";
const app = express();
// Mongoose Setup
mongoose
    .connect(process.env.DBURI || "mongodb://localhost:27017/jantaseva")
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));
// Express Setup
app.use(logger("dev"));
app.use(rateLimit(globalRateLimitOptions));
// THEN body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// Use body-parser to parse JSON and URL-encoded data
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.use("/api/v1", indexRouter);
// catch 404 and forward to error handler
app.use((req, res, next) => {
    const error = new Error("Not Found");
    error.status = 404;
    next(error);
});
// Centralized Error Handler
app.use(errorHandler);
export default app;
