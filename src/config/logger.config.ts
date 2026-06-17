import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Production should log JSON instead of pretty print
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level,
  levels,
  format: process.env.NODE_ENV === 'production' ? prodFormat : format,
  transports: [
    new winston.transports.Console(),

    new winston.transports.File({
      filename: 'src/logs/error.log',
      level: 'error',
    }),

    new winston.transports.File({
      filename: 'src/logs/warn.log',
      level: 'warn',
    }),


    new winston.transports.File({ filename: 'src/logs/all.log' }),
  ],
});

export default logger;
