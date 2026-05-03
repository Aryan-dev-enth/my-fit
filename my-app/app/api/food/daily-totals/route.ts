import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { FoodEntry } from '@/lib/models/FoodEntry';
import { Types } from 'mongoose';

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

    // Convert userId string to ObjectId
    const userObjectId = new Types.ObjectId(userId);

    if (date) {
      // Get totals for a specific date
      const result = await FoodEntry.aggregate([
        {
          $match: {
            userId: userObjectId,
            date: date,
          },
        },
        {
          $group: {
            _id: '$date',
            totalCalories: { $sum: '$calories' },
            totalProtein: { $sum: '$protein' },
            totalCarbs: { $sum: '$carbs' },
            totalFat: { $sum: '$fat' },
            entryCount: { $sum: 1 },
          },
        },
      ]);

      const totals = result[0] || {
        _id: date,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        entryCount: 0,
      };

      return NextResponse.json({
        success: true,
        date: date,
        totals: {
          calories: totals.totalCalories,
          protein: totals.totalProtein,
          carbs: totals.totalCarbs,
          fat: totals.totalFat,
          entryCount: totals.entryCount,
        },
      });
    } else {
      // Get totals for multiple days
      const result = await FoodEntry.aggregate([
        {
          $match: {
            userId: userObjectId,
          },
        },
        {
          $group: {
            _id: '$date',
            totalCalories: { $sum: '$calories' },
            totalProtein: { $sum: '$protein' },
            totalCarbs: { $sum: '$carbs' },
            totalFat: { $sum: '$fat' },
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
          calories: day.totalCalories,
          protein: day.totalProtein,
          carbs: day.totalCarbs,
          fat: day.totalFat,
          entryCount: day.entryCount,
        },
      }));

      return NextResponse.json({
        success: true,
        dailyTotals,
      });
    }
  } catch (error) {
    console.error('Daily totals fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching daily totals' },
      { status: 500 }
    );
  }
}
