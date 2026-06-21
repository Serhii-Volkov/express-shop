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
import OtpRoutes from '@src/modules/otp/otp.router'
import {Request, Response, NextFunction} from 'express'
import '@src/config/sentry.config'
import * as Sentry from "@sentry/node";


const app = express();
const PORT = process.env.PORT || 5000;


app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routes
app.use('/auth', AuthRoutes);
app.use('/avatar', AvatarRoutes);
app.use('/category', Categories);
app.use('/otp', OtpRoutes);

// Sentry error handler (IMPORTANT)
Sentry.setupExpressErrorHandler(app);

// your error handler LAST
app.use(errorMiddleware);


 //Sentry.metrics.count('button_click', 1); //для 
 //Sentry.metrics.gauge('page_load_time', 150);
 //Sentry.metrics.distribution('response_time', 200);
 //Sentry.logger.info('server work')



app.listen(PORT, () => {
  Sentry.logger.info('Server work')
  logger.info(`Server running on http://localhost:${PORT}`);
});