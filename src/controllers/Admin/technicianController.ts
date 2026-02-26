import Technician from "../../models/Technician/Technician.js";
import { Request, Response, NextFunction } from "express";
// import ServiceReview from "../../models/Services/Rating.js";

interface FilterType {
    currentStatus?: string;
    registrationStatus?: string;
}

export const getAllTechnicians = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status, registrationStatus, page = 1, limit = 20 } = req.query;

        let filter: FilterType = {};
        if (status) filter.currentStatus = status as string;
        if (registrationStatus) filter.registrationStatus = registrationStatus as string;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);

        const skip = (pageNum - 1) * limitNum;

        const technicians = await Technician.find(filter)
            .select("-bankDetails") // Hide sensitive info
            .skip(skip)
            .limit(limitNum);

        const total = await Technician.countDocuments(filter);

        return res.status(200).json({
            success: true,
            technicians,
            pagination: {
                current: page,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (err) {
        return next(err);
    }
};

export const getTechnicianDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { technicianId } = req.params;

        const technician = await Technician.findById(technicianId);

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

export const approveTechnicianRegistration = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { technicianId } = req.params;

        const technician = await Technician.findById(technicianId);
        if (!technician) {
            return res.status(404).json({
                success: false,
                message: "Technician not found",
            });
        }

        for (const docKey in technician.documents) {
            const doc = technician.documents[docKey as keyof typeof technician.documents];
            if (!doc || !doc.verified) {
                return res.status(400).json({
                    success: false,
                    message: "Documents not verified",
                });
            }
        }

        technician.registrationStatus = "approved";
        technician.isVerified = true;
        technician.approvedAt = new Date();
        await technician.save();

        // TODO: Send approval notification to technician

        return res.status(200).json({
            success: true,
            message: "Technician registration approved",
            technician,
        });
    } catch (err) {
        return next(err);
    }
};

export const rejectTechnicianRegistration = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { technicianId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason required",
            });
        }

        const technician = await Technician.findById(technicianId);
        if (!technician) {
            return res.status(404).json({
                success: false,
                message: "Technician not found",
            });
        }

        technician.registrationStatus = "rejected";
        technician.rejectionReason = reason;
        await technician.save();

        // TODO: Send rejection notification to technician

        return res.status(200).json({
            success: true,
            message: "Technician registration rejected",
            technician,
        });
    } catch (err) {
        return next(err);
    }
};

export const deactivateTechnician = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { technicianId } = req.params;

        const technician = await Technician.findById(technicianId);
        if (!technician) {
            return res.status(404).json({
                success: false,
                message: "Technician not found",
            });
        }

        technician.isActive = false;
        await technician.save();

        return res.status(200).json({
            success: true,
            message: "Technician deactivated",
        });
    } catch (err) {
        return next(err);
    }
};

const allowed = ["aadhaar", "panCard", "drivingLicense", "vehicleRegistration", "vehicleImage"] as const;
type DocumentType = typeof allowed[number];

export const verifyTechnicianDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { technicianId } = req.params;
        const documentType: unknown = req.body.documentType;

        if (typeof documentType !== "string") {
            return res.status(400).json({
                success: false,
                message: "Document type required",
            });
        }

        if (!allowed.includes(documentType as DocumentType)) {
            return res.status(400).json({ success: false, message: "Invalid document type" });
        }

        const technician = await Technician.findById(technicianId);
        if (!technician) {
            return res.status(404).json({
                success: false,
                message: "Technician not found",
            });
        }

        const docs = technician.documents;
        if (!docs) return res.status(400).json({ success: false, message: "Documents not uploaded" });

        // ✅ now TS knows documentType is one of allowed keys
        const key = documentType as DocumentType;

        const doc = docs[key];
        if (!doc) {
            return res.status(400).json({ success: false, message: `${key} not found` });
        }

        doc.verified = true;

        await technician.save();

        return res.status(200).json({
            success: true,
            message: `${key} verified successfully`,
        });
    } catch (err) {
        return next(err);
    }
};

export const getTechnicianRatings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { technicianId, page = 1, limit = 20 } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        // const ratings = await ServiceReview.find({ technicianId })
        //     .sort({ createdAt: -1 })
        //     .skip(skip)
        //     .limit(limitNum)
        //     .populate("userId", "fullName"); // Populate user details

        // const total = await ServiceReview.countDocuments({ technicianId });

        // return res.status(200).json({
        //     success: true,
        //     ratings,
        //     pagination: {
        //         current: page,
        //         total,
        //         pages: Math.ceil(total / limitNum),
        //     },
        // });

        return res.status(200).json({
            success: true,
            message: "Ratings endpoint - implementation pending",
        });
        
    } catch (err) {
        return next(err);
    }
};