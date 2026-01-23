import cloudinary from "cloudinary";
import dotenv from "dotenv";
dotenv.config();
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
export const uploadToCloudinary = async (file, fileType) => {
    return new Promise((resolve, reject) => {
        let uploadOptions = {};
        switch (fileType) {
            case "image":
                uploadOptions.resource_type = "image";
                break;
            case "pdf":
                uploadOptions.resource_type = "raw";
                uploadOptions.format = "pdf";
                break;
            default:
                return reject(new Error("Invalid file type"));
        }
        const base64Data = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
        cloudinary.v2.uploader
            .upload(base64Data, uploadOptions)
            .then((result) => {
            resolve(result);
        })
            .catch((error) => {
            reject(error);
        });
    });
};
export const deleteFromCloudinary = async (publicId) => {
    return new Promise((resolve, reject) => {
        cloudinary.v2.uploader
            .destroy(publicId)
            .then((result) => {
            resolve(result);
        })
            .catch((error) => {
            reject(error);
        });
    });
};
export default uploadToCloudinary;
