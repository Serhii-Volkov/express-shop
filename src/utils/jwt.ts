import  jwt, { SignOptions }  from "jsonwebtoken"
import type {User} from "@prisma/client"
import dotenv from "dotenv"
dotenv.config()




interface AccessTokenPayload  {
    sub: string,
    email: string,
    role: User['role']
}


const getAccessSecret = () => {
    const secret = process.env.JWT_ACCESS_SECRET

    if(!secret) {
        throw new Error('JWT_ACCESS_SECRET is not set')
    }

    return secret
}

const getRefreshSecret = () => {
    const secret = process.env.JWT_REFRESH_SECRET

     if(!secret) {
        throw new Error('JWT_REFRESH_SECRET is not set')
    }

    return secret
}

export const generateAccessToken = (payload: AccessTokenPayload): string => {
    const expiresIn = process.env.JWT_ACCESS_TOKEN_EXPARES_IN || '15m'

    return jwt.sign(payload, getAccessSecret(), {expiresIn: expiresIn as SignOptions['expiresIn']})
}

export const generateRefreshToken = (userId: string): string => {
    const expiresIn = process.env.JWT_REFRESH_TOKEN_EXPARES_IN || '7d'

    return jwt.sign({ sub: userId }, getRefreshSecret(), { expiresIn: expiresIn as SignOptions['expiresIn'] })
}



export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, getAccessSecret()) as AccessTokenPayload
}

export const verifyRefreshToken = (token: string)  => {
    return jwt.verify(token, getRefreshSecret())
}

