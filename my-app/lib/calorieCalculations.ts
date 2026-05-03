/**
 * Centralized calorie calculation logic
 * Used consistently across the entire app
 */

export interface CalorieCalculationInput {
  tdee: number;           // Maintenance calories (TDEE)
  consumed: number;       // Calories eaten
  burned: number;         // Workout calories burned
}

export interface CalorieCalculationResult {
  // Budget
  maintenance: number;    // TDEE (base maintenance)
  workoutBonus: number;   // Extra calories from workout
  totalBudget: number;    // TDEE + Workout = total you can eat
  
  // Consumption
  consumed: number;       // What you ate
  
  // Remaining
  remaining: number;      // Budget - Consumed (can be negative)
  remainingPercentage: number; // Percentage of budget remaining
  
  // Deficit (for weight loss)
  actualDeficit: number;  // (TDEE + Workout) - Consumed
  isDeficit: boolean;     // True if actualDeficit > 0 (losing weight)
  isSurplus: boolean;     // True if actualDeficit < 0 (gaining weight)
  
  // Weight prediction
  expectedWeightChange: number; // In kg (positive = loss, negative = gain)
}

/**
 * Calculate all calorie-related metrics
 * 
 * Formula:
 * - Total Budget = TDEE + Workout Burned
 * - Remaining = Total Budget - Consumed
 * - Actual Deficit = Total Budget - Consumed (same as remaining)
 * - Weight Change = Actual Deficit / 7700 kcal per kg
 * 
 * @param input - TDEE, consumed, and burned calories
 * @returns Complete calorie calculation results
 */
export function calculateCalories(input: CalorieCalculationInput): CalorieCalculationResult {
  const { tdee, consumed, burned } = input;
  
  // Budget calculation
  const maintenance = tdee;
  const workoutBonus = burned;
  const totalBudget = maintenance + workoutBonus;
  
  // Remaining calculation
  const remaining = totalBudget - consumed;
  const remainingPercentage = totalBudget > 0 ? (remaining / totalBudget) * 100 : 0;
  
  // Deficit calculation (same as remaining)
  const actualDeficit = remaining;
  const isDeficit = actualDeficit > 0;
  const isSurplus = actualDeficit < 0;
  
  // Weight prediction (1 kg = 7700 kcal)
  const expectedWeightChange = actualDeficit / 7700;
  
  return {
    maintenance,
    workoutBonus,
    totalBudget,
    consumed,
    remaining,
    remainingPercentage,
    actualDeficit,
    isDeficit,
    isSurplus,
    expectedWeightChange,
  };
}

/**
 * Calculate total deficit over multiple days
 * 
 * @param dailyCalculations - Array of daily calorie calculations
 * @returns Total deficit and expected weight change
 */
export function calculateTotalDeficit(dailyCalculations: CalorieCalculationResult[]): {
  totalDeficit: number;
  avgDailyDeficit: number;
  totalWeightChange: number;
  days: number;
} {
  const totalDeficit = dailyCalculations.reduce((sum, day) => sum + day.actualDeficit, 0);
  const days = dailyCalculations.length;
  const avgDailyDeficit = days > 0 ? totalDeficit / days : 0;
  const totalWeightChange = totalDeficit / 7700;
  
  return {
    totalDeficit,
    avgDailyDeficit,
    totalWeightChange,
    days,
  };
}

/**
 * Format calorie value with sign
 */
export function formatCalories(value: number, showSign: boolean = true): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${Math.round(value)}`;
}

/**
 * Format weight change with direction arrow
 */
export function formatWeightChange(kg: number): string {
  const arrow = kg > 0 ? '↓' : kg < 0 ? '↑' : '→';
  return `${arrow} ${Math.abs(kg).toFixed(2)} kg`;
}

/**
 * Get status text for deficit/surplus
 */
export function getDeficitStatus(isDeficit: boolean): {
  text: string;
  emoji: string;
  color: 'green' | 'red';
} {
  if (isDeficit) {
    return {
      text: 'Deficit',
      emoji: '✓',
      color: 'green',
    };
  } else {
    return {
      text: 'Surplus',
      emoji: '✗',
      color: 'red',
    };
  }
}
