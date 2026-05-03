import mongoose, { Schema, Model } from 'mongoose';

export interface IUser {
  username: string;
  passwordHash: string;
  height?: number; // in cm
  age?: number; // in years
  gender?: 'male' | 'female';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal?: {
    targetWeight: number; // in kg
    targetDate: Date; // when to reach the goal
    createdAt: Date;
  };
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  height: {
    type: Number,
    min: 50,
    max: 300,
  },
  age: {
    type: Number,
    min: 10,
    max: 120,
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    default: 'moderate',
  },
  goal: {
    targetWeight: {
      type: Number,
      min: 30,
      max: 300,
    },
    targetDate: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
