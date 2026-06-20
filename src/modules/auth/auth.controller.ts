import { Request, Response } from "express"
import {prisma} from '../../lib/prisma'
import bcrypt from 'bcryptjs'
import {generateAccessToken, generateRefreshToken} from "../../utils/jwt"
import {saveUserIdCookie, setAuthCookies} from "../../utils/cookie"
import { ApiError } from "../../error/api.error"
import { AuthenticatedRequest } from "@src/types/auth.type"
import {verifyRefreshToken} from "../../utils/jwt"
import { JwtPayload } from "jsonwebtoken"
import {createOtp, generateOtp, sendOtp} from "../otp/otp.utils"



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
        
        const otpRecord = await createOtp({
            userId: user.id, 
            aim: 'Verify email', 
            details: 'Email confirmation for website registration.', 
            otp: generateOtp(), expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        })

        sendOtp(user.email, otpRecord.aim, otpRecord.otp)
       

       saveUserIdCookie(res, user.id)

        return res.status(201).json({message: "User created", success: true })

    } catch (e) {
        return res.status(500).json({message: 'Server error', error: e})
    }
    
}

export const login = async(req: Request, res: Response) => {
    try{
        const {email, password} = req.body

        const user = await prisma.user.findUnique({where: {email}})

        if(!user) {
            return res.status(404).json({message: 'Пользователь c таким email отсутствует'})
        }

        if(!user.password) {
            return res.status(409).json({message: 'Пользователь зарегистрирован через стороний сервис например Google'})
        }

        const isValidePassword = await bcrypt.compare(password, user.password)

        if(!isValidePassword) {
            return res.status(401).json({message: 'Неправильный пароль'})
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





//export const refresh = async(req: Request, res: Response) => {
//
//    try{
//        const refreshToken = req.cookies.refreshToken
//        if(!refreshToken) {
//            throw ApiError.Unauthorized('Невалидный RefreshToken', 'У пользователя нет токена')
//        }
//        const payload = verifyRefreshToken(refreshToken) as JwtPayload 
//        if(!payload) {
//            throw ApiError.Unauthorized('Невалидный RefreshToken', 'Токен не валиден')
//        }
//
//        const userId = payload.sub as string
//       
//        const user = await prisma.user.findUnique({where: {id: userId}})
//
//        if(!user) {
//            throw ApiError.Unauthorized('Невалидный RefreshToken', "Пользователь с таким id нету в базе даніх")
//        }
//
//        const token = await prisma.refreshToken.findUnique({where: {token: refreshToken, isUsed: false}})
//        if(!token) {
//            res.clearCookie('accessToken')
//            res.clearCookie('refreshToken')
//            throw ApiError.Unauthorized('Невалидный RefreshToken', "Пользователь с таким id нету в базе даніх")
//        }
//        await prisma.refreshToken.update({where: {token: refreshToken}, data: {isUsed: true}})
//        const newAccessToken = generateAccessToken({sub: user.id, email: user.email, role: user.role})
//        const newRefreshToken = generateRefreshToken(user.id)
//
//         setAuthCookies(res, newAccessToken, newRefreshToken)
//         return res.status(200).json({message: "Токен обновлен", success: true})
//    } catch (e) {
//        throw ApiError.Internal('Server error', e)
//    }
//}

export const logout = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const refreshToken = req.cookies.refreshToken

        if (!refreshToken) {
            return res.status(400).json({
                message: "Нет токена для выхода"
            })
        }

        try {
            verifyRefreshToken(refreshToken)

            // например:
            // await tokenService.removeRefreshToken(refreshToken)

        } catch {
            // токен невалидный — всё равно очищаем cookie
        }

        res.clearCookie("accessToken")
        res.clearCookie("refreshToken")

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
