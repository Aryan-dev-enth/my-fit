import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IWeightEntry {
  userId: Types.ObjectId;
  weight: number; // in kg
  timestamp: Date;
  bmi?: number;
}

const WeightEntrySchema = new Schema<IWeightEntry>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  weight: {
    type: Number,
    required: true,
    min: 20,
    max: 500,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  bmi: {
    type: Number,
  },
});

// Index for efficient querying of user's weight history
WeightEntrySchema.index({ userId: 1, timestamp: -1 });

export const WeightEntry: Model<IWeightEntry> = 
  mongoose.models.WeightEntry || mongoose.model<IWeightEntry>('WeightEntry', WeightEntrySchema);
