import express from "express";
import dotenv from 'dotenv'
dotenv.config()
import helmet from "helmet";
import cors from "cors"
import cookieParser from "cookie-parser";
import AuthRoutes from '@src/modules/auth/auth.router'
import logger from './config/logger.config'
import { errorMiddleware } from "./middleware/error.middleware";
import AvatarRoutes from "@src/modules/avatar/routes";
import Categories from '@src/modules/categories/categories.router'


const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : '*',
  credentials: true, // Важно для работы с cookies
  optionsSuccessStatus: 200 // Для совместимости со старыми браузерами
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// последняя мидлвара для обработки ошибок
app.use(errorMiddleware)


app.use('/auth' ,AuthRoutes)
app.use('/avatar' ,AvatarRoutes)
app.use('/category',Categories )


app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
});
console.log({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS?.length,
});