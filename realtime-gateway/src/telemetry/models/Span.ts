import mongoose, { Schema, Document } from 'mongoose';

export interface ISpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  serviceName: string;
  name: string;
  kind: string; // 'SERVER', 'CLIENT', 'PRODUCER', 'CONSUMER', 'INTERNAL'
  startTime: number; // epoch ms
  endTime: number; // epoch ms
  durationMs: number;
  statusCode: 'OK' | 'ERROR' | 'UNSET';
  statusMessage?: string;
  httpMethod?: string;
  httpUrl?: string;
  httpStatusCode?: number;
  attributes?: Record<string, any>;
  events?: Array<{ name: string; timestamp: number; attributes?: Record<string, any> }>;
}

export const SpanSchema = new Schema<ISpan>({
  spanId: { type: String, required: true },
  traceId: { type: String, required: true, index: true },
  parentSpanId: { type: String },
  serviceName: { type: String, required: true, index: true },
  name: { type: String, required: true },
  kind: { type: String, default: 'SERVER' },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  durationMs: { type: Number, required: true },
  statusCode: { type: String, enum: ['OK', 'ERROR', 'UNSET'], default: 'OK' },
  statusMessage: { type: String },
  httpMethod: { type: String },
  httpUrl: { type: String },
  httpStatusCode: { type: Number },
  attributes: { type: Schema.Types.Mixed },
  events: [{ name: String, timestamp: Number, attributes: Schema.Types.Mixed }],
});
