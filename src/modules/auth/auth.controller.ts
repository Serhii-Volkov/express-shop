import { Request, Response } from "express"
import {prisma} from '../../lib/prisma'
import bcrypt from 'bcryptjs'
import {generateAccessToken, generateRefreshToken} from "../../utils/jwt"
import {setAuthCookies} from "../../utils/cookie"
import { ApiError } from "../../error/api.error"
import { AuthenticatedRequest } from "./types/auth.type"
import crypto from 'crypto'
import {verifyRefreshToken} from "../../utils/jwt"
import { JwtPayload } from "jsonwebtoken"
import { mailOptions, transporter } from "@src/config/nodemailer.config"


export const register = async(req: Request, res: Response) => {
    try{
        const {firstName, lastName, email, password} = req.body

        const userAlredyExist = await prisma.user.findUnique({where: {email}})
        if(userAlredyExist) {            
            throw ApiError.Conflict('User alredy exist')
        }

        const hashPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashPassword
            }
        })

        const accessToken = generateAccessToken({sub: user.id, email: user.email, role: user.role})
        const refreshToken = generateRefreshToken(user.id)
        
        setAuthCookies(res, accessToken, refreshToken)
        await prisma.refreshToken.create({data: {
            userId: user.id,
            token: refreshToken,
        }})

        const otpToken = crypto.randomInt(100000, 999999).toString()

        const otp = await prisma.otp.create({data: {
            userId: user.id,
            cell: 'Verify your email',
            details: 'Please verify your email by clicking the link in the email we sent you.',
            otp: await bcrypt.hash(otpToken, 10),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
        }})

        const details = `Your OTP code is ${otpToken}. It will expire in 10 minutes.`

        await transporter.sendMail(mailOptions(user.email, otp.cell, details), (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        return res.status(201).json({message: "User created", success: true })

    } catch (e) {
        throw ApiError.Internal('Server error', e)
    }
    
}

export const login = async(req: Request, res: Response) => {
    try{
        const {email, password} = req.body

        const user = await prisma.user.findUnique({where: {email}})

        if(!user) {
            throw ApiError.NotFound('Пользователь c таким email отсутствует')
        }

        if(!user.password) {
            throw ApiError.Conflict('Пользователь зарегистрирован через стороний сервис например Google')
        }

        const isValidePassword = await bcrypt.compare(password, user.password)

        if(!isValidePassword) {
            throw ApiError.Unauthorized('Неправильный пароль')
        }

        const accessToken = generateAccessToken({sub: user.id, email: user.email, role: user.role})
        const refreshToken = generateRefreshToken(user.id)
        
        setAuthCookies(res, accessToken, refreshToken)
        await prisma.refreshToken.create({data: {
            userId: user.id,
            token: refreshToken,
        }})

        res.status(200).json({message: "Успешный вход"})


    } catch (e) {
        throw ApiError.Internal('Server error', e)
    }
}

export const getMe = async(req: AuthenticatedRequest, res: Response) => {
    try{
        const user = req.user
        if(!user) {
            throw ApiError.Unauthorized('Пользователь не авторизован')
        }
        return res.json(user)
    } catch (e) {
        throw ApiError.Internal('Server error', e)
    }
}


export const verify = async(req: AuthenticatedRequest, res: Response) => {
    try{
        const userId = req.user?.id
        const {otpToken} = req.body

        const otp = await prisma.otp.findUnique({where: {userId: userId}})

        if(!otp) {
            throw ApiError.NotFound('OTP не найден')
        }

        if(otp.expiresAt < new Date()) {
            throw ApiError.BadRequest('OTP код истек')
        }

        const isValidToken = await bcrypt.compare(otpToken, otp.otp)
        if(!isValidToken) {
            throw ApiError.BadRequest('Невалидный otp код')
        }

        await prisma.user.update({where: {id: userId}, data: {
            isVerified: true
        }})

       return res.status(200).json({message: "Email validate", success: true})

    } catch (e) {
        throw ApiError.Internal('Server error', e)
    }
}


export const refresh = async(req: Request, res: Response) => {

    try{
        const refreshToken = req.cookies.refreshToken
        if(!refreshToken) {
            throw ApiError.Unauthorized('Невалидный RefreshToken', 'У пользователя нет токена')
        }
        const payload = verifyRefreshToken(refreshToken) as JwtPayload 
        if(!payload) {
            throw ApiError.Unauthorized('Невалидный RefreshToken', 'Токен не валиден')
        }

        const userId = payload.sub as string
        if(!userId) {
            throw ApiError.Unauthorized('Невалидный RefreshToken', 'Токен не валиден')
        }
        const user = await prisma.user.findUnique({where: {id: userId}})

        if(!user) {
            throw ApiError.Unauthorized('Невалидный RefreshToken', "Пользователь с таким id нету в базе даніх")
        }

        const newAccessToken = generateAccessToken({sub: user.id, email: user.email, role: user.role})
        const newRefreshToken = generateRefreshToken(user.id)

         setAuthCookies(res, newAccessToken, newRefreshToken)
         return res.status(200).json({message: "Токен обновлен", success: true})
    } catch (e) {
        throw ApiError.Internal('Server error', e)
    }
}

export const logout = async(req: AuthenticatedRequest, res: Response) => {
    try{
        const refreshToken = req.cookies.refreshToken

        if(!refreshToken) {
            try {
                const payload = verifyRefreshToken(refreshToken)
            } catch {
                //ignore
            }
            
            res.clearCookie('accessToken')
            res.clearCookie('refreshToken')
            return res.status(204).json({message: "Выход из системы", success: true})
        }


    } catch (e) {
        throw ApiError.Internal('Server error', e)
    }
}