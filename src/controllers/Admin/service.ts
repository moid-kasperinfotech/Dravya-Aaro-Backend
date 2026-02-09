import { Request, Response, NextFunction } from "express";
import Service from "../../models/Services/service.js";
import uploadToCloudinary, {
  deleteFromCloudinary,
} from "../../utils/uploadToCloudinary.js";

export async function servicePostController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let uploadedImage: string | undefined;
  try {
    let { serviceId } = req.params;
    const {
      type,
      category,
      name,
      price,
      duration,
      process,
      includes,
      frequentlyAskedQuestions,
      status,
      markAsPopular,
    } = req.body;

    // Validate the required fields
    if (
      type == null ||
      category == null ||
      name == null ||
      price == null ||
      duration == null ||
      process == null ||
      includes == null ||
      frequentlyAskedQuestions == null
    ) {
      return res.status(400).json({ message: "required fields are missing" });
    }

    let service = await Service.findOne({ serviceId });
    if (!service) {
      const newServiceId = `SERV-${Date.now()}`;

      service = new Service({
        serviceId: newServiceId,
        type,
        category,
        name,
        price,
        duration,
        process,
        includes,
        frequentlyAskedQuestions,
        status,
        markAsPopular,
      });
    } else {
      service.type = type ? type : service.type;
      service.category = category ? category : service.category;
      service.name = name ? name : service.name;
      service.price = price ? price : service.price;
      service.duration = duration ? duration : service.duration;
      service.process = process ? process : service.process;
      service.includes = includes ? includes : service.includes;
      service.frequentlyAskedQuestions = frequentlyAskedQuestions ? frequentlyAskedQuestions : service.frequentlyAskedQuestions;
      service.status = status ? status : service.status;
			service.markAsPopular = markAsPopular ? markAsPopular : service.markAsPopular;
    }
    await service.validate();

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

          uploadedImage = result.public_id;
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

    if (req.file) {
      const uploadResult = await uploadSingleFile(req.file);
      service.image = uploadResult.secure_url;
    }

    await service.save();

    return res
      .status(200)
      .json({ message: "Service created successfully", service: service });
  } catch (error) {
    if (uploadedImage) {
      res.on("finish", async () => {
        try {
          await deleteFromCloudinary(uploadedImage as string);
        } catch (deleteError) {
          console.error(
            `Failed to delete file with public_id: ${uploadedImage}`,
            deleteError,
          );
        }
      });
    }
    return next(error);
  }
}

export async function getServiceCountController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const [result] = await Service.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          activeCount: { $sum: { $cond: ["$status", 1, 0] } },
          inactiveCount: { $sum: { $cond: ["status", 0, 1] } },
        },
      },
      { $project: { _id: 0, count: 1, activeCount: 1, inactiveCount: 1 } },
    ]);

    const counts = result ?? { count: 0, activeCount: 0, inactiveCount: 0 };

    return res.status(200).json({
      message: "Service count fetched successfully",
      ...counts,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAllServicesController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const filter = {};

    const services = await Service.find(filter);

    return res
      .status(200)
      .json({ message: "All services fetched successfully", services });
  } catch (error) {
    return next(error);
  }
}

export async function getServiceByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { serviceId } = req.params;

    const service = await Service.findOne({ serviceId });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    return res
      .status(200)
      .json({ message: "Service fetched successfully", service });
  } catch (error) {
    return next(error);
  }
}