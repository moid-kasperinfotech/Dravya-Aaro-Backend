import Service from "../../models/Services/Service.js";

export const getAllServices = async (req, res, next) => {
    try {
        const { category, page = 1, limit = 20, isPopular } = req.query;

        let filter = { isActive: true };
        if (category) filter.serviceCategory = category;
        if (isPopular === "true") filter.isPopular = true;

        const skip = (page - 1) * limit;

        const services = await Service.find(filter)
            .skip(skip)
            .limit(limit);

        const total = await Service.countDocuments(filter);

        res.status(200).json({
            success: true,
            services,
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

export const getServiceDetails = async (req, res, next) => {
    try {
        const { serviceId } = req.params;

        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        res.status(200).json({
            success: true,
            service,
        });
    } catch (err) {
        next(err);
    }
};

export const searchServices = async (req, res, next) => {
    try {
        const { query } = req.query;

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

        res.status(200).json({
            success: true,
            services,
        });
    } catch (err) {
        next(err);
    }
};
