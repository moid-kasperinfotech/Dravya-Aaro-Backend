import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/Admin/Admin.js";

dotenv.config();

const createAdmin = async () => {
  try {
    const {
      DBURI,
      ADMIN_NAME,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    } = process.env;

    if (
      !DBURI ||
      !ADMIN_NAME ||
      !ADMIN_EMAIL ||
      !ADMIN_PASSWORD
    ) {
      console.error("❌ Missing required environment variables");
      console.error(
        "Required: DBURI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD"
      );
      process.exit(1);
    }

    if (
      typeof ADMIN_NAME !== "string" ||
      ADMIN_NAME.trim().length < 3
    ) {
      console.error("❌ Full name must be at least 3 characters");
      process.exit(1);
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(String(ADMIN_EMAIL))) {
      console.error("❌ Invalid email address");
      process.exit(1);
    }

    const passwordStr =
      typeof ADMIN_PASSWORD === "string" ? ADMIN_PASSWORD.trim() : "";

    if (passwordStr.length < 8) {
      console.error("❌ Password must be at least 8 characters long");
      process.exit(1);
    }

    if (
      !/[A-Za-z]/.test(passwordStr) ||
      !/\d/.test(passwordStr) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(passwordStr)
    ) {
      console.error(
        "❌ Password must contain at least one letter, one number, and one special character"
      );
      process.exit(1);
    }

    await mongoose.connect(DBURI);
    console.log("✅ Database connected");

    const adminExists = await Admin.exists({});
    if (adminExists) {
      console.log("❌ Admin already exists. Skipping creation.");
      process.exit(0);
    }

    const admin = await Admin.create({
      adminId: `ADM-${Date.now()}`,
      name: ADMIN_NAME.trim(),
      email: ADMIN_EMAIL,
      password: passwordStr,
      lastLoginAt: new Date(),
      role: "admin",
      permissions: ["manage_jobs", "manage_technicians", "manage_inventory"],
    });

    console.log(
      "✅ Admin created successfully from .env file credentials - adminId:",
      admin._id.toString()
    );

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Failed to create admin:", error.message);
    process.exit(1);
  }
};

createAdmin();