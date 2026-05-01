# Dynamic Calorie Calculation System

## Overview

The fitness tracking application now uses **real workout data** to calculate maintenance calories dynamically, instead of relying on fixed activity level multipliers.

---

## How It Works

### **STEP 1: Calculate BMR (Basal Metabolic Rate)**

Uses the **Mifflin-St Jeor Equation**:

**For Males:**
```
BMR = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) + 5
```

**For Females:**
```
BMR = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) − 161
```

---

### **STEP 2: Calculate Activity Multiplier from Real Data**

Instead of using predefined multipliers (sedentary = 1.2, moderate = 1.55, etc.), the system:

1. **Fetches workout history** for the last 7 days
2. **Calculates average daily burn:**
   ```
   average_daily_burn = (sum of last 7 days calories burned) / 7
   ```

3. **Derives dynamic multiplier:**
   ```
   activity_multiplier = 1.2 + (average_daily_burn / BMR)
   ```

4. **Clamps the multiplier:**
   ```
   minimum = 1.2 (sedentary baseline)
   maximum = 1.9 (very active cap)
   ```

---

### **STEP 3: Calculate Maintenance Calories (TDEE)**

```
TDEE = BMR × activity_multiplier
```

This gives you your **daily maintenance calories** based on your actual activity level.

---

### **STEP 4: Calculate Daily Metrics**

```
Net Calories = Consumed - Burned
Deficit/Surplus = TDEE - Net
```

- **Positive deficit** = weight loss
- **Negative deficit** = weight gain (surplus)

---

## Example Calculation

### Input:
- **Weight:** 86 kg
- **Height:** 183 cm
- **Age:** 23 years
- **Gender:** Male
- **Last 7 days workout burns:** [400, 450, 350, 500, 400, 300, 400] kcal

### Calculation:

1. **BMR:**
   ```
   BMR = (10 × 86) + (6.25 × 183) − (5 × 23) + 5
   BMR = 860 + 1143.75 − 115 + 5
   BMR = 1894 kcal
   ```

2. **Average Daily Burn:**
   ```
   average = (400 + 450 + 350 + 500 + 400 + 300 + 400) / 7
   average = 2800 / 7
   average = 400 kcal/day
   ```

3. **Activity Multiplier:**
   ```
   multiplier = 1.2 + (400 / 1894)
   multiplier = 1.2 + 0.211
   multiplier = 1.41
   ```

4. **TDEE (Maintenance):**
   ```
   TDEE = 1894 × 1.41
   TDEE = 2671 kcal/day
   ```

### Result:
Your maintenance calories are **2671 kcal/day** based on your actual workout activity.

---

## Edge Cases Handled

### **No Workout Data:**
- Default multiplier = **1.2** (sedentary baseline)
- TDEE = BMR × 1.2

### **Less than 7 Days of Data:**
- Uses available days to calculate average
- Example: 3 days of data → average of those 3 days

### **Missing Profile Data:**
- Returns error message prompting user to complete profile
- Requires: age, gender, height, weight

### **Extreme Values:**
- Multiplier clamped between **1.2** and **1.9**
- Prevents unrealistic maintenance calculations

---

## Benefits Over Fixed Activity Levels

### **Old System (Fixed):**
- User selects: "Moderate" → multiplier = 1.55
- Same multiplier every day regardless of actual activity
- Inaccurate if user's activity varies

### **New System (Dynamic):**
- Multiplier calculated from **real logged workouts**
- Adapts to user's actual activity level
- More accurate maintenance calories
- Updates automatically as workout patterns change

---

## API Changes

### **`/api/calories/daily`**

**New Response:**
```json
{
  "success": true,
  "calculation": {
    "bmr": 1894,
    "tdee": 2671,
    "consumed": 2200,
    "burned": 400,
    "net": 1800,
    "deficit": 871,
    "activityMultiplier": 1.41,
    "averageDailyBurn": 400
  },
  "debug": {
    "workoutHistoryDays": 7,
    "averageDailyBurn": 400,
    "activityMultiplier": 1.41
  }
}
```

### **`/api/calories/prediction`**

**New Response:**
```json
{
  "success": true,
  "prediction": {
    "days": 7,
    "currentWeight": 86,
    "predictedWeightChange": 0.79,
    "predictedWeight": 85.21,
    "totalDeficit": 6097,
    "avgDailyDeficit": 871,
    "tdee": 2671,
    "bmr": 1894,
    "averageDailyBurn": 400,
    "activityMultiplier": 1.41
  }
}
```

---

## Code Structure

### **`lib/calories.ts`**
- `calculateBMR()` - BMR calculation
- `calculateAverageDailyBurn()` - Average from workout history
- `calculateDynamicActivityMultiplier()` - Dynamic multiplier with clamping
- `calculateTDEE()` - Maintenance calories
- `calculateDailyCalories()` - Complete daily breakdown

### **`app/api/calories/daily/route.ts`**
- Fetches last 7 days of workout data
- Groups by date and sums daily burns
- Passes workout history to calculation function

### **`app/api/calories/prediction/route.ts`**
- Uses dynamic TDEE for predictions
- Calculates weight change based on real activity patterns

---

## User Impact

### **Dashboard Display:**
- Shows **actual maintenance calories** based on workout history
- Displays **activity multiplier** (e.g., 1.41)
- Shows **average daily burn** from workouts

### **More Accurate Predictions:**
- Weight predictions use real activity data
- Adapts to user's actual workout patterns
- No need to manually update activity level

### **Automatic Adaptation:**
- System learns from logged workouts
- Maintenance calories adjust automatically
- Reflects true energy expenditure

---

## Validation

### **Test Case 1: Active User**
- Workouts: 500 kcal/day average
- BMR: 1800
- Multiplier: 1.2 + (500/1800) = 1.48
- TDEE: 1800 × 1.48 = 2664 kcal

### **Test Case 2: Sedentary User**
- Workouts: 0 kcal/day average
- BMR: 1800
- Multiplier: 1.2 + (0/1800) = 1.2
- TDEE: 1800 × 1.2 = 2160 kcal

### **Test Case 3: Very Active User**
- Workouts: 1200 kcal/day average
- BMR: 1800
- Multiplier: 1.2 + (1200/1800) = 1.87 (clamped to 1.87)
- TDEE: 1800 × 1.87 = 3366 kcal

---

## Future Enhancements

1. **Configurable history window** (7/14/30 days)
2. **Weighted average** (recent days count more)
3. **Activity type consideration** (cardio vs strength)
4. **NEAT estimation** (non-exercise activity)
5. **Adaptive learning** (ML-based predictions)

---

## Summary

✅ **Dynamic calculation** based on real workout data  
✅ **No manual activity level selection** needed  
✅ **Automatic adaptation** to changing patterns  
✅ **More accurate** maintenance calories  
✅ **Better predictions** for weight change  
✅ **Edge cases handled** gracefully  

The system now provides **personalized, data-driven** calorie calculations that reflect each user's actual activity level.
