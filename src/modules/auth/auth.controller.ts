import { Request, Response } from "express"
import {prisma} from '../../lib/prisma'
import bcrypt from 'bcryptjs'
import {generateAccessToken, generateRefreshToken, verifyRefreshToken} from "../../utils/jwt"
import {clearUserIdCookie, saveUserIdCookie, setAuthCookies} from "../../utils/cookie"
import { ApiError } from "../../error/api.error"
import { AuthenticatedRequest } from "@src/types/auth.type"
import {createOtp, generateOtp, sendOtp} from "../otp/otp.utils"
import  {JwtPayload} from 'jsonwebtoken'
import {clearAuthCookies} from "@src/utils/cookie"
import * as Sentry from "@sentry/node";





export const register = async(req: Request, res: Response) => {
    try{
        const {firstName, lastName, email, password} = req.body

        const userAlredyExist = await prisma.user.findUnique({where: {email}})

        
        if(userAlredyExist) {
            if(!userAlredyExist.isVerified) {
                await prisma.user.delete({where: {email}})
                clearUserIdCookie(res)
            } else {
                return res.status(409).json({message: 'Пользователь с таким email уже существует'})
            }
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

        Sentry.logger.info(`User created userId=${user.id}`);
        
        const otpToken = generateOtp()
        
        const otpRecord = await createOtp({
            userId: user.id, 
            aim: 'Verify email', 
            details: 'Email confirmation for website registration.', 
            otp: await bcrypt.hash(otpToken, 10),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        })

        sendOtp(user.email, otpRecord.aim, otpToken)
        saveUserIdCookie(res, user.id)
        

        return res.status(201).json({message: "User created", success: true })

    } catch (e) {
        Sentry.logger.error(`Registration failed error=${e}`);
        return res.status(500).json({message: 'Server error in register controller'})
    }
    
}

export const login = async(req: Request, res: Response) => {
    try{
        const {email, password} = req.body

        const user = await prisma.user.findUnique({where: {email}})

        if(user) {

            if(!user.password) {
                return res.status(409).json({message: 'Пользователь зарегистрирован через стороний сервис например Google'})
            } 
            if (!user.isVerified) {
                await prisma.user.delete({where: {email}})
                clearUserIdCookie(res)
                return res.status(401).json({message: 'Аккаунт пользователя был удален, так как не был подтвержден через email. Пожалуйста, зарегистрируйтесь снова.'})
            } 

        } else {
            return res.status(404).json({message: 'Пользователь c таким email отсутствует'})
        }

        const isValidePassword = await bcrypt.compare(password, user.password)

        if(!isValidePassword) {
            Sentry.logger.warn(`Неудачный логин, пользователь неправильно ввел пароль ${user.id}`)
            return res.status(401).json({message: 'Неправильный пароль'})
        }

        const accessToken = generateAccessToken({sub: user.id, email: user.email, role: user.role})
        const refreshToken = generateRefreshToken(user.id)
        
        setAuthCookies(res, accessToken, refreshToken)
        await prisma.refreshToken.create({data: {
            userId: user.id,
            token: refreshToken,
        }})

        Sentry.logger.info(`Пользователь вошел в систему userId:${user.id}`)
        res.status(200).json({message: "Успешный вход"})


    } catch (e) {
        return res.status(500).json({message: 'Server error', error: e})
    }
}

export const getMe = async(req: AuthenticatedRequest, res: Response) => {
    try{
        const user = req.user
        if(!user) {
            return res.status(404).json({message: 'Пользователь не найден'})
        }
        return res.json(user)
    } catch (e) {
        return res.status(500).json({message: 'Server error', error: e})
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
            return res.status(401).json({message: 'Невалидный RefreshToken', error: 'Payload is undefined'})
        }


        const userId = payload.sub as string
       
        const user = await prisma.user.findUnique({where: {id: userId}})

        if(!user) {
            return res.status(404).json({message: 'Пользователь не найден'})
        }

        const token = await prisma.refreshToken.findUnique({where: {token: refreshToken, isUsed: false}})
        if(!token) {
            clearAuthCookies(res)
            return res.status(401).json({message: 'Невалидный RefreshToken', error: 'Token not found or already used'})
        }
        await prisma.refreshToken.delete({where: {token: refreshToken}})

        const newAccessToken = generateAccessToken({sub: user.id, email: user.email, role: user.role})
        const newRefreshToken = generateRefreshToken(user.id)
        await prisma.refreshToken.create({data: {
            userId: user.id,
            token: newRefreshToken,
        }})

         setAuthCookies(res, newAccessToken, newRefreshToken)
         return res.status(200).json({message: "Токен обновлен", success: true})
    } catch (e) {
        throw ApiError.Internal('Server error', e)
    }
}

export const logout = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const refreshToken = req.cookies.refreshToken

        if (!refreshToken) {
            clearAuthCookies(res)
            return res.status(400).json({
                message: "Нет токена для выхода"
            })
        }

        try {
            verifyRefreshToken(refreshToken)
            const isMatchingToken = await prisma.refreshToken.findUnique({where: {token: refreshToken}})

            if(isMatchingToken) {
                await prisma.refreshToken.delete({where: {token: refreshToken}})
            } else {
                return res.status(400).json({
                    message: "Токен не найден в базе данных"
                })
            }
            
            

        } catch {
            clearUserIdCookie(res)
            clearAuthCookies(res)
            // токен невалидный — всё равно очищаем cookie
        }

       clearAuthCookies(res)

        return res.status(200).json({
            message: "Выход из системы",
            success: true
        })

    } catch (e) {
        return res.status(500).json({
            message: "Server error",
            error: e
        })
    }
}
