// middlewares/error.middleware.ts

import { Request, Response, NextFunction } from "express";
import { ApiError } from "../error/api.error";
import logger from "../config/logger.config";

export const errorMiddleware = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof ApiError) {
        return res.status(err.status).json({
            code: err.code,
            message: err.message,
            details: err.details,
        });
    }

    logger.error({
    method: req.method,
    path: req.originalUrl,
    error: err,
});

    return res.status(500).json({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
    });
};