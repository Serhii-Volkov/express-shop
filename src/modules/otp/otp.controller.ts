import { Response, Request } from "express";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { ApiError } from "../../error/api.error";
import { AuthenticatedRequest } from "@src/types/auth.type";
import { generateOtp, sendOtp } from "./otp.utils";


export const verifyOtp = async(req: AuthenticatedRequest, res: Response) => {
    try{
        const userId = req.userId as string
        const {otpToken} = req.body
      console.log('userId', userId)
      console.log('otpToken', otpToken)
        const otp = await prisma.otp.findFirst({where: {userId}, orderBy: {createdAt: 'desc'}})

        if(!otp) {
            return res.status(404).json({message: 'OTP не найден'})
        }

        if(otp.expiresAt < new Date()) {
            return res.status(400).json({message: 'OTP код истек'})
        }

        const isValidToken = await bcrypt.compare(otpToken, otp.otp)
        if(!isValidToken) {
            return res.status(400).json({message: 'Невалидный OTP код'})
        }

        await prisma.user.update({where: {id: userId}, data: {
            isVerified: true
        }})

       return res.status(200).json({message: "Email validate", success: true})

    } catch (e) {
        return res.status(500).json({message: 'Server error', error: e})
    }
}

export const resendOtp = async(req: AuthenticatedRequest, res: Response) => {
    try{
        const userId = req.userId 

        const user = await prisma.user.findUnique({where: {id: userId}})

        if(!user) {
            return res.status(404).json({message: 'Пользователь не найден'})
        }

        await prisma.otp.deleteMany({where: {userId}})

        const otpRecord = await prisma.otp.create({data: {
           userId: userId as string,
           aim: 'Verify email',    
           details: 'Email confirmation for website registration.',
           otp: await bcrypt.hash(generateOtp(), 10),
           expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
        }})

        await sendOtp(user.email, otpRecord.aim, otpRecord.otp)

       return res.status(200).json({message: "OTP code resent", success: true})
    } catch (e) {
        return res.status(500).json({message: 'Server error', error: e})
    }
}