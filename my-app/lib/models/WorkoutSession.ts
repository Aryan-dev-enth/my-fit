import mongoose, { Schema, Model, Types } from 'mongoose';
import { WorkoutPlanType } from '../types';

export interface IExerciseSet {
  setNumber: number;
  completed: boolean;
  weight?: number;
  reps?: number;
  notes?: string;
}

export interface IExercise {
  id: string;
  name: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  sets: IExerciseSet[];
  category?: string;
}

export interface IWorkoutSession {
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  workoutType: WorkoutPlanType;
  exercises: IExercise[];
  duration?: number;
  caloriesBurned?: number;
  notes?: string;
  completed: boolean;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSetSchema = new Schema<IExerciseSet>({
  setNumber: {
    type: Number,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  weight: {
    type: Number,
    min: 0,
  },
  reps: {
    type: Number,
    min: 0,
  },
  notes: {
    type: String,
    trim: true,
  },
}, { _id: false });

const ExerciseSchema = new Schema<IExercise>({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  targetSets: {
    type: Number,
    required: true,
    min: 1,
  },
  targetRepsMin: {
    type: Number,
    required: true,
    min: 1,
  },
  targetRepsMax: {
    type: Number,
    required: true,
    min: 1,
  },
  sets: {
    type: [ExerciseSetSchema],
    default: [],
  },
  category: {
    type: String,
    trim: true,
  },
}, { _id: false });

const WorkoutSessionSchema = new Schema<IWorkoutSession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: String,
    required: true,
    index: true,
  },
  workoutType: {
    type: String,
    required: true,
    enum: [
      'chest-triceps',
      'back-biceps',
      'swimming-core',
      'legs-shoulders',
      'swimming-light',
      'plyo-sprints',
      'rest',
      'custom',
    ],
  },
  exercises: {
    type: [ExerciseSchema],
    default: [],
  },
  duration: {
    type: Number,
    min: 0,
  },
  caloriesBurned: {
    type: Number,
    min: 0,
  },
  notes: {
    type: String,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient querying
WorkoutSessionSchema.index({ userId: 1, date: -1 });
WorkoutSessionSchema.index({ userId: 1, workoutType: 1 });

export const WorkoutSession: Model<IWorkoutSession> = 
  mongoose.models.WorkoutSession || mongoose.model<IWorkoutSession>('WorkoutSession', WorkoutSessionSchema);
