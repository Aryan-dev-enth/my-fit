import mongoose, { Schema, Model, Types } from 'mongoose';

export type WorkoutType = 'running' | 'swimming' | 'gym';

export interface IWorkoutEntry {
  userId: Types.ObjectId;
  type: WorkoutType;
  caloriesBurned: number;
  timestamp: Date;
  date: string; // YYYY-MM-DD format for easy grouping
  notes?: string;
}

const WorkoutEntrySchema = new Schema<IWorkoutEntry>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['running', 'swimming', 'gym'],
  },
  caloriesBurned: {
    type: Number,
    required: true,
    min: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  date: {
    type: String,
    required: true,
    index: true,
  },
  notes: {
    type: String,
    trim: true,
  },
});

// Compound index for efficient querying by user and date
WorkoutEntrySchema.index({ userId: 1, date: -1 });
WorkoutEntrySchema.index({ userId: 1, timestamp: -1 });

export const WorkoutEntry: Model<IWorkoutEntry> = 
  mongoose.models.WorkoutEntry || mongoose.model<IWorkoutEntry>('WorkoutEntry', WorkoutEntrySchema);
