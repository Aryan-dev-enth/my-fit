# Advanced Workout Tracking System

## Overview
This document describes the new structured workout tracking system that replaces the simple workout logging feature. The new system supports detailed exercise tracking with sets, reps, weights, and progress monitoring.

## Features

### 1. Weekly Workout Schedule
- **Pre-defined weekly plan** based on Push-Pull-Legs (PPL) split with cardio and recovery days
- **Default Schedule:**
  - Monday: Chest + Triceps (60-75 min, 300-400 kcal)
  - Tuesday: Back + Biceps (60-75 min, 300-400 kcal)
  - Wednesday: Swimming + Core (45-60 min, 300-350 kcal)
  - Thursday: Legs + Shoulders (70-90 min, 400-500 kcal)
  - Friday: Swimming + Light Pump (45-60 min, 300-350 kcal)
  - Saturday: Plyometrics + Sprints (45-60 min, 350-500 kcal)
  - Sunday: Rest / Recovery (30 min, 50-150 kcal)

### 2. Workout Templates
Each workout type has a predefined template with:
- Exercise list with target sets and rep ranges
- Estimated duration
- Estimated calorie burn range
- Exercise categories (chest, back, legs, etc.)

### 3. Workout Sessions
- **Create sessions** from templates or custom workouts
- **Track each set** with:
  - Checkbox to mark completion
  - Weight used (in kg)
  - Reps completed
  - Optional notes per set
- **Session metadata:**
  - Start/end time
  - Total duration
  - Calories burned
  - Completion status

### 4. Progress Tracking
- **Exercise history** showing previous performances
- **Best set tracking** (highest weight × reps)
- **Visual progress indicators** for improvements
- **Historical data** for each exercise across multiple sessions

### 5. User Interface
- **Weekly calendar view** with workout types for each day
- **Suggested workouts** based on the day of the week
- **Real-time updates** as sets are completed
- **Exercise history modal** accessible from each exercise
- **Mobile-friendly** responsive design

## Data Models

### WorkoutSession
```typescript
{
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  workoutType: WorkoutPlanType;
  exercises: Exercise[];
  duration?: number;
  caloriesBurned?: number;
  notes?: string;
  completed: boolean;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Exercise
```typescript
{
  id: string;
  name: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  sets: ExerciseSet[];
  category?: string;
}
```

### ExerciseSet
```typescript
{
  setNumber: number;
  completed: boolean;
  weight?: number;
  reps?: number;
  notes?: string;
}
```

## API Endpoints

### Workout Sessions
- `GET /api/workout/sessions` - Fetch workout sessions
  - Query params: `userId`, `date`, `startDate`, `endDate`
- `POST /api/workout/sessions` - Create new workout session
- `PUT /api/workout/sessions` - Update existing session
- `DELETE /api/workout/sessions` - Delete session

### Workout History
- `GET /api/workout/history` - Fetch exercise history
  - Query params: `userId`, `exerciseName`, `workoutType`, `limit`

### Daily Totals (Updated)
- `GET /api/workout/daily-totals` - Get calorie totals
  - Now includes both old workout entries and new workout sessions

## Workout Types

1. **chest-triceps** - Push day focusing on chest and triceps
2. **back-biceps** - Pull day focusing on back and biceps
3. **swimming-core** - Cardio swimming with core work
4. **legs-shoulders** - Leg day with shoulder exercises
5. **swimming-light** - Recovery swimming with light pump work
6. **plyo-sprints** - Explosive plyometrics and sprint training
7. **rest** - Active recovery with walking and stretching
8. **custom** - User-defined custom workout

## Usage Flow

1. **Select a date** from the weekly calendar
2. **Create a workout session** by choosing a workout type
   - System suggests the appropriate workout for that day
3. **Complete exercises** by:
   - Checking off each set as completed
   - Entering weight and reps for each set
4. **View exercise history** to see previous performances
5. **Finish workout** to mark session as complete and calculate calories

## Progressive Overload Tracking

The system helps track progressive overload by:
- Showing previous weights and reps for each exercise
- Highlighting best performances
- Maintaining complete history of all workouts
- Allowing comparison across sessions

## Integration with Existing System

- **Calorie tracking** integrates with the main dashboard
- **Daily totals API** combines old and new workout data
- **Backward compatible** with existing workout entries
- **Seamless transition** from simple to advanced tracking

## Future Enhancements

Potential improvements:
- Custom workout templates
- Exercise library with instructions
- Rest timer between sets
- Workout analytics and charts
- Personal records (PRs) tracking
- Workout sharing and social features
- Exercise substitutions
- Deload week planning
- Volume and intensity tracking
