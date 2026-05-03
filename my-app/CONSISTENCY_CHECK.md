# Dashboard Data Consistency Check

## Core Formula (Used Everywhere)
```
TDEE = BMR × 1.2 (sedentary)
Budget = TDEE + Workout Calories
Deficit = Budget - Eaten
Weight Change = Deficit / 7700 kcal per kg
```

## Data Sources & Consistency

### 1. Today's Calories Card
- **Source**: `/api/calories/daily?date={selectedDate}`
- **Calculation**: Uses `calculateCalories()` from `calorieCalculations.ts`
- **Formula**: ✅ (TDEE + Workout) - Eaten
- **Status**: ✅ Consistent

### 2. Body Stats - Current Weight
- **Source**: `/api/body/weight?limit=1`
- **Data**: Latest weight entry
- **Status**: ✅ Consistent

### 3. Body Stats - 7-Day Forecast
- **Source**: `/api/calories/prediction?days=7`
- **Calculation**: 
  - TDEE (sedentary 1.2)
  - For each day: Budget = TDEE + Workout, Deficit = Budget - Eaten
  - Total Deficit / 7700 = Weight Change
  - Predicted Weight = Current Weight - Weight Change
- **Status**: ✅ Should be consistent now

### 4. Today's Macros
- **Source**: `/api/food/daily-totals?date={selectedDate}`
- **Data**: Sum of protein, carbs, fat for selected date
- **Goals**: Based on TDEE × macro percentages
- **Status**: ✅ Consistent

### 5. Weight Progress Chart
- **Source**: `/api/body/weight?limit=30`
- **Data**: Last 30 weight entries
- **Status**: ✅ Consistent (just displays data)

### 6. Deficit History
- **Source**: `/api/calories/history?days=30`
- **Calculation**: 
  - For each logged day: uses weight from that day
  - TDEE = BMR(weight) × 1.2
  - Deficit = (TDEE + Workout) - Eaten
  - 7-Day Forecast = Avg Daily Deficit × 7 / 7700
- **Status**: ✅ Consistent

### 7. Weekly Macro Tracking
- **Source**: `/api/macros/weekly?days=7`
- **Calculation**:
  - Ideal Macros = (TDEE + Avg Workout) × macro %
  - Actual = Sum of logged macros / days with data
- **Status**: ✅ Consistent

## Potential Issues Fixed

1. ✅ All APIs now use sedentary (1.2) multiplier
2. ✅ Prediction API uses ObjectId for queries
3. ✅ All deficit calculations use: (TDEE + Workout) - Eaten
4. ✅ Weight change uses 7700 kcal per kg consistently
5. ✅ Historical data uses weight from that specific day

## Testing Checklist

- [ ] Today's calories shows correct TDEE (~2255 for 84.5kg)
- [ ] 7-day forecast matches deficit history forecast
- [ ] Deficit history shows correct TDEE per day
- [ ] Weekly macros ideal targets match TDEE + avg workout
- [ ] All weight predictions use same formula
- [ ] Date picker changes all date-specific data correctly
