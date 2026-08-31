import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IServiceLog extends Document {
  serviceId: string;
  traceId?: string;
  spanId?: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const ServiceLogSchema = new Schema<IServiceLog>({
  serviceId: { type: String, required: true, index: true },
  traceId: { type: String, index: true },
  spanId: { type: String },
  level: { type: String, enum: ['INFO', 'WARN', 'ERROR', 'DEBUG'], default: 'INFO', index: true },
  message: { type: String, required: true },
  timestamp: { type: Number, required: true, index: true },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now, expires: '7d' },
});

export const ServiceLogModel: Model<IServiceLog> = (mongoose.models.ServiceLog as Model<IServiceLog>) || mongoose.model<IServiceLog>('ServiceLog', ServiceLogSchema);
