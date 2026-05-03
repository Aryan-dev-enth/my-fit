# Centralized Calorie Calculations

## Overview
Created a single source of truth for all calorie calculations across the entire app. No more inconsistencies!

## 🎯 The Problem Before

**Multiple calculation methods scattered everywhere:**
```typescript
// In Dashboard:
const remaining = tdee + burned - consumed;
const actualDeficit = tdee - consumed; // WRONG!

// In API:
const deficit = totalBudget - consumed;

// In History:
const deficit = tdee - consumed; // Different from dashboard!
```

**Result:** Confusing, inconsistent numbers everywhere! 😵

## ✅ The Solution

**One function, used everywhere:**
```typescript
// lib/calorieCalculations.ts
export function calculateCalories(input: {
  tdee: number;
  consumed: number;
  burned: number;
}) {
  const totalBudget = tdee + burned;
  const remaining = totalBudget - consumed;
  const actualDeficit = remaining; // Same thing!
  
  return {
    totalBudget,
    remaining,
    actualDeficit,
    isDeficit: actualDeficit > 0,
    isSurplus: actualDeficit < 0,
    expectedWeightChange: actualDeficit / 7700,
    // ... more
  };
}
```

## 📐 The Formula (Consistent Everywhere)

```
Given:
- TDEE (Maintenance): 2000 kcal
- Workout Burned: 500 kcal
- Eaten: 1800 kcal

Calculations:
1. Total Budget = TDEE + Workout
   = 2000 + 500 = 2500 kcal

2. Remaining = Total Budget - Eaten
   = 2500 - 1800 = 700 kcal

3. Actual Deficit = Remaining
   = 700 kcal (positive = losing weight)

4. Weight Change = Deficit / 7700
   = 700 / 7700 = 0.091 kg loss
```

## 🔧 What Changed

### 1. Created Central Function
**File:** `lib/calorieCalculations.ts`

**Exports:**
- `calculateCalories()` - Main calculation function
- `calculateTotalDeficit()` - Sum multiple days
- `formatCalories()` - Format with sign (+/-)
- `formatWeightChange()` - Format with arrow (↓/↑)
- `getDeficitStatus()` - Get status (Deficit/Surplus)

### 2. Updated API
**File:** `app/api/calories/history/route.ts`

**Before:**
```typescript
const deficit = tdee - consumed; // Wrong!
```

**After:**
```typescript
const calculation = calculateCalories({ tdee, consumed, burned });
const deficit = calculation.actualDeficit; // Correct!
```

### 3. Updated Dashboard
**File:** `components/MainDashboard.tsx`

**Before:**
```typescript
const remainingCalories = data.tdee + data.burned - data.consumed;
const actualDeficit = data.tdee - data.consumed; // Different!
```

**After:**
```typescript
const todayCalculation = calculateCalories({
  tdee: data.tdee,
  consumed: data.consumed,
  burned: data.burned,
});
// Use todayCalculation.remaining, todayCalculation.actualDeficit, etc.
```

## 📊 What's Calculated

### Input
```typescript
{
  tdee: 2000,      // Maintenance calories
  consumed: 1800,  // What you ate
  burned: 500      // Workout calories
}
```

### Output
```typescript
{
  // Budget
  maintenance: 2000,
  workoutBonus: 500,
  totalBudget: 2500,
  
  // Consumption
  consumed: 1800,
  
  // Remaining
  remaining: 700,
  remainingPercentage: 28,
  
  // Deficit
  actualDeficit: 700,
  isDeficit: true,
  isSurplus: false,
  
  // Weight
  expectedWeightChange: 0.091 // kg
}
```

## 🎨 Helper Functions

### formatCalories()
```typescript
formatCalories(700)      // "+700"
formatCalories(-300)     // "-300"
formatCalories(700, false) // "700" (no sign)
```

### formatWeightChange()
```typescript
formatWeightChange(0.5)   // "↓ 0.50 kg"
formatWeightChange(-0.3)  // "↑ 0.30 kg"
formatWeightChange(0)     // "→ 0.00 kg"
```

### getDeficitStatus()
```typescript
getDeficitStatus(true)   // { text: "Deficit", emoji: "✓", color: "green" }
getDeficitStatus(false)  // { text: "Surplus", emoji: "✗", color: "red" }
```

## 📍 Where It's Used

### 1. Dashboard - Today's Calories Card
```typescript
const todayCalculation = calculateCalories({
  tdee: data.tdee,
  consumed: data.consumed,
  burned: data.burned,
});

// Display:
// - Remaining: todayCalculation.remaining
// - Budget: todayCalculation.totalBudget
// - Deficit: todayCalculation.actualDeficit
```

### 2. Dashboard - Deficit History Table
```typescript
data.deficitHistory.last10Days.map(day => {
  const dayCalc = calculateCalories({
    tdee: data.tdee,
    consumed: day.consumed,
    burned: day.burned,
  });
  
  // Display each day's deficit consistently
});
```

### 3. API - History Endpoint
```typescript
for (const date of dateArray) {
  const calculation = calculateCalories({
    tdee,
    consumed,
    burned,
  });
  
  dailyData.push({
    deficit: calculation.actualDeficit
  });
}
```

## ✅ Benefits

### 1. Consistency
- **Same formula everywhere**
- **Same results everywhere**
- **No confusion**

### 2. Maintainability
- **One place to update**
- **Easy to test**
- **Clear documentation**

### 3. Correctness
- **No more calculation bugs**
- **Proper deficit calculation**
- **Accurate weight predictions**

### 4. Clarity
- **Helper functions for formatting**
- **Clear variable names**
- **Type-safe**

## 🔍 Example Scenarios

### Scenario 1: Deficit Day
```typescript
Input:
  TDEE: 2000
  Burned: 500
  Eaten: 1800

Output:
  Total Budget: 2500
  Remaining: 700 ✅
  Deficit: +700 kcal
  Status: ✓ Deficit
  Weight: ↓ 0.09 kg
```

### Scenario 2: Surplus Day
```typescript
Input:
  TDEE: 2000
  Burned: 0
  Eaten: 2300

Output:
  Total Budget: 2000
  Remaining: -300 ❌
  Deficit: -300 kcal
  Status: ✗ Surplus
  Weight: ↑ 0.04 kg
```

### Scenario 3: Perfect Balance
```typescript
Input:
  TDEE: 2000
  Burned: 500
  Eaten: 2500

Output:
  Total Budget: 2500
  Remaining: 0 ⚖️
  Deficit: 0 kcal
  Status: Maintenance
  Weight: → 0.00 kg
```

## 📝 Summary

**Before:**
- ❌ Multiple calculation methods
- ❌ Inconsistent results
- ❌ Confusing numbers
- ❌ Hard to maintain

**After:**
- ✅ Single source of truth
- ✅ Consistent everywhere
- ✅ Clear and accurate
- ✅ Easy to maintain

**Formula (Used Everywhere):**
```
Deficit = (TDEE + Workout) - Eaten
Weight Change = Deficit / 7700 kcal per kg
```

**Result:** No more confusion! All numbers match across the entire app! 🎉
