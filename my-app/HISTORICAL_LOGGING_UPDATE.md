# Historical Logging & Macro Display Update

## Overview
This update adds the ability to log food and workouts for past dates, and improves the macro display on the dashboard.

## Features Implemented

### 1. ✅ Historical Date Logging
**Problem:** Users could navigate to past dates but entries were always logged to today.

**Solution:**
- Modified API endpoints to accept a `date` parameter
- Food and workout entries now log to the selected date, not just today
- Entries are timestamped with the selected date + current time

**Files Changed:**
- `my-app/app/api/food/route.ts` - Added date parameter support
- `my-app/app/api/workout/route.ts` - Added date parameter support
- `my-app/components/FoodPage.tsx` - Sends selected date to API
- `my-app/components/WorkoutPage.tsx` - Sends selected date to API

### 2. ✅ Enhanced Date Navigation
**Problem:** Users could only navigate day-by-day with arrow buttons.

**Solution:**
- Added date picker input for quick date selection
- Users can now jump to any past date directly
- Date picker prevents selecting future dates
- Visual indicator shows when logging to a past date

**Features:**
- ⬅️ Previous day button
- ➡️ Next day button (disabled for today)
- 📅 Date picker for direct date selection
- 🏷️ Badge showing "Logging to [date]" when not today

### 3. ✅ Fixed Macro Display on Dashboard
**Problem:** Macro circles showed no progress even when food was logged.

**Solution:**
- Fixed circular progress calculation
- Shows actual progress vs goals
- Displays percentage completion
- Shows goal amounts (e.g., "50 / 200g")

**Macro Goals (based on TDEE):**
- **Carbs:** 40% of calories (4 cal/g)
- **Protein:** 30% of calories (4 cal/g)
- **Fat:** 30% of calories (9 cal/g)

### 4. ✅ Improved User Experience

**Visual Indicators:**
- Blue badge when logging to past dates
- Percentage display under each macro
- Goal amounts shown in circles
- Smooth progress animations

**Date Display:**
- "Today" for current date
- "Yesterday" for previous day
- Full date for older entries

## How to Use

### Logging Food/Workouts for Past Dates

1. **Navigate to Food or Workout tab**
2. **Select a date using:**
   - Arrow buttons (← →) to go day by day
   - Date picker to jump to any date
3. **Log your entry** - it will be saved to the selected date
4. **Visual confirmation** - Blue badge shows which date you're logging to

### Viewing Historical Data

- Use date navigation to view entries from any past day
- All entries are organized by date
- Dashboard shows today's data only

### Understanding Macros

The dashboard displays:
- **Current intake** (center number)
- **Goal amount** (below center)
- **Progress percentage** (below label)
- **Visual progress** (colored circle)

## Technical Details

### API Changes

**POST /api/food**
```json
{
  "userId": "string",
  "name": "string",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "date": "YYYY-MM-DD" // Optional, defaults to today
}
```

**POST /api/workout**
```json
{
  "userId": "string",
  "type": "running" | "swimming" | "gym",
  "caloriesBurned": number,
  "notes": "string",
  "date": "YYYY-MM-DD" // Optional, defaults to today
}
```

### Database Schema
No changes required - existing schema already supports date-based queries.

## Benefits

✅ **No more missed entries** - Log forgotten meals/workouts from past days
✅ **Better tracking** - Complete historical data for accurate predictions
✅ **Flexible logging** - Log entries whenever you remember them
✅ **Clear visualization** - See macro progress at a glance
✅ **Accurate calculations** - Calorie predictions based on complete data

## Future Enhancements (Optional)

- [ ] Bulk import from past dates
- [ ] Copy entries from one day to another
- [ ] Weekly/monthly macro summaries
- [ ] Macro goal customization per user
- [ ] Meal templates for quick logging
- [ ] Reminder notifications for missing entries

## Testing Checklist

- [x] Log food to today's date
- [x] Log food to yesterday
- [x] Log food to a date 1 week ago
- [x] Navigate using arrow buttons
- [x] Navigate using date picker
- [x] View entries from different dates
- [x] Delete entries from past dates
- [x] Verify dashboard shows correct macros
- [x] Check macro progress circles animate
- [x] Verify date badge appears for past dates

## Notes

- Entries cannot be logged to future dates (date picker max is today)
- Timestamps use the selected date with current time
- Dashboard always shows today's data
- Historical entries don't affect today's dashboard
