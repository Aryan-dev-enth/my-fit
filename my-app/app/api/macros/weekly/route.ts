import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { FoodEntry } from '@/lib/models/FoodEntry';
import { WorkoutEntry } from '@/lib/models/WorkoutEntry';
import { User } from '@/lib/models/User';
import { WeightEntry } from '@/lib/models/WeightEntry';
import { calculateBMR, calculateTDEE } from '@/lib/calories';
import { Types } from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '7');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get user profile
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get latest weight
    const latestWeight = await WeightEntry.findOne({ userId })
      .sort({ timestamp: -1 })
      .lean();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));

    // Generate array of dates
    const dateArray: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dateArray.push(d.toISOString().split('T')[0]);
    }

    // Convert userId to ObjectId
    const userObjectId = new Types.ObjectId(userId);

    // Fetch food entries for the period
    const foodEntries = await FoodEntry.find({
      userId: userObjectId,
      date: { $in: dateArray }
    }).lean();

    // Fetch workout entries for the period
    const workoutEntries = await WorkoutEntry.find({
      userId: userObjectId,
      date: { $in: dateArray }
    }).lean();

    // Calculate ideal macros if profile is complete
    let idealMacros = null;
    if (user.height && user.age && user.gender && latestWeight) {
      const bmr = calculateBMR(latestWeight.weight, user.height, user.age, user.gender);
      const tdee = calculateTDEE(bmr);

      // Calculate average daily workout calories
      const totalWorkoutCalories = workoutEntries.reduce((sum, entry) => sum + entry.caloriesBurned, 0);
      const avgDailyWorkout = totalWorkoutCalories / days;
      const avgDailyBudget = tdee + avgDailyWorkout;

      // Macro split: 30% protein, 40% carbs, 30% fat
      idealMacros = {
        protein: Math.round((avgDailyBudget * 0.30) / 4), // 4 cal/g
        carbs: Math.round((avgDailyBudget * 0.40) / 4), // 4 cal/g
        fat: Math.round((avgDailyBudget * 0.30) / 9), // 9 cal/g
        calories: Math.round(avgDailyBudget),
        tdee,
        avgDailyWorkout: Math.round(avgDailyWorkout),
      };
    }

    // Group food entries by date
    const dailyMacros = dateArray.map(date => {
      const dayFoods = foodEntries.filter(entry => entry.date === date);
      const dayWorkouts = workoutEntries.filter(entry => entry.date === date);

      const protein = dayFoods.reduce((sum, entry) => sum + entry.protein, 0);
      const carbs = dayFoods.reduce((sum, entry) => sum + entry.carbs, 0);
      const fat = dayFoods.reduce((sum, entry) => sum + entry.fat, 0);
      const calories = dayFoods.reduce((sum, entry) => sum + entry.calories, 0);
      const workoutCalories = dayWorkouts.reduce((sum, entry) => sum + entry.caloriesBurned, 0);

      const dateObj = new Date(date + 'T00:00:00');
      return {
        date,
        formattedDate: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayOfWeek: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
        calories: Math.round(calories),
        workoutCalories: Math.round(workoutCalories),
        hasData: dayFoods.length > 0,
      };
    });

    // Calculate weekly totals and averages
    const weeklyTotals = {
      protein: dailyMacros.reduce((sum, day) => sum + day.protein, 0),
      carbs: dailyMacros.reduce((sum, day) => sum + day.carbs, 0),
      fat: dailyMacros.reduce((sum, day) => sum + day.fat, 0),
      calories: dailyMacros.reduce((sum, day) => sum + day.calories, 0),
      workoutCalories: dailyMacros.reduce((sum, day) => sum + day.workoutCalories, 0),
    };

    const daysWithData = dailyMacros.filter(day => day.hasData).length;
    const weeklyAverages = daysWithData > 0 ? {
      protein: Math.round(weeklyTotals.protein / daysWithData),
      carbs: Math.round(weeklyTotals.carbs / daysWithData),
      fat: Math.round(weeklyTotals.fat / daysWithData),
      calories: Math.round(weeklyTotals.calories / daysWithData),
      workoutCalories: Math.round(weeklyTotals.workoutCalories / daysWithData),
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        idealMacros,
        dailyMacros: dailyMacros.reverse(), // Most recent first
        weeklyTotals,
        weeklyAverages,
        daysWithData,
        days,
      },
    });
  } catch (error) {
    console.error('Weekly macros error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching weekly macros' },
      { status: 500 }
    );
  }
}
