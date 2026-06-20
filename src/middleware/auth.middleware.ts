import { Response, Request, NextFunction } from "express"
import { ApiError } from "../error/api.error"
import { verifyAccessToken } from "../utils/jwt"
import {prisma} from '../lib/prisma'
import {AuthenticatedRequest} from '@src/types/auth.type'

export const authenticate = async(req: Request, res:Response, next: NextFunction) => {
    try{
         const token = req.cookies.accessToken

    if(!token) {
        throw ApiError.Unauthorized('Невалидный AccessToken', 'У пользователя нет токена')
    }

    const payload = verifyAccessToken(token)
    const userId = payload.sub

    const user = await prisma.user.findUnique({where: {id: userId}, omit : {
        password: true, 
    }})

    if(!user) {
        throw ApiError.Unauthorized('Невалидный AccessToken', "Пользователь с таким id нету в базе даніх")
    }

    (req as AuthenticatedRequest).user = user;
    next()
    } catch (e) {
        next(e)
        
    }
   
}

export const getUserIdFromCookie = (req: Request, res:Response, next: NextFunction) => {
    try{
        const userId = req.cookies.userId
        if(!userId || typeof userId !== 'string') {
        throw ApiError.Unauthorized('User not registered')
        }
        (req as AuthenticatedRequest).userId = userId
        next()
    } catch (e) {
        next(e)
        
    }
    
}