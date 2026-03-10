import Technician from "../../models/Technician/Technician.js";
import Job from "../../models/Services/jobs.js";
import { Request, Response, NextFunction } from "express";
import uploadToCloudinary, {
  deleteFromCloudinary,
} from "../../utils/uploadToCloudinary.js";

export const technicianRegister = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      fullName,
      email,
      gender,
      state,
      city,
      address,
      yearsOfExperience,
      organizationNames,
      skillsExpertise,
      languagesKnown,
    } = req.body;

    // Validation
    if (
      (!fullName || !email || !gender || !state || !city || !address) &&
      (!yearsOfExperience ||
        !organizationNames ||
        !skillsExpertise ||
        !languagesKnown)
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if technician already exists
    const technician = await Technician.findById(req.technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    technician.fullName = fullName ? fullName : technician.fullName;
    technician.email = email ? email : technician.email;
    technician.gender = gender ? gender : technician.gender;
    technician.state = state ? state : technician.state;
    technician.city = city ? city : technician.city;
    technician.address = address ? address : technician.address;
    technician.yearsOfExperience = yearsOfExperience
      ? yearsOfExperience
      : technician.yearsOfExperience;
    technician.organizationNames = organizationNames
      ? organizationNames
      : technician.organizationNames;
    technician.skillsExpertise = skillsExpertise
      ? skillsExpertise
      : technician.skillsExpertise;
    technician.languagesKnown = languagesKnown
      ? languagesKnown
      : technician.languagesKnown;

    await technician.save();

    return res.status(200).json({
      success: true,
      message: "Technician profile updated successfully",
    });
  } catch (err) {
    return next(err);
  }
};

export const uploadTechnicianDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let uploadedFiles: string[] = [];

  try {
    const technician = await Technician.findById(req.technicianId);

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    if (!req.files) {
      return res
        .status(400)
        .json({ success: false, message: "No files provided" });
    }

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    if (
      !files.profilePhoto?.[0] ||
      !files.aadhaarFront?.[0] ||
      !files.aadhaarBack?.[0] ||
      !files.panCard?.[0] ||
      !files.drivingLicenseFront?.[0] ||
      !files.drivingLicenseBack?.[0] ||
      !files.vehicleRegistrationFront?.[0] ||
      !files.vehicleRegistrationBack?.[0] ||
      !files.vehicleImageBack?.[0] ||
      !files.vehicleImageFront?.[0]
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Required files not provided" });
    }

    const uploadSingleFile = async (file: Express.Multer.File) => {
      return await new Promise<any>(async (resolve, reject) => {
        const fileType: string = file.mimetype.includes("image")
          ? "image"
          : "raw";

        try {
          const result = await uploadToCloudinary(file, fileType);

          if (!result?.public_id) {
            throw new Error("File upload failed");
          }

          uploadedFiles.push(result.public_id);
          resolve(result);
        } catch (error: any) {
          reject(
            new Error(
              `Error uploading file: ${file.originalname} - ${error.message}`,
            ),
          );
        }
      });
    };

    /* ---------------- PROFILE PHOTO ---------------- */

    if (files.profilePhoto?.[0]) {
      const result = await uploadSingleFile(files.profilePhoto[0]);
      technician.profilePhoto = result.secure_url;
    }

    /* ---------------- AADHAAR ---------------- */

    if (files.aadhaarFront?.[0]) {
      const result = await uploadSingleFile(files.aadhaarFront[0]);
      technician.documents.aadhaar.frontSideurl = result.secure_url;
      technician.documents.aadhaar.verified = false;
      technician.documents.aadhaar.uploadedAt = new Date();
    }

    if (files.aadhaarBack?.[0]) {
      const result = await uploadSingleFile(files.aadhaarBack[0]);
      technician.documents.aadhaar.backSideurl = result.secure_url;
      technician.documents.aadhaar.verified = false;
      technician.documents.aadhaar.uploadedAt = new Date();
    }

    /* ---------------- PAN CARD ---------------- */

    if (files.panCard?.[0]) {
      const result = await uploadSingleFile(files.panCard[0]);
      technician.documents.panCard.url = result.secure_url;
      technician.documents.panCard.verified = false;
      technician.documents.panCard.uploadedAt = new Date();
    }

    /* ---------------- DRIVING LICENSE ---------------- */

    if (files.drivingLicenseFront?.[0]) {
      const result = await uploadSingleFile(files.drivingLicenseFront[0]);
      technician.documents.drivingLicense.frontSideurl = result.secure_url;
      technician.documents.drivingLicense.verified = false;
      technician.documents.drivingLicense.uploadedAt = new Date();
    }

    if (files.drivingLicenseBack?.[0]) {
      const result = await uploadSingleFile(files.drivingLicenseBack[0]);
      technician.documents.drivingLicense.backSideurl = result.secure_url;
      technician.documents.drivingLicense.verified = false;
      technician.documents.drivingLicense.uploadedAt = new Date();
    }

    /* ---------------- VEHICLE REGISTRATION ---------------- */

    if (files.vehicleRegistrationFront?.[0]) {
      const result = await uploadSingleFile(files.vehicleRegistrationFront[0]);
      technician.documents.vehicleRegistration.frontSideurl = result.secure_url;
      technician.documents.vehicleRegistration.verified = false;
      technician.documents.vehicleRegistration.uploadedAt = new Date();
    }

    if (files.vehicleRegistrationBack?.[0]) {
      const result = await uploadSingleFile(files.vehicleRegistrationBack[0]);
      technician.documents.vehicleRegistration.backSideurl = result.secure_url;
      technician.documents.vehicleRegistration.verified = false;
      technician.documents.vehicleRegistration.uploadedAt = new Date();
    }

    /* ---------------- VEHICLE IMAGE ---------------- */

    if (files.vehicleImageFront?.[0]) {
      const result = await uploadSingleFile(files.vehicleImageFront[0]);
      technician.documents.vehicleImage.frontSideurl = result.secure_url;
      technician.documents.vehicleImage.verified = false;
      technician.documents.vehicleImage.uploadedAt = new Date();
    }

    if (files.vehicleImageBack?.[0]) {
      const result = await uploadSingleFile(files.vehicleImageBack[0]);
      technician.documents.vehicleImage.backSideurl = result.secure_url;
      technician.documents.vehicleImage.verified = false;
      technician.documents.vehicleImage.uploadedAt = new Date();
    }

    const response = await technician.save();

    return res.status(200).json({
      success: true,
      message: "Documents uploaded successfully",
      technician: response,
    });
  } catch (err) {
    if (uploadedFiles.length > 0) {
      res.on("finish", async () => {
        for (const publicId of uploadedFiles) {
          try {
            await deleteFromCloudinary(publicId);
          } catch (deleteError) {
            console.error(
              `Failed to delete file with public_id: ${publicId}`,
              deleteError,
            );
          }
        }
      });
    }

    return next(err);
  }
};

export const updateBankDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { accountHolderName, accountNumber, ifscCode, bankName, branchName } =
      req.body;

    if (
      !accountHolderName ||
      !accountNumber ||
      !ifscCode ||
      !bankName ||
      !branchName
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const technician = await Technician.findById(req.technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    technician.bankDetails = {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branchName,
    };

    await technician.save();

    return res.status(200).json({
      success: true,
      message: "Bank details updated successfully",
    });
  } catch (err) {
    return next(err);
  }
};

export const getTechnicianProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const technician = await Technician.findById(req.technicianId).select(
      "-password",
    );

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    return res.status(200).json({
      success: true,
      technician,
    });
  } catch (err) {
    return next(err);
  }
};

export const updateTechnicianStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status } = req.body; // "online", "on_job", "offline"

    if (!["available", "on_job", "offline"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const technician = await Technician.findById(req.technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    technician.currentStatus = status;
    technician.lastActiveAt = new Date();
    await technician.save();

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
    });
  } catch (err) {
    return next(err);
  }
};

export const updateLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude required",
      });
    }

    const technician = await Technician.findById(req.technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    technician.currentLocationCoordinates = {
      latitude,
      longitude,
      lastUpdatedAt: new Date(),
    };
    await technician.save();

    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
    });
  } catch (err) {
    return next(err);
  }
};

export const toggleStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const technician = await Technician.findById(req.technicianId);

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    technician.offDuty = !technician.offDuty;
    await technician.save();

    return res.status(200).json({
      success: true,
      message: `Status updated to ${!technician.offDuty ? "on-duty" : "off-duty"}`,
      offDuty: technician.offDuty,
    });
  } catch (err) {
    return next(err);
  }
};

export const getStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const technician = await Technician.findById(req.technicianId);

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    return res.status(200).json({
      success: true,
      offDuty: technician.offDuty,
      status: technician.offDuty ? "off-duty" : "on-duty",
    });
  } catch (err) {
    return next(err);
  }
};

export const getTodayDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const technician = await Technician.findById(req.technicianId);

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    // Get start and end of today (IST timezone)
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const todayStart = new Date(istTime.getFullYear(), istTime.getMonth(), istTime.getDate(), 0, 0, 0);
    const todayEnd = new Date(istTime.getFullYear(), istTime.getMonth(), istTime.getDate(), 23, 59, 59);

    // Count jobs for today by status
    const newJobsCount = await Job.countDocuments({
      technicianId: req.technicianId,
      status: "assigned",
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const ongoingJobsCount = await Job.countDocuments({
      technicianId: req.technicianId,
      status: "in_progress",
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const completedJobsCount = await Job.countDocuments({
      technicianId: req.technicianId,
      status: "completed",
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    // Calculate total earnings for today (sum of totalPrice for completed jobs)
    const earningsData = await Job.aggregate([
      {
        $match: {
          technicianId: req.technicianId,
          status: "completed",
          createdAt: { $gte: todayStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalEarnings = earningsData.length > 0 ? earningsData[0].totalEarnings : 0;

    // Get rating
    const averageRating = technician.averageRating || 0;

    return res.status(200).json({
      success: true,
      data: {
        todaysJobs: {
          new: newJobsCount,
          ongoing: ongoingJobsCount,
          completed: completedJobsCount,
        },
        totalEarnings,
        rating: averageRating,
      },
    });
  } catch (err) {
    return next(err);
  }
};
