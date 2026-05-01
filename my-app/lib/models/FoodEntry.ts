import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IFoodEntry {
  userId: Types.ObjectId;
  name: string;
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  timestamp: Date;
  date: string; // YYYY-MM-DD format for easy grouping
}

const FoodEntrySchema = new Schema<IFoodEntry>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  calories: {
    type: Number,
    required: true,
    min: 0,
  },
  protein: {
    type: Number,
    required: true,
    min: 0,
  },
  carbs: {
    type: Number,
    required: true,
    min: 0,
  },
  fat: {
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
});

// Compound index for efficient querying by user and date
FoodEntrySchema.index({ userId: 1, date: -1 });
FoodEntrySchema.index({ userId: 1, timestamp: -1 });

export const FoodEntry: Model<IFoodEntry> = 
  mongoose.models.FoodEntry || mongoose.model<IFoodEntry>('FoodEntry', FoodEntrySchema);
