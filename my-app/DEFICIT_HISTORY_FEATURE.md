# Deficit History Feature

## Overview
Added a comprehensive deficit history section showing the last 10 days of calorie tracking and 30-day totals with expected weight change calculations.

## 🎯 What It Shows

### 1. 30-Day Summary Cards

#### Total Deficit
- Sum of all daily deficits over 30 days
- Shows total calorie deficit/surplus
- Example: 21,000 kcal deficit

#### Average Daily Deficit
- Average deficit per day
- Calculated as: Total Deficit ÷ 30 days
- Example: 700 kcal/day

#### Expected Weight Change
- Predicted weight loss/gain based on deficit
- Formula: Total Deficit ÷ 7,700 kcal = kg change
- Shows ↓ for loss, ↑ for gain
- Color coded: Green (loss), Red (gain)

### 2. Last 10 Days Table

Shows daily breakdown with:
- **Date** - Day of the entry
- **Eaten** - Calories consumed
- **Burned** - Workout calories
- **Deficit** - Daily calorie deficit/surplus
- **Status** - Visual indicator (✓ Deficit or ✗ Surplus)

## 🧮 Calculations

### Deficit Formula
```
Deficit = (TDEE + Workout Burned) - Eaten

Examples:
1. TDEE: 2000, Burned: 500, Eaten: 1800
   Deficit = (2000 + 500) - 1800 = 700 kcal ✓

2. TDEE: 2000, Burned: 0, Eaten: 2300
   Deficit = (2000 + 0) - 2300 = -300 kcal ✗
```

### Weight Change Formula
```
1 kg of body fat ≈ 7,700 kcal

Weight Change (kg) = Total Deficit ÷ 7,700

Examples:
1. Total Deficit: 21,000 kcal
   Weight Loss = 21,000 ÷ 7,700 = 2.73 kg ↓

2. Total Deficit: -7,700 kcal (surplus)
   Weight Gain = -7,700 ÷ 7,700 = 1.00 kg ↑
```

## 📊 Visual Design

### Summary Cards Layout
```
┌─────────────────────────────────────────────────────┐
│ 30-Day Total Deficit  │ Avg Daily Deficit │ Weight  │
│      21,000 kcal      │    700 kcal/day   │ ↓2.73kg │
│      (Blue)           │     (Purple)      │ (Green) │
└─────────────────────────────────────────────────────┘
```

### Table Layout
```
┌──────────────────────────────────────────────────────┐
│ Date      │ Eaten │ Burned │ Deficit │ Status       │
├──────────────────────────────────────────────────────┤
│ May 3     │ 1800  │ +500   │ +700    │ ✓ Deficit    │
│ May 2     │ 2100  │ +300   │ +200    │ ✓ Deficit    │
│ May 1     │ 2400  │ -      │ -400    │ ✗ Surplus    │
│ ...       │ ...   │ ...    │ ...     │ ...          │
└──────────────────────────────────────────────────────┘
```

## 🎨 Color Coding

### Deficit (Positive)
- **Color:** Green
- **Meaning:** Losing weight
- **Icon:** ✓
- **Example:** +700 kcal

### Surplus (Negative)
- **Color:** Red
- **Meaning:** Gaining weight
- **Icon:** ✗
- **Example:** -300 kcal

### Summary Cards
- **Blue:** Total deficit
- **Purple:** Average daily
- **Green/Red:** Weight change (green = loss, red = gain)

## 📱 Features

### Highlights Today
- First row in table
- Gray background
- "(Today)" label

### Responsive Design
- Cards stack on mobile
- Table scrolls horizontally if needed
- Readable on all screen sizes

### Real-time Updates
- Refreshes with dashboard
- Shows current day's data
- Updates every 30 seconds

## 🔧 Technical Details

### API Endpoint
**GET** `/api/calories/history?userId={id}&days={number}`

**Response:**
```json
{
  "success": true,
  "history": {
    "dailyData": [
      {
        "date": "2026-05-03",
        "consumed": 1800,
        "burned": 500,
        "deficit": 700,
        "formattedDate": "May 3"
      }
    ],
    "totalDeficit": 21000,
    "expectedWeightChange": 2.73,
    "tdee": 2000,
    "days": 30
  }
}
```

### Data Sources
- **Food Entries:** FoodEntry collection
- **Workout Entries:** WorkoutEntry collection
- **User Profile:** For TDEE calculation
- **Date Range:** Last 30 days

### Calculations
1. Fetch all food and workout entries for 30 days
2. Group by date
3. Calculate daily deficit: (TDEE + Burned) - Consumed
4. Sum all deficits for 30-day total
5. Calculate average: Total ÷ 30
6. Calculate weight change: Total ÷ 7,700

## 💡 Use Cases

### Scenario 1: Tracking Progress
```
User wants to see if they're on track:
1. Opens dashboard
2. Scrolls to Deficit History
3. Sees 30-day total: 21,000 kcal
4. Sees expected loss: 2.73 kg
5. Compares with actual weight loss
```

### Scenario 2: Identifying Problem Days
```
User's weight isn't dropping:
1. Checks last 10 days table
2. Sees several surplus days (red)
3. Identifies pattern (weekends)
4. Adjusts eating habits
```

### Scenario 3: Validating Workouts
```
User adds workouts:
1. Sees "Burned" column increase
2. Sees deficit improve
3. Confirms workouts are helping
```

## 📈 Benefits

### Accountability
- See exactly where you stand
- Can't hide from the numbers
- Clear cause and effect

### Motivation
- Visual progress over 30 days
- Expected weight change is concrete
- Green checkmarks feel good

### Insights
- Identify patterns (good and bad days)
- See impact of workouts
- Understand your trends

### Planning
- Know if you need to adjust
- See if current pace is sustainable
- Make informed decisions

## 🎯 Key Insights

### What Users Learn

1. **Consistency Matters**
   - See how daily choices add up
   - Small deficits compound over time

2. **Workouts Help**
   - See burned calories in action
   - Understand their contribution

3. **Reality Check**
   - Expected vs actual weight change
   - Adjust expectations or habits

4. **Pattern Recognition**
   - Identify good/bad days
   - Spot trends and cycles

## 📊 Example Scenarios

### Successful Weight Loss
```
30-Day Total: 21,000 kcal deficit
Avg Daily: 700 kcal/day
Expected: ↓ 2.73 kg

Last 10 Days:
✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓
All green checkmarks!
```

### Struggling to Lose
```
30-Day Total: 3,500 kcal deficit
Avg Daily: 117 kcal/day
Expected: ↓ 0.45 kg

Last 10 Days:
✓ ✗ ✓ ✗ ✗ ✓ ✗ ✓ ✓ ✗
Mixed results - need consistency
```

### Gaining Weight
```
30-Day Total: -7,700 kcal surplus
Avg Daily: -257 kcal/day
Expected: ↑ 1.00 kg

Last 10 Days:
✗ ✗ ✗ ✗ ✗ ✗ ✗ ✗ ✗ ✗
All red - eating too much
```

## 🚀 Future Enhancements

Potential additions:
- [ ] Weekly breakdown view
- [ ] Monthly comparison chart
- [ ] Export to CSV
- [ ] Goal setting (target deficit)
- [ ] Streak tracking (consecutive deficit days)
- [ ] Trend analysis (improving/declining)
- [ ] Predictions based on trends

## 📝 Summary

The Deficit History feature provides:
- ✅ **30-day overview** - Total and average deficits
- ✅ **Expected weight change** - Based on science
- ✅ **10-day breakdown** - Recent daily details
- ✅ **Visual indicators** - Easy to understand
- ✅ **Actionable insights** - Make informed decisions

**Result:** Users can track their progress, identify patterns, and stay motivated with clear, data-driven feedback!
