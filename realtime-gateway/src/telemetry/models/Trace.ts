import mongoose, { Schema, Document, Model } from 'mongoose';
import { ISpan, SpanSchema } from './Span';

export interface ITrace extends Document {
  traceId: string;
  rootSpanId: string;
  rootServiceName: string;
  name: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  statusCode: 'OK' | 'ERROR' | 'UNSET';
  hasErrors: boolean;
  servicesInvolved: string[];
  spansCount: number;
  spans: ISpan[];
  createdAt: Date;
}

const TraceSchema = new Schema<ITrace>({
  traceId: { type: String, required: true, unique: true, index: true },
  rootSpanId: { type: String, required: true },
  rootServiceName: { type: String, required: true, index: true },
  name: { type: String, required: true },
  startTime: { type: Number, required: true, index: true },
  endTime: { type: Number, required: true },
  durationMs: { type: Number, required: true },
  statusCode: { type: String, enum: ['OK', 'ERROR', 'UNSET'], default: 'OK' },
  hasErrors: { type: Boolean, default: false, index: true },
  servicesInvolved: [{ type: String }],
  spansCount: { type: Number, default: 1 },
  spans: [SpanSchema],
  createdAt: { type: Date, default: Date.now, expires: '7d' },
});

export const TraceModel: Model<ITrace> = (mongoose.models.Trace as Model<ITrace>) || mongoose.model<ITrace>('Trace', TraceSchema);
