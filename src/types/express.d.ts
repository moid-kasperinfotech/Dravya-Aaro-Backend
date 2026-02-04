import { Types } from "mongoose";

declare global {
    namespace Express {
        interface Request {
            adminId: Types.ObjectId;
            userId: Types.ObjectId;
            technicianId: Types.ObjectId;
            user: import("../../models/Users/User").IUser;
            admin: import("../../models/Admin/Admin").IAdmin;
            technician: import("../../models/Technicians/Technician").ITechnician;
            allowedMethods?: Record<string, readonly string[]>;
        }
    }
}

export {};