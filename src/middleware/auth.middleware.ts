import { Response, Request, NextFunction } from "express"
import { ApiError } from "../error/api.error"
import { verifyAccessToken } from "../utils/jwt"
import {prisma} from '../lib/prisma'
import {AuthenticatedRequest} from '../modules/auth/types/auth.type'

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