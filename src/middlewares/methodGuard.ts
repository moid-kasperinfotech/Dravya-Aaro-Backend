import { Request, Response, NextFunction } from "express";

function methodGuard(req: Request, res: Response, next: NextFunction) {
    const allowed: Record<string, readonly string[]> = req.allowedMethods || {};
    const allowedMethods = allowed[req.path];
    if (allowedMethods && !allowedMethods.includes(req.method)) {
        res.set("Allow", allowedMethods.join(", "));
        return res
            .status(405)    
            .json({ success: false, message: "Method Not Allowed" });
    }
    return next();
}
export { methodGuard };
