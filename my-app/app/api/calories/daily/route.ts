import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { WeightEntry } from '@/lib/models/WeightEntry';
import { FoodEntry } from '@/lib/models/FoodEntry';
import { WorkoutEntry } from '@/lib/models/WorkoutEntry';
import { calculateDailyCalories } from '@/lib/calories';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date'); // YYYY-MM-DD format

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { success: false, message: 'Date is required' },
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

    // Check if user has complete profile
    if (!user.height || !user.age || !user.gender) {
      return NextResponse.json({
        success: false,
        message: 'Complete your profile (height, age, gender) to calculate calories',
        missingProfile: true,
      });
    }

    // Get latest weight
    const latestWeight = await WeightEntry.findOne({ userId })
      .sort({ timestamp: -1 })
      .lean();

    if (!latestWeight) {
      return NextResponse.json({
        success: false,
        message: 'Log your weight to calculate calories',
        missingWeight: true,
      });
    }

    // Get food entries for the date
    const foodEntries = await FoodEntry.find({ userId, date }).lean();
    const totalConsumed = foodEntries.reduce((sum, entry) => sum + entry.calories, 0);

    // Get workout entries for the date
    const workoutEntries = await WorkoutEntry.find({ userId, date }).lean();
    const totalBurned = workoutEntries.reduce((sum, entry) => sum + entry.caloriesBurned, 0);

    // Get workout history for last 7 days (excluding today) for dynamic activity calculation
    const targetDate = new Date(date);
    const sevenDaysAgo = new Date(targetDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get all workout entries from last 7 days (excluding today)
    const historicalWorkouts = await WorkoutEntry.find({
      userId,
      date: {
        $gte: sevenDaysAgo.toISOString().split('T')[0],
        $lt: date, // Exclude today
      },
    }).lean();

    // Group by date and sum calories burned per day
    const dailyBurnMap = new Map<string, number>();
    historicalWorkouts.forEach((workout) => {
      const currentTotal = dailyBurnMap.get(workout.date) || 0;
      dailyBurnMap.set(workout.date, currentTotal + workout.caloriesBurned);
    });

    // Convert to array of daily totals
    const workoutHistory = Array.from(dailyBurnMap.values());

    // Calculate calories using dynamic activity multiplier
    const calculation = calculateDailyCalories(
      {
        weight: latestWeight.weight,
        height: user.height,
        age: user.age,
        gender: user.gender,
      },
      totalConsumed,
      totalBurned,
      workoutHistory
    );

    return NextResponse.json({
      success: true,
      date,
      calculation,
      debug: {
        workoutHistoryDays: workoutHistory.length,
        averageDailyBurn: calculation.averageDailyBurn,
        activityMultiplier: calculation.activityMultiplier,
      },
    });
  } catch (error) {
    console.error('Daily calories calculation error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while calculating calories' },
      { status: 500 }
    );
  }
}
