import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { FoodEntry } from '@/lib/models/FoodEntry';
import { WorkoutEntry } from '@/lib/models/WorkoutEntry';
import { WeightEntry } from '@/lib/models/WeightEntry';
import { User } from '@/lib/models/User';
import { calculateBMR, calculateTDEE } from '@/lib/calories';
import { calculateCalories } from '@/lib/calorieCalculations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get user profile for TDEE calculation
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get latest weight from WeightEntry
    const latestWeightEntry = await WeightEntry.findOne({ userId })
      .sort({ timestamp: -1 })
      .lean();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Generate array of dates
    const dateArray: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dateArray.push(d.toISOString().split('T')[0]);
    }

    // Get all weight entries for the date range to use day-specific weights
    const weightEntries = await WeightEntry.find({
      userId,
      timestamp: { $lte: endDate } // Get all weights up to end date
    })
    .sort({ timestamp: 1 })
    .lean();

    // Create a map of date -> weight for quick lookup
    // For each date, use the most recent weight ON OR BEFORE that date
    const weightByDate: Record<string, number> = {};
    
    // Build the weight map
    for (const date of dateArray) {
      // Find the most recent weight entry on or before this date
      const dateTimestamp = new Date(date + 'T23:59:59').getTime();
      let weightForDate = null;
      
      for (let i = weightEntries.length - 1; i >= 0; i--) {
        if (new Date(weightEntries[i].timestamp).getTime() <= dateTimestamp) {
          weightForDate = weightEntries[i].weight;
          break;
        }
      }
      
      // If we found a weight, use it; otherwise use latest weight as fallback
      if (weightForDate !== null) {
        weightByDate[date] = weightForDate;
      } else if (latestWeightEntry) {
        weightByDate[date] = latestWeightEntry.weight;
      }
    }
    
    console.log('Weight map created:', Object.keys(weightByDate).length, 'dates with weights');

    // Fetch all food and workout entries for the period
    const [foodEntries, workoutEntries] = await Promise.all([
      FoodEntry.find({
        userId,
        date: { $in: dateArray }
      }).lean(),
      WorkoutEntry.find({
        userId,
        date: { $in: dateArray }
      }).lean()
    ]);

    // Calculate TDEE using latest weight (for validation only)
    let hasCompleteProfile = false;
    if (user.height && user.age && user.gender && user.activityLevel && latestWeightEntry) {
      hasCompleteProfile = true;
    } else {
      // If profile incomplete, return empty data with 200 status
      const missingFields = [];
      if (!user.height) missingFields.push('height');
      if (!user.age) missingFields.push('age');
      if (!user.gender) missingFields.push('gender');
      if (!user.activityLevel) missingFields.push('activity level');
      if (!latestWeightEntry) missingFields.push('weight');
      
      return NextResponse.json({
        success: false,
        message: `Complete your profile to see deficit history. Missing: ${missingFields.join(', ')}`,
        history: {
          dailyData: [],
          totalDeficit: 0,
          expectedWeightChange: 0,
          tdee: 0,
          days: 0
        }
      }, { status: 200 });
    }

    // Use sedentary (1.2) as base since workouts are logged manually
    // No need for activity multiplier variable anymore

    // Group data by date - only include days with entries
    const dailyData: Array<{
      date: string;
      consumed: number;
      burned: number;
      deficit: number;
      weight: number;
      tdee: number;
      formattedDate: string;
    }> = [];

    console.log('=== API DEFICIT CALCULATION DEBUG ===');
    console.log('Date range:', dateArray.length, 'days');
    console.log('Total weight entries:', weightEntries.length);
    console.log('Weight map size:', Object.keys(weightByDate).length);

    for (const date of dateArray) {
      // Sum calories consumed for this date
      const consumed = foodEntries
        .filter(entry => entry.date === date)
        .reduce((sum, entry) => sum + entry.calories, 0);

      // Sum calories burned for this date
      const burned = workoutEntries
        .filter(entry => entry.date === date)
        .reduce((sum, entry) => sum + entry.caloriesBurned, 0);

      // Skip days with no entries (no food and no workout)
      if (consumed === 0 && burned === 0) {
        continue;
      }

      // Use the weight that was valid for this specific date
      const weightForThisDay = weightByDate[date];
      
      if (!weightForThisDay) {
        console.log(`Skipping ${date}: No weight data available for this date`);
        continue;
      }

      // Calculate TDEE for this specific day using the weight from that day
      const bmr = calculateBMR(weightForThisDay, user.height!, user.age!, user.gender!);
      const tdee = calculateTDEE(bmr); // Now uses sedentary (1.2) automatically

      // Calculate deficit directly: (TDEE + Workout) - Eaten
      const dayDeficit = (tdee + burned) - consumed;

      console.log(`Date ${date}: Weight=${weightForThisDay}kg, BMR=${bmr}, TDEE=${tdee}, Consumed=${consumed}, Burned=${burned}, Deficit=${dayDeficit}`);

      const dateObj = new Date(date + 'T00:00:00');
      dailyData.push({
        date,
        consumed,
        burned,
        deficit: dayDeficit,
        weight: weightForThisDay,
        tdee: tdee,
        formattedDate: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }

    // Calculate total deficit by summing all daily deficits
    const totalDeficit = dailyData.reduce((sum, day) => sum + day.deficit, 0);
    
    console.log('Daily deficits:', dailyData.map(d => d.deficit));
    console.log('Final total deficit:', totalDeficit);
    console.log('Days with entries:', dailyData.length);
    console.log('=== END API DEBUG ===');

    // Calculate expected weight change
    const expectedWeightChange = totalDeficit / 7700;
    const daysWithEntries = dailyData.length;

    return NextResponse.json({
      success: true,
      history: {
        dailyData: dailyData.reverse(), // Most recent first
        totalDeficit,
        expectedWeightChange,
        tdee: 0, // Not using a single TDEE anymore since it varies by day
        days: daysWithEntries // Only count days with actual entries
      }
    });
  } catch (error) {
    console.error('Calorie history error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching calorie history' },
      { status: 500 }
    );
  }
}
