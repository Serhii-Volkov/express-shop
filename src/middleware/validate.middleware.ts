import { Request, Response, NextFunction } from "express"
import z from 'zod'

export const bodyValidate = <T extends z.ZodTypeAny>(schema: T) => (req: Request, res: Response, next: NextFunction) => {
    try{
        req.body = schema.parse(req.body)
        next()
    } catch (e) {
        if (e instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: e.issues,
        });
      }
      next(e);
    }
}