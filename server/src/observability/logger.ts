import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} ${level}: ${message} ${metaStr}`;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'devpilot-api' },
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
  ],
});

export function createAgentLogger(agentName: string, sessionId: string) {
  return {
    info: (message: string, data?: any) => logger.info(`[${agentName}] ${message}`, { sessionId, ...data }),
    error: (message: string, data?: any) => logger.error(`[${agentName}] ${message}`, { sessionId, ...data }),
    warn: (message: string, data?: any) => logger.warn(`[${agentName}] ${message}`, { sessionId, ...data }),
    debug: (message: string, data?: any) => logger.debug(`[${agentName}] ${message}`, { sessionId, ...data }),
  };
}