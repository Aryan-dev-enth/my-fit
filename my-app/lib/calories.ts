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
 * Calculate TDEE (Total Daily Energy Expenditure) - maintenance calories
 * Always uses sedentary multiplier (1.2) since workouts are logged manually
 */
export function calculateTDEE(bmr: number): number {
  const sedentaryMultiplier = 1.2;
  return Math.round(bmr * sedentaryMultiplier);
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
 * Calculate maintenance calories based on user profile
 * Uses sedentary multiplier (1.2) since workouts are logged manually
 * 
 * @param profile - User profile (weight, height, age, gender)
 * @returns Maintenance calories (base TDEE)
 */
export function calculateMaintenanceCalories(profile: UserProfile): number {
  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  return calculateTDEE(bmr);
}

/**
 * Calculate complete calorie breakdown for a day
 * Uses sedentary TDEE (1.2) since workouts are logged manually
 * 
 * @param profile - User profile
 * @param consumed - Calories consumed today
 * @param burned - Calories burned today
 * @returns Complete calorie calculation
 */
export function calculateDailyCalories(
  profile: UserProfile,
  consumed: number,
  burned: number
): CalorieCalculation {
  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr);
  const net = consumed - burned;
  const deficit = tdee - net;

  return {
    bmr,
    tdee,
    consumed,
    burned,
    net,
    deficit,
    activityMultiplier: 1.2, // Always sedentary since workouts are manual
    averageDailyBurn: 0, // Not used anymore
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
