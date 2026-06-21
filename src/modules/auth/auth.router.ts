import { Router } from "express";
import {register, login, getMe,refresh,  logout} from './auth.controller'
import { bodyValidate } from "../../middleware/validate.middleware";
import { registerSchema } from "./schema/register.schema";
import { loginSchema } from "./schema/login.schema";
import { authenticate } from "../../middleware/auth.middleware";
//refresh,

const route = Router()

route.post('/register',bodyValidate(registerSchema), register)
route.post('/login', bodyValidate(loginSchema), login)
route.get('/me',authenticate, getMe )
route.post('/refresh', refresh)
route.post('/logout',  logout)


export default route