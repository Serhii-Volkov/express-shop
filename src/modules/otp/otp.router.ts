import { Router } from "express";
import {resendOtp, verifyOtp} from './otp.controller'
import { getUserIdFromCookie } from "@src/middleware/auth.middleware";

const route = Router()

route.post('/verify', getUserIdFromCookie, verifyOtp)
route.get('/resend-otp', getUserIdFromCookie, resendOtp) 

export default route