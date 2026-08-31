import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISnapshot extends Document {
  timestamp: number;
  label: string;
  servicesState: Record<string, {
    status: string;
    rps: number;
    p95LatencyMs: number;
    errorRatePercent: number;
  }>;
  activeIncidentsCount: number;
  activeChaosExperiments: Array<{
    serviceId: string;
    faultType: string;
    value: number;
  }>;
  totalThroughputRps: number;
  avgSystemLatencyMs: number;
  createdAt: Date;
}

const SnapshotSchema = new Schema<ISnapshot>({
  timestamp: { type: Number, required: true, unique: true, index: true },
  label: { type: String, required: true },
  servicesState: { type: Schema.Types.Mixed, required: true },
  activeIncidentsCount: { type: Number, default: 0 },
  activeChaosExperiments: [{ serviceId: String, faultType: String, value: Number }],
  totalThroughputRps: { type: Number, default: 0 },
  avgSystemLatencyMs: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: '30d' },
});

export const SnapshotModel: Model<ISnapshot> = (mongoose.models.Snapshot as Model<ISnapshot>) || mongoose.model<ISnapshot>('Snapshot', SnapshotSchema);
