// Core type definitions for the fitness tracking app

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  height?: number; // in cm
  createdAt: string;
}

export interface UserSession {
  userId: string;
  username: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    username: string;
  };
}

export interface WeightEntry {
  id: string;
  userId: string;
  weight: number; // in kg
  timestamp: string;
  bmi?: number;
}

export interface BodyStats {
  height?: number; // in cm
  latestWeight?: number; // in kg
  latestBmi?: number;
  latestWeightDate?: string;
  weightHistory: WeightEntry[];
}

export interface FoodEntry {
  id: string;
  userId: string;
  name: string;
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  timestamp: string;
  date: string; // YYYY-MM-DD
}

export interface DailyNutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  entryCount: number;
}

export interface DailyNutrition {
  date: string;
  totals: DailyNutritionTotals;
}

export type WorkoutType = 'running' | 'swimming' | 'gym';

export interface WorkoutEntry {
  id: string;
  userId: string;
  type: WorkoutType;
  caloriesBurned: number;
  timestamp: string;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface DailyWorkoutTotals {
  totalCaloriesBurned: number;
  entryCount: number;
  byType: {
    running: number;
    swimming: number;
    gym: number;
  };
}
