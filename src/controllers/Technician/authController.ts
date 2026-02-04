import Technician from "../../models/Technician/Technician.js";
import { sendOTP } from "../../middlewares/sendSms.js";
import bcrypt from "bcryptjs";
import OtpVerification from "../../models/Users/OtpVerification.js";
import { Request, Response, NextFunction } from "express";
import uploadToCloudinary, { deleteFromCloudinary } from "../../utils/uploadToCloudinary.js";

export const technicianRegister = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            fullName,
            mobileNumber,
            email,
            yearsOfExperience,
            organizationName,
            skillsExpertise,
            languagesKnown,
        } = req.body;

        // Validation
        if (!fullName || !mobileNumber || !email || !yearsOfExperience) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        // Check if technician already exists
        const existingTech = await Technician.findOne({
            $or: [{ mobileNumber }, { email }],
        });
        if (existingTech) {
            return res.status(409).json({
                success: false,
                message: "Email or mobile number already registered",
            });
        }

        // Generate OTP for verification
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        await OtpVerification.findOneAndUpdate(
            { mobileNumber },
            {
                mobileNumber,
                otp: hashedOtp,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
            { upsert: true, new: true }
        );

        // Send OTP
        await sendOTP(mobileNumber, otp);

        // Create technician with pending status
        const technicianId = `TECH-${Date.now()}`;
        const newTechnician = new Technician({
            technicianId,
            fullName,
            mobileNumber,
            email,
            yearsOfExperience,
            organizationName,
            skillsExpertise: skillsExpertise || [],
            languagesKnown: languagesKnown || [],
            registrationStatus: "pending",
        });

        await newTechnician.save();

        console.log("Generated OTP:", otp);

        return res.status(201).json({
            success: true,
            message: "Registration initiated. Please verify OTP.",
            technicianId: newTechnician._id,
            otp: process.env.NODE_ENV === "development" ? otp : "***",
        });
    } catch (err) {
        return next(err);
    }
};

export const verifyTechnicianOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { mobileNumber, otp } = req.body;

        if (!mobileNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: "Mobile number and OTP required",
            });
        }

        // Verify OTP
        const otpRecord = await OtpVerification.findOne({ mobileNumber });
        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "OTP not found or expired",
            });
        }

        if (new Date() > otpRecord.expiresAt) {
            return res.status(400).json({
                success: false,
                message: "OTP expired",
            });
        }

        const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);
        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        // Get technician
        const technician = await Technician.findOne({ mobileNumber });
        if (!technician) {
            return res.status(404).json({
                success: false,
                message: "Technician not found",
            });
        }

        // For now, mark as verified (admin will approve later)
        // technician.isVerified = true;
        await technician.save();

        // Delete OTP record
        await OtpVerification.deleteOne({ mobileNumber });

        const token = technician.generateAuthToken();

        res.cookie("techToken", token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            technicianId: technician._id,
            token,
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

    const { technicianId } = req.params;

    if (!req.files) {
        return res
            .status(400)
            .json({ success: false, message: "No files provided" });
    }

    try {
        const technician = await Technician.findById(technicianId);

        if (!technician) {
            return res.status(404).json({
                success: false,
                message: "Technician not found",
            });
        }

        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };

        const uploadSingleFile = async (file: Express.Multer.File) => {
            return await new Promise<any>(async (resolve, reject) => {
                const fileType: string = file.mimetype.includes("image") ? "image" : "raw";

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

export const updateBankDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { technicianId } = req.params;
        const { accountHolderName, accountNumber, ifscCode, bankName, branchName, upiId } =
            req.body;

        const technician = await Technician.findById(technicianId);
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
            upiId,
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

export const getTechnicianProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const technician = await Technician.findById(req.technicianId).select("-password");

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

export const updateTechnicianStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status } = req.body; // "online", "on_job", "offline", "break"

        if (!["online", "on_job", "offline", "break"].includes(status)) {
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

export const updateLocation = async (req: Request, res: Response, next: NextFunction) => {
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
