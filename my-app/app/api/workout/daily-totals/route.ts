import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { WorkoutEntry } from '@/lib/models/WorkoutEntry';

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
      // Get totals for a specific date
      const result = await WorkoutEntry.aggregate([
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

      let totals = {
        totalCaloriesBurned: 0,
        entryCount: 0,
        byType: {
          running: 0,
          swimming: 0,
          gym: 0,
        },
      };

      if (result.length > 0) {
        const data = result[0];
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

      return NextResponse.json({
        success: true,
        date: date,
        totals,
      });
    } else {
      // Get totals for multiple days
      const result = await WorkoutEntry.aggregate([
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

      const dailyTotals = result.map(day => ({
        date: day._id,
        totals: {
          totalCaloriesBurned: day.totalCaloriesBurned,
          entryCount: day.entryCount,
        },
      }));

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
