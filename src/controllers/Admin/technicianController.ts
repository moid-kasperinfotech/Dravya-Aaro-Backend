import Technician from "../../models/Technician/Technician.js";

export const getAllTechnicians = async (req, res, next) => {
    try {
        const { status, registrationStatus, page = 1, limit = 20 } = req.query;

        let filter = {};
        if (status) filter.currentStatus = status;
        if (registrationStatus) filter.registrationStatus = registrationStatus;

        const skip = (page - 1) * limit;

        const technicians = await Technician.find(filter)
            .select("-bankDetails") // Hide sensitive info
            .skip(skip)
            .limit(limit);

        const total = await Technician.countDocuments(filter);

        res.status(200).json({
            success: true,
            technicians,
            pagination: {
                current: page,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        next(err);
    }
};

export const getTechnicianDetails = async (req, res, next) => {
    try {
        const { technicianId } = req.params;

        const technician = await Technician.findById(technicianId);

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

export const approveTechnicianRegistration = async (req, res, next) => {
    try {
        const { technicianId } = req.params;

        const technician = await Technician.findById(technicianId);
        if (!technician) {
            return res.status(404).json({
                success: false,
                message: "Technician not found",
            });
        }

        technician.registrationStatus = "approved";
        technician.isVerified = true;
        technician.approvedAt = new Date();
        await technician.save();

        // TODO: Send approval notification to technician

        res.status(200).json({
            success: true,
            message: "Technician registration approved",
            technician,
        });
    } catch (err) {
        next(err);
    }
};

export const rejectTechnicianRegistration = async (req, res, next) => {
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

        res.status(200).json({
            success: true,
            message: "Technician registration rejected",
            technician,
        });
    } catch (err) {
        next(err);
    }
};

export const deactivateTechnician = async (req, res, next) => {
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

        res.status(200).json({
            success: true,
            message: "Technician deactivated",
        });
    } catch (err) {
        next(err);
    }
};

export const verifyTechnicianDocuments = async (req, res, next) => {
    try {
        const { technicianId } = req.params;
        const { documentType } = req.body; // "aadhaar", "panCard", "drivingLicense", "vehicleRegistration"

        if (!documentType) {
            return res.status(400).json({
                success: false,
                message: "Document type required",
            });
        }

        const technician = await Technician.findById(technicianId);
        if (!technician) {
            return res.status(404).json({
                success: false,
                message: "Technician not found",
            });
        }

        if (technician.documents[documentType]) {
            technician.documents[documentType].verified = true;
        }

        await technician.save();

        res.status(200).json({
            success: true,
            message: `${documentType} verified successfully`,
        });
    } catch (err) {
        next(err);
    }
};
