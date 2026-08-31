import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/shadow_telemetry',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  coreServiceUrl: process.env.CORE_SERVICE_URL || 'http://localhost:8080',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  environment: process.env.NODE_ENV || 'development',
};
