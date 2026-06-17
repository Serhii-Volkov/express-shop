import cookie from 'cookie-parser'
import { Response } from 'express'
import dotenv from "dotenv"
dotenv.config()

const getAccessCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production'

    return {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict' as const,
        maxAge: 15 * 60 * 1000, // 15 minutes
        //path: '/',
    }
}

const getRefreshCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production'

    return {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        //path: '/',
    }
}

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    const accessCookieName = process.env.ACCESS_COOKIE_NAME
    const refreshCookieName = process.env.REFRESH_COOKIE_NAME

    if(!accessCookieName || !refreshCookieName) {
        throw new Error('ACCESS_COOKIE_NAME or REFRESH_COOKIE_NAM is not set')
    }

    res.cookie(accessCookieName, accessToken, getAccessCookieOptions())
    res.cookie(refreshCookieName ,refreshToken, getRefreshCookieOptions())
}


export const clearAuthCookies = (res: Response) => {
    const accessCookieName = process.env.ACCESS_COOKIE_NAME
    const refreshCookieName = process.env.REFRESH_COOKIE_NAM

    if(!accessCookieName || !refreshCookieName) {
        throw new Error('ACCESS_COOKIE_NAME or REFRESH_COOKIE_NAM is not set')
    }

    res.clearCookie(accessCookieName, getAccessCookieOptions())
    res.clearCookie(refreshCookieName, getRefreshCookieOptions())
}