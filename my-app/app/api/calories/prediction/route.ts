import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { WeightEntry } from '@/lib/models/WeightEntry';
import { FoodEntry } from '@/lib/models/FoodEntry';
import { WorkoutEntry } from '@/lib/models/WorkoutEntry';
import { calculateBMR, calculateDynamicActivityMultiplier, calculateTDEE, calculateAverageDailyBurn } from '@/lib/calories';

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

    // Check if user has complete profile
    if (!user.height || !user.age || !user.gender) {
      return NextResponse.json({
        success: false,
        message: 'Complete your profile to see predictions',
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
        message: 'Log your weight to see predictions',
        missingWeight: true,
      });
    }

    // Get date range for the past N days
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    // Generate array of dates
    const dateArray: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dateArray.push(d.toISOString().split('T')[0]);
    }

    // Get food entries for the period
    const foodEntries = await FoodEntry.aggregate([
      {
        $match: {
          userId: userId,
          date: { $in: dateArray },
        },
      },
      {
        $group: {
          _id: '$date',
          totalCalories: { $sum: '$calories' },
        },
      },
    ]);

    // Get workout entries for the period
    const workoutEntries = await WorkoutEntry.aggregate([
      {
        $match: {
          userId: userId,
          date: { $in: dateArray },
        },
      },
      {
        $group: {
          _id: '$date',
          totalBurned: { $sum: '$caloriesBurned' },
        },
      },
    ]);

    // Create maps for easy lookup
    const foodMap = new Map(foodEntries.map(e => [e._id, e.totalCalories]));
    const workoutMap = new Map(workoutEntries.map(e => [e._id, e.totalBurned]));

    // Calculate workout history for dynamic TDEE calculation
    const workoutHistory = dateArray.map(date => workoutMap.get(date) || 0);
    
    // Calculate BMR and dynamic TDEE
    const bmr = calculateBMR(
      latestWeight.weight,
      user.height,
      user.age,
      user.gender
    );
    const averageDailyBurn = calculateAverageDailyBurn(workoutHistory);
    const activityMultiplier = calculateDynamicActivityMultiplier(bmr, averageDailyBurn);
    const tdee = calculateTDEE(bmr, activityMultiplier);

    // Calculate daily deficits
    let totalDeficit = 0;
    const dailyData = dateArray.map(date => {
      const consumed = foodMap.get(date) || 0;
      const burned = workoutMap.get(date) || 0;
      const net = consumed - burned;
      const deficit = tdee - net;
      totalDeficit += deficit;

      return {
        date,
        consumed,
        burned,
        net,
        deficit,
      };
    });

    // Calculate predicted weight change
    // 7700 calories = 1 kg
    const predictedWeightChange = totalDeficit / 7700;
    const predictedWeight = latestWeight.weight - predictedWeightChange;

    // Calculate average daily deficit
    const avgDailyDeficit = totalDeficit / days;

    // Calculate days with data
    const daysWithData = dailyData.filter(d => d.consumed > 0 || d.burned > 0).length;

    return NextResponse.json({
      success: true,
      prediction: {
        days,
        daysWithData,
        currentWeight: latestWeight.weight,
        predictedWeightChange,
        predictedWeight,
        totalDeficit,
        avgDailyDeficit,
        tdee,
        bmr,
        averageDailyBurn,
        activityMultiplier: Math.round(activityMultiplier * 100) / 100,
        dailyData,
      },
    });
  } catch (error) {
    console.error('Prediction calculation error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while calculating prediction' },
      { status: 500 }
    );
  }
}
