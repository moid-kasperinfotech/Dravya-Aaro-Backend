/**
 * MongoDB Seed Script for Admin Dashboard Testing
 * Creates sample jobs, quotations, technicians, and users for testing
 * 
 * Run with: npx ts-node src/tests/seed.ts
 * Or: node dist/tests/seed.js (after build)
 */

import mongoose from "mongoose";
import Job from "../models/Services/jobs.js";
import Quotation from "../models/Services/quotation.js";
import Technician from "../models/Technician/Technician.js";
import User from "../models/Users/User.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/darvya-aaro";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
};

async function seedDatabase() {
  try {
    log.info(`Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    log.success("Connected to MongoDB");

    // Clear existing test data
    log.info("Clearing existing test data...");
    await Job.deleteMany({ jobId: { $regex: "TEST-" } });
    await Quotation.deleteMany({ quotationId: { $regex: "QT-TEST-" } });
    await Technician.deleteMany({ technicianId: { $regex: "TECH-TEST-" } });
    await User.deleteMany({ email: { $regex: "test-" } });
    log.success("Test data cleared");

    // ========================================================================
    // Create Sample Users
    // ========================================================================
    log.info("Creating sample users...");
    const users = await User.insertMany([
      {
        name: "Priya Sharma",
        email: "test-priya@darvya.com",
        mobileNumber: "+919876543210",
        addresses: [
          {
            house_apartment: "B-105",
            street_sector: "Sunshine Tower, Dwarka",
            landmark: "Near Metro Station",
            fullName: "Priya Sharma",
            mobileNumber: "+919876543210",
          },
        ],
        isActive: true,
      },
      {
        name: "Ravi Kumar",
        email: "test-ravi@darvya.com",
        mobileNumber: "+919876543211",
        addresses: [
          {
            house_apartment: "A-201",
            street_sector: "Green Park Colony",
            landmark: "Opposite School",
            fullName: "Ravi Kumar",
            mobileNumber: "+919876543211",
          },
        ],
        isActive: true,
      },
      {
        name: "Anjali Patel",
        email: "test-anjali@darvya.com",
        mobileNumber: "+919876543212",
        addresses: [
          {
            house_apartment: "301",
            street_sector: "Tech Park Apartments",
            landmark: "Near Mall",
            fullName: "Anjali Patel",
            mobileNumber: "+919876543212",
          },
        ],
        isActive: true,
      },
    ]);
    log.success(`Created ${users.length} test users`);

    // ========================================================================
    // Create Sample Technicians
    // ========================================================================
    log.info("Creating sample technicians...");
    const technicians = await Technician.insertMany([
      {
        technicianId: "TECH-TEST-001",
        fullName: "Ramesh Kumar",
        email: "test-tech-ramesh@darvya.com",
        mobileNumber: "+919876543220",
        currentStatus: "available",
        isActive: true,
        isVerified: true,
        registrationStatus: "approved",
        approvedAt: new Date(),
        yearsOfExperience: 5,
        skillsExpertise: ["RO Installation", "RO Repair", "Water Purifier Maintenance"],
        totalJobsCompleted: 150,
        totalEarnings: 75000,
        averageRating: 4.5,
        totalReviews: 45,
        isBlacklisted: false,
        offDuty: false,
        autoPickupEnabled: true,
        accountType: "freelance",
        maxJobsPerDay: 5,
      },
      {
        technicianId: "TECH-TEST-002",
        fullName: "Suresh Singh",
        email: "test-tech-suresh@darvya.com",
        mobileNumber: "+919876543221",
        currentStatus: "available",
        isActive: true,
        isVerified: true,
        registrationStatus: "approved",
        approvedAt: new Date(),
        yearsOfExperience: 8,
        skillsExpertise: ["RO Installation", "Installation", "Relocation"],
        totalJobsCompleted: 280,
        totalEarnings: 145000,
        averageRating: 4.8,
        totalReviews: 92,
        isBlacklisted: false,
        offDuty: false,
        autoPickupEnabled: true,
        accountType: "salaried",
        maxJobsPerDay: 8,
      },
      {
        technicianId: "TECH-TEST-003",
        fullName: "Vikram Patel",
        email: "test-tech-vikram@darvya.com",
        mobileNumber: "+919876543222",
        currentStatus: "offline",
        isActive: true,
        isVerified: true,
        registrationStatus: "approved",
        approvedAt: new Date(),
        yearsOfExperience: 3,
        skillsExpertise: ["RO Repair"],
        totalJobsCompleted: 60,
        totalEarnings: 28000,
        averageRating: 4.2,
        totalReviews: 20,
        isBlacklisted: false,
        offDuty: false,
        autoPickupEnabled: true,
        accountType: "freelance",
        maxJobsPerDay: 3,
      },
    ]);
    log.success(`Created ${technicians.length} test technicians`);

    // ========================================================================
    // Create Sample Jobs with different statuses
    // ========================================================================
    log.info("Creating sample jobs...");

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const jobs = await Job.insertMany([
      {
        jobId: "TEST-JOB-001",
        jobName: "Water Purifier Installation",
        userId: users[0]._id,
        technicianId: technicians[0]._id,
        status: "pending",
        jobType: "service",
        brandName: "Kent",
        modelType: "Kent Maxx",
        problems: ["Low water pressure", "Unusual noise"],
        remarkByUser: "Installation needed ASAP",
        imageByUser: {
          url: "https://cloudinary.com/test1.jpg",
          public_id: "test1",
        },
        preferredDate: {
          startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          duration: 120,
        },
        address: {
          house_apartment: "B-105",
          street_sector: "Sunshine Tower, Dwarka",
          landmark: "Near Metro Station",
          fullName: "Priya Sharma",
        },
        services: [],
        totalPrice: 2500,
        totalDuration: 120,
        paymentStatus: "unpaid",
        createdAt: now,
        steps: [
          {
            stepId: "STEP-1",
            stepName: "Job Created",
            stepDescription: "Job created by user",
            createdAt: now,
          },
        ],
      },
      {
        jobId: "TEST-JOB-002",
        jobName: "RO System Repair",
        userId: users[1]._id,
        technicianId: technicians[0]._id,
        status: "assigned",
        jobType: "service",
        brandName: "Kent",
        modelType: "Kent Supreme",
        problems: ["Leakage detected"],
        remarkByUser: "Urgent repair needed",
        imageByUser: {
          url: "https://cloudinary.com/test2.jpg",
          public_id: "test2",
        },
        preferredDate: {
          startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
          duration: 90,
        },
        address: {
          house_apartment: "A-201",
          street_sector: "Green Park Colony",
          landmark: "Opposite School",
          fullName: "Ravi Kumar",
        },
        services: [],
        totalPrice: 1500,
        totalDuration: 90,
        paymentStatus: "prepaid",
        paidAt: oneDayAgo,
        assignedAt: oneDayAgo,
        createdAt: twoDaysAgo,
        steps: [
          {
            stepId: "STEP-1",
            stepName: "Job Created",
            stepDescription: "Job created by user",
            createdAt: twoDaysAgo,
          },
          {
            stepId: "STEP-2",
            stepName: "Assigned",
            stepDescription: "Job assigned to technician",
            createdAt: oneDayAgo,
          },
        ],
      },
      {
        jobId: "TEST-JOB-003",
        jobName: "Water Purifier Relocation",
        userId: users[2]._id,
        technicianId: technicians[1]._id,
        status: "in_progress",
        jobType: "relocation",
        brandName: "Aquaguard",
        modelType: "Aquaguard Geneus",
        problems: [],
        remarkByUser: "Moving to new apartment",
        imageByUser: {
          url: "https://cloudinary.com/test3.jpg",
          public_id: "test3",
        },
        preferredDate: {
          startTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),
          duration: 180,
        },
        address: {
          house_apartment: "301",
          street_sector: "Tech Park Apartments",
          landmark: "Near Mall",
          fullName: "Anjali Patel",
        },
        addresses: [
          {
            location: "primary",
            address: {
              house_apartment: "301",
              street_sector: "Tech Park Apartments",
              landmark: "Near Mall",
              fullName: "Anjali Patel",
            },
          },
          {
            location: "secondary",
            address: {
              house_apartment: "502",
              street_sector: "New Tech Park Tower",
              landmark: "Next to Park",
              fullName: "Anjali Patel",
            },
          },
        ],
        services: [],
        totalPrice: 3500,
        totalDuration: 180,
        paymentStatus: "cash_collection",
        paymentCollectionStatus: "pending",
        collectionDeadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        assignedAt: sevenDaysAgo,
        currentOtpStep: 1,
        stepStatuses: {
          uninstall: { started: true, startedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
          install: { started: false },
        },
        createdAt: sevenDaysAgo,
        steps: [
          {
            stepId: "STEP-1",
            stepName: "Job Created",
            stepDescription: "Relocation job created",
            createdAt: sevenDaysAgo,
          },
          {
            stepId: "STEP-2",
            stepName: "Started",
            stepDescription: "Technician started job",
            createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          },
        ],
      },
      {
        jobId: "TEST-JOB-004",
        jobName: "Annual Maintenance",
        userId: users[0]._id,
        technicianId: null,
        status: "pending",
        jobType: "service",
        brandName: "Blue Star",
        modelType: "Blue Star Excel",
        problems: ["Annual checkup needed"],
        remarkByUser: "Scheduled maintenance",
        imageByUser: {
          url: "https://cloudinary.com/test4.jpg",
          public_id: "test4",
        },
        preferredDate: {
          startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          duration: 60,
        },
        address: {
          house_apartment: "B-105",
          street_sector: "Sunshine Tower, Dwarka",
          landmark: "Near Metro Station",
          fullName: "Priya Sharma",
        },
        services: [],
        totalPrice: 800,
        totalDuration: 60,
        paymentStatus: "unpaid",
        createdAt: now,
        steps: [],
      },
      {
        jobId: "TEST-JOB-005",
        jobName: "Installation Service",
        userId: users[1]._id,
        technicianId: technicians[1]._id,
        status: "completed",
        jobType: "installation",
        brandName: "Livpure",
        modelType: "Livpure Touch",
        problems: [],
        remarkByUser: "New installation",
        imageByUser: {
          url: "https://cloudinary.com/test5.jpg",
          public_id: "test5",
        },
        preferredDate: {
          startTime: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
          duration: 120,
        },
        address: {
          house_apartment: "A-201",
          street_sector: "Green Park Colony",
          landmark: "Opposite School",
          fullName: "Ravi Kumar",
        },
        services: [],
        totalPrice: 2200,
        totalDuration: 120,
        paymentStatus: "collected",
        paymentCollectionStatus: "collected",
        collectedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        assignedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        ratingByTechnician: {
          rating: 5,
          additionalComment: "Great customer, easy job",
        },
        steps: [
          {
            stepId: "STEP-1",
            stepName: "Completed",
            stepDescription: "Job completed successfully",
            createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    ]);
    log.success(`Created ${jobs.length} test jobs with various statuses`);

    // ========================================================================
    // Create Sample Quotations (linked to jobs)
    // ========================================================================
    log.info("Creating sample quotations...");

    const quotations = await Quotation.insertMany([
      {
        quotationId: "QT-TEST-001",
        jobId: jobs[0]._id,
        userId: users[0]._id,
        technicianId: technicians[0]._id,
        status: "pending",
        lineItems: [
          {
            itemId: "ITEM-1",
            description: "Kent Maxx Water Purifier Installation",
            category: "part",
            quantity: 1,
            unitPrice: 1800,
            totalPrice: 1800,
            warranty: {
              duration: 12,
              type: "months",
              expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
            },
            notes: "Original equipment",
          },
          {
            itemId: "ITEM-2",
            description: "Installation Labor",
            category: "labor",
            quantity: 1,
            unitPrice: 700,
            totalPrice: 700,
            notes: "Onsite installation",
          },
        ],
        pricingBreakdown: {
          subTotal: 2500,
          gst: 450,
          gstPercentage: 18,
          discount: 0,
          discountPercentage: 0,
          total: 2950,
        },
        validityDays: 7,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        adminNotes: "Standard installation quotation",
        termsAndConditions: "Payment due on completion",
        createdAt: now,
      },
      {
        quotationId: "QT-TEST-002",
        jobId: jobs[2]._id,
        userId: users[2]._id,
        technicianId: technicians[1]._id,
        status: "approved",
        lineItems: [
          {
            itemId: "ITEM-3",
            description: "Uninstallation Service",
            category: "labor",
            quantity: 1,
            unitPrice: 1200,
            totalPrice: 1200,
          },
          {
            itemId: "ITEM-4",
            description: "Installation Service",
            category: "labor",
            quantity: 1,
            unitPrice: 1200,
            totalPrice: 1200,
          },
          {
            itemId: "ITEM-5",
            description: "Transportation",
            category: "custom_charge",
            quantity: 1,
            unitPrice: 1100,
            totalPrice: 1100,
          },
        ],
        pricingBreakdown: {
          subTotal: 3500,
          gst: 630,
          gstPercentage: 18,
          discount: 0,
          discountPercentage: 0,
          total: 4130,
        },
        validityDays: 7,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        approvedBy: "user",
        adminNotes: "Relocation quotation - approved by customer",
        termsAndConditions: "Payment due on completion",
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    ]);
    log.success(`Created ${quotations.length} sample quotations`);

    // Link quotations to jobs
    await Job.updateOne({ _id: jobs[0]._id }, { quotationId: quotations[0]._id });
    await Job.updateOne({ _id: jobs[2]._id }, { quotationId: quotations[1]._id });
    log.success("Linked quotations to jobs");

    // ========================================================================
    // Print Summary
    // ========================================================================
    console.log(`\n${colors.blue}${"=".repeat(80)}${colors.reset}`);
    console.log(`${colors.green}DATABASE SEEDING COMPLETE${colors.reset}`);
    console.log(`${colors.blue}${"=".repeat(80)}${colors.reset}\n`);

    console.log(
      `${colors.green}Created Test Data:${colors.reset}\n` +
        `  Users: ${users.length}\n` +
        `  Technicians: ${technicians.length}\n` +
        `  Jobs: ${jobs.length}\n` +
        `  Quotations: ${quotations.length}\n`
    );

    console.log(`${colors.yellow}Test Data IDs:${colors.reset}\n`);
    console.log("Sample Job IDs for testing:");
    jobs.forEach((job) => {
      console.log(
        `  - ${job.jobId} (Status: ${job.status}) → ObjectId: ${job._id}`
      );
    });

    console.log("\nSample Technician IDs:");
    technicians.forEach((tech) => {
      console.log(
        `  - ${tech.technicianId} (Status: ${tech.currentStatus}) → ObjectId: ${tech._id}`
      );
    });

    console.log("\nSample User Emails:");
    users.forEach((user) => {
      console.log(`  - ${user.email} → ObjectId: ${user._id}`);
    });

    console.log(`\n${colors.yellow}Next Steps:${colors.reset}`);
    console.log("1. Start the server: npm run dev");
    console.log("2. Test the dashboard endpoints:");
    console.log("   - GET /api/v1/admin/dashboard/today-stats");
    console.log("   - GET /api/v1/admin/dashboard/job-stats");
    console.log("   - GET /api/v1/admin/dashboard/live-jobs");
    console.log("   - GET /api/v1/admin/dashboard/quotation/{jobId}");
    console.log("   (Replace {jobId} with the ObjectId from output above)");
    console.log("3. Run the test script: npx ts-node src/tests/dashboard.test.ts\n");

    await mongoose.disconnect();
    log.success("Disconnected from MongoDB");
  } catch (error) {
    log.error(`Seeding failed: ${error}`);
    process.exit(1);
  }
}

seedDatabase();
