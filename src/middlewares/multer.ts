import multer, { FileFilterCallback} from "multer";
import path from "path";
import { Request } from "express";
// set storage engine to disk
// const storage = multer.diskStorage({
//   destination: path.resolve(__dirname, "../uploads"),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const name = path.basename(file.originalname, ext);
//     cb(null, `${name}-${Date.now()}${ext}`);
//   },
// });
// set storage engine to cloudinary
const storage = multer.memoryStorage();
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    let allowedFileTypes = /jpg|jpeg|png|pdf/; // default (files)
    // single image upload → allow more image formats
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file?.mimetype?.toLowerCase());
    if (extname && mimetype) {
        cb(null, true);
    }
    else {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
};
const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
    },
    fileFilter,
});
export default upload;
