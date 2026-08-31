import mongoose from 'mongoose';
import { config } from './env';

let isMongoConnected = false;

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    isMongoConnected = true;
    console.log('✅ MongoDB connected successfully for telemetry storage.');
  } catch (err: any) {
    isMongoConnected = false;
    console.warn(`⚠️ MongoDB connection warning: ${err.message}. Operating in resilient memory-backed mode for local development.`);
  }
}

export function isDbConnected(): boolean {
  return isMongoConnected && mongoose.connection.readyState === 1;
}
