import Technician from "../../models/Technician/Technician.js";
import { sendOTP } from "../../middlewares/sendSms.js";
import bcrypt from "bcryptjs";
import OtpVerification from "../../models/Users/OtpVerification.js";

export const technicianRegister = async (req, res, next) => {
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

        res.status(201).json({
            success: true,
            message: "Registration initiated. Please verify OTP.",
            technicianId: newTechnician._id,
            otp: process.env.NODE_ENV === "development" ? otp : "***",
        });
    } catch (err) {
        next(err);
    }
};

export const verifyTechnicianOtp = async (req, res, next) => {
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

        res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            technicianId: technician._id,
            token,
        });
    } catch (err) {
        next(err);
    }
};

export const uploadTechnicianDocuments = async (req, res, next) => {
    try {
        const { technicianId } = req.params;
        const {
            profilePhoto,
            aadhaar,
            panCard,
            drivingLicense,
            vehicleRegistration,
        } = req.body;

        const technician = await Technician.findById(technicianId);
        if (!technician) {
            return res.status(404).json({
                success: false,
                message: "Technician not found",
            });
        }

        if (profilePhoto) technician.profilePhoto = profilePhoto;
        if (aadhaar) technician.documents.aadhaar = { url: aadhaar, uploadedAt: new Date() };
        if (panCard) technician.documents.panCard = { url: panCard, uploadedAt: new Date() };
        if (drivingLicense)
            technician.documents.drivingLicense = { url: drivingLicense, uploadedAt: new Date() };
        if (vehicleRegistration)
            technician.documents.vehicleRegistration = {
                url: vehicleRegistration,
                uploadedAt: new Date(),
            };

        await technician.save();

        res.status(200).json({
            success: true,
            message: "Documents uploaded successfully",
            technician,
        });
    } catch (err) {
        next(err);
    }
};

export const updateBankDetails = async (req, res, next) => {
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

        res.status(200).json({
            success: true,
            message: "Bank details updated successfully",
        });
    } catch (err) {
        next(err);
    }
};

export const getTechnicianProfile = async (req, res, next) => {
    try {
        const technician = await Technician.findById(req.technicianId).select("-password");

        if (!technician) {
            return res.status(404).json({
                success: false,
                message: "Technician not found",
            });
        }

        res.status(200).json({
            success: true,
            technician,
        });
    } catch (err) {
        next(err);
    }
};

export const updateTechnicianStatus = async (req, res, next) => {
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

        res.status(200).json({
            success: true,
            message: "Status updated successfully",
        });
    } catch (err) {
        next(err);
    }
};

export const updateLocation = async (req, res, next) => {
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

        res.status(200).json({
            success: true,
            message: "Location updated successfully",
        });
    } catch (err) {
        next(err);
    }
};
