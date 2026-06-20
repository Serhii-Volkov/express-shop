import type { User } from "@prisma/client";
import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
  userId?: string

}

export type SafeUser = Omit<User, "password">;