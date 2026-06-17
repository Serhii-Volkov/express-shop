import type { User } from "@prisma/client";
import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;

}

export type SafeUser = Omit<User, "password">;