import Service from "../../models/Services/Service.js";
import { Request, Response, NextFunction } from "express";

interface FilterType {
    isActive: boolean;
    serviceCategory?: string;
    isPopular?: boolean;
}

export const getAllServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { category, page = 1, limit = 20, isPopular } = req.query;

        let filter: FilterType = { isActive: true };
        if (category) filter.serviceCategory = category as string;
        if (isPopular === "true") filter.isPopular = true;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);

        const skip = (pageNum - 1) * limitNum;

        const services = await Service.find(filter)
            .skip(skip)
            .limit(limitNum);

        const total = await Service.countDocuments(filter);

        return res.status(200).json({
            success: true,
            services,
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

export const getServiceDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { serviceId } = req.params;

        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        return res.status(200).json({
            success: true,
            service,
        });
    } catch (err) {
        return next(err);
    }
};

export const searchServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = req.query.query as string;

        if (!query || query.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Search query required",
            });
        }

        const services = await Service.find({
            isActive: true,
            $or: [
                { serviceName: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
                { serviceType: { $regex: query, $options: "i" } },
            ],
        }).limit(20);

        return res.status(200).json({
            success: true,
            services,
        });
    } catch (err) {
        return next(err);
    }
};
