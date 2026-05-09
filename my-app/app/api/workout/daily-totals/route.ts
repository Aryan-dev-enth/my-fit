import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { WorkoutEntry } from '@/lib/models/WorkoutEntry';
import { WorkoutSession } from '@/lib/models/WorkoutSession';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date'); // YYYY-MM-DD format
    const days = parseInt(searchParams.get('days') || '7'); // Number of days to fetch

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    if (date) {
      // Get totals for a specific date from both old and new workout systems
      const oldWorkouts = await WorkoutEntry.aggregate([
        {
          $match: {
            userId: userId,
            date: date,
          },
        },
        {
          $group: {
            _id: '$date',
            totalCaloriesBurned: { $sum: '$caloriesBurned' },
            entryCount: { $sum: 1 },
            byType: {
              $push: {
                type: '$type',
                calories: '$caloriesBurned',
              },
            },
          },
        },
      ]);

      // Get calories from new workout sessions
      const newWorkouts = await WorkoutSession.find({
        userId: userId,
        date: date,
        completed: true,
      }).lean();

      let totals = {
        totalCaloriesBurned: 0,
        entryCount: 0,
        byType: {
          running: 0,
          swimming: 0,
          gym: 0,
        },
      };

      // Add old workout data
      if (oldWorkouts.length > 0) {
        const data = oldWorkouts[0];
        totals.totalCaloriesBurned = data.totalCaloriesBurned;
        totals.entryCount = data.entryCount;

        // Calculate calories by type
        data.byType.forEach((item: any) => {
          if (item.type === 'running') {
            totals.byType.running += item.calories;
          } else if (item.type === 'swimming') {
            totals.byType.swimming += item.calories;
          } else if (item.type === 'gym') {
            totals.byType.gym += item.calories;
          }
        });
      }

      // Add new workout session data
      newWorkouts.forEach(session => {
        if (session.caloriesBurned) {
          totals.totalCaloriesBurned += session.caloriesBurned;
          totals.entryCount += 1;
          
          // Categorize by workout type
          if (session.workoutType.includes('swimming')) {
            totals.byType.swimming += session.caloriesBurned;
          } else {
            totals.byType.gym += session.caloriesBurned;
          }
        }
      });

      return NextResponse.json({
        success: true,
        date: date,
        totals,
      });
    } else {
      // Get totals for multiple days
      const oldWorkouts = await WorkoutEntry.aggregate([
        {
          $match: {
            userId: userId,
          },
        },
        {
          $group: {
            _id: '$date',
            totalCaloriesBurned: { $sum: '$caloriesBurned' },
            entryCount: { $sum: 1 },
          },
        },
        {
          $sort: { _id: -1 },
        },
        {
          $limit: days,
        },
      ]);

      // Get new workout sessions
      const newWorkouts = await WorkoutSession.aggregate([
        {
          $match: {
            userId: userId,
            completed: true,
          },
        },
        {
          $group: {
            _id: '$date',
            totalCaloriesBurned: { $sum: '$caloriesBurned' },
            entryCount: { $sum: 1 },
          },
        },
        {
          $sort: { _id: -1 },
        },
        {
          $limit: days,
        },
      ]);

      // Merge both data sources
      const dailyTotalsMap = new Map();

      oldWorkouts.forEach(day => {
        dailyTotalsMap.set(day._id, {
          date: day._id,
          totals: {
            totalCaloriesBurned: day.totalCaloriesBurned,
            entryCount: day.entryCount,
          },
        });
      });

      newWorkouts.forEach(day => {
        if (dailyTotalsMap.has(day._id)) {
          const existing = dailyTotalsMap.get(day._id);
          existing.totals.totalCaloriesBurned += day.totalCaloriesBurned;
          existing.totals.entryCount += day.entryCount;
        } else {
          dailyTotalsMap.set(day._id, {
            date: day._id,
            totals: {
              totalCaloriesBurned: day.totalCaloriesBurned,
              entryCount: day.entryCount,
            },
          });
        }
      });

      const dailyTotals = Array.from(dailyTotalsMap.values())
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, days);

      return NextResponse.json({
        success: true,
        dailyTotals,
      });
    }
  } catch (error) {
    console.error('Daily workout totals fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching daily workout totals' },
      { status: 500 }
    );
  }
}
