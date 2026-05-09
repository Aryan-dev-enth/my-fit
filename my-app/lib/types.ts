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

// New structured workout types
export type WorkoutPlanType = 
  | 'chest-triceps'
  | 'back-biceps'
  | 'swimming-core'
  | 'legs-shoulders'
  | 'swimming-light'
  | 'plyo-sprints'
  | 'rest'
  | 'custom';

export interface ExerciseSet {
  setNumber: number;
  completed: boolean;
  weight?: number; // in kg or lbs
  reps?: number;
  notes?: string;
}

export interface Exercise {
  id: string;
  name: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  sets: ExerciseSet[];
  category?: string; // e.g., 'chest', 'triceps', 'cardio'
}

export interface WorkoutSession {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  workoutType: WorkoutPlanType;
  exercises: Exercise[];
  duration?: number; // in minutes
  caloriesBurned?: number;
  notes?: string;
  completed: boolean;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  workoutType: WorkoutPlanType;
  exercises: Omit<Exercise, 'id' | 'sets'>[];
  estimatedDuration: number; // in minutes
  estimatedCaloriesMin: number;
  estimatedCaloriesMax: number;
  description?: string;
}

export interface WeeklyWorkoutPlan {
  monday: WorkoutPlanType;
  tuesday: WorkoutPlanType;
  wednesday: WorkoutPlanType;
  thursday: WorkoutPlanType;
  friday: WorkoutPlanType;
  saturday: WorkoutPlanType;
  sunday: WorkoutPlanType;
}
