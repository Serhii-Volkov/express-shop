import crypto from 'crypto'
import {prisma} from '@src/lib/prisma'
import { mailOptions, transporter } from '@src/config/nodemailer.config'
import logger from '@src/config/logger.config'

export const generateOtp = () => {
    return crypto.randomInt(100000, 999999).toString()
}

interface Otp {
    userId: string,
    aim: string,
    details: string,
    otp: string,
    expiresAt: Date
}
 export const createOtp = async(data: Otp) => {
    const otp = await prisma.otp.create({data})
    return otp
}

//const otp = await prisma.otp.create({data: {
//            userId: user.id,
//            cell: 'Verify your email',
//            details: 'Please verify your email by clicking the link in the email we sent you.',
//            otp: await bcrypt.hash(otpToken, 10),
//            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
//        }})

export const sendOtp = async(email: string, aim: string, otp: string,  details = `Your OTP code is ${otp}. It will expire in 10 minutes.`) => {
    try{

      return await transporter.sendMail(mailOptions(email, aim, details), (error, info) => {
         if (error) {
             logger.error('Error sending email:', error);
         } else {
             logger.info('Email sent:', info.response);
         }
     });  
    } catch (e) {
        logger.error('Error sending OTP email:', e);
        throw new Error('Failed to send OTP email');
    }
}

 //onst details = `Your OTP code is ${otpToken}. It will expire in 10 minutes.`

 //      await transporter.sendMail(mailOptions(user.email, otp.cell, details), (error, info) => {
 //          if (error) {
 //              console.error('Error sending email:', error);
 //          } else {
 //              console.log('Email sent:', info.response);
 //          }
 //      });