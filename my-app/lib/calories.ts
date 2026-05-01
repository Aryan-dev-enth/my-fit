// Calorie calculation utilities with dynamic activity calculation

export interface UserProfile {
  weight: number; // kg
  height: number; // cm
  age: number; // years
  gender: 'male' | 'female';
}

export interface CalorieCalculation {
  bmr: number; // Basal Metabolic Rate
  tdee: number; // Total Daily Energy Expenditure (maintenance calories)
  consumed: number; // Calories from food
  burned: number; // Calories from workouts
  net: number; // consumed - burned
  deficit: number; // tdee - net (positive = deficit, negative = surplus)
  activityMultiplier: number; // Dynamic multiplier based on real workout data
  averageDailyBurn: number; // Average calories burned from workouts (last 7 days)
}

/**
 * Calculate BMR using Mifflin-St Jeor Equation
 * Men: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
 * Women: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
 */
export function calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  const bmr = gender === 'male' ? base + 5 : base - 161;
  return Math.round(bmr);
}

/**
 * Calculate dynamic activity multiplier based on real workout data
 * Formula: 1.2 + (average_daily_burn / BMR)
 * Clamped between 1.2 (sedentary) and 1.9 (very active)
 * 
 * @param bmr - Basal Metabolic Rate
 * @param averageDailyBurn - Average calories burned from workouts over last 7 days
 * @returns Activity multiplier between 1.2 and 1.9
 */
export function calculateDynamicActivityMultiplier(bmr: number, averageDailyBurn: number): number {
  const baseMultiplier = 1.2;
  const dynamicComponent = averageDailyBurn / bmr;
  const multiplier = baseMultiplier + dynamicComponent;
  
  // Clamp between 1.2 and 1.9
  return Math.max(1.2, Math.min(1.9, multiplier));
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure) - maintenance calories
 * Uses dynamic activity multiplier based on real workout data
 */
export function calculateTDEE(bmr: number, activityMultiplier: number): number {
  return Math.round(bmr * activityMultiplier);
}

/**
 * Calculate average daily burn from workout history
 * 
 * @param workoutHistory - Array of daily total calories burned (last 7 days)
 * @returns Average daily burn
 */
export function calculateAverageDailyBurn(workoutHistory: number[]): number {
  if (workoutHistory.length === 0) {
    return 0;
  }
  
  const totalBurn = workoutHistory.reduce((sum, burn) => sum + burn, 0);
  return Math.round(totalBurn / workoutHistory.length);
}

/**
 * Calculate maintenance calories based on user profile and workout history
 * 
 * @param profile - User profile (weight, height, age, gender)
 * @param workoutHistory - Array of daily calories burned (last 7 days)
 * @returns Maintenance calories
 */
export function calculateMaintenanceCalories(profile: UserProfile, workoutHistory: number[] = []): number {
  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  const averageDailyBurn = calculateAverageDailyBurn(workoutHistory);
  const activityMultiplier = calculateDynamicActivityMultiplier(bmr, averageDailyBurn);
  return calculateTDEE(bmr, activityMultiplier);
}

/**
 * Calculate complete calorie breakdown for a day
 * Uses dynamic activity calculation based on real workout data
 * 
 * @param profile - User profile
 * @param consumed - Calories consumed today
 * @param burned - Calories burned today
 * @param workoutHistory - Array of daily calories burned (last 7 days, excluding today)
 * @returns Complete calorie calculation
 */
export function calculateDailyCalories(
  profile: UserProfile,
  consumed: number,
  burned: number,
  workoutHistory: number[] = []
): CalorieCalculation {
  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  const averageDailyBurn = calculateAverageDailyBurn(workoutHistory);
  const activityMultiplier = calculateDynamicActivityMultiplier(bmr, averageDailyBurn);
  const tdee = calculateTDEE(bmr, activityMultiplier);
  const net = consumed - burned;
  const deficit = tdee - net;

  return {
    bmr,
    tdee,
    consumed,
    burned,
    net,
    deficit,
    activityMultiplier: Math.round(activityMultiplier * 100) / 100, // Round to 2 decimals
    averageDailyBurn,
  };
}

/**
 * Calculate age from birth year (if we add it later)
 * For now, we'll need to store age or birth date in user profile
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
