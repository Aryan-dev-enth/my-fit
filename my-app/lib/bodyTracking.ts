// Body tracking utilities and calculations
import { WeightEntry } from './types';

export function calculateBMI(weight: number, height: number): number {
  // BMI = weight (kg) / (height (m))^2
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 10) / 10; // Round to 1 decimal place
}

export function getBMICategory(bmi: number): { category: string; color: string } {
  if (bmi < 18.5) {
    return { category: 'Underweight', color: 'text-blue-600 dark:text-blue-400' };
  } else if (bmi < 25) {
    return { category: 'Normal', color: 'text-green-600 dark:text-green-400' };
  } else if (bmi < 30) {
    return { category: 'Overweight', color: 'text-orange-600 dark:text-orange-400' };
  } else {
    return { category: 'Obese', color: 'text-red-600 dark:text-red-400' };
  }
}

export function generateWeightEntryId(): string {
  return `weight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function validateHeight(height: number): { valid: boolean; message?: string } {
  if (!height || isNaN(height)) {
    return { valid: false, message: 'Height is required' };
  }
  if (height < 50 || height > 300) {
    return { valid: false, message: 'Height must be between 50 and 300 cm' };
  }
  return { valid: true };
}

export function validateWeight(weight: number): { valid: boolean; message?: string } {
  if (!weight || isNaN(weight)) {
    return { valid: false, message: 'Weight is required' };
  }
  if (weight < 20 || weight > 500) {
    return { valid: false, message: 'Weight must be between 20 and 500 kg' };
  }
  return { valid: true };
}

export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

export function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
