import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { FoodEntry } from '@/lib/models/FoodEntry';

export async function POST(request: NextRequest) {
  try {
    const { userId, name, calories, protein, carbs, fat, date: requestDate } = await request.json();

    if (!userId || !name || calories === undefined || protein === undefined || carbs === undefined || fat === undefined) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (calories < 0 || protein < 0 || carbs < 0 || fat < 0) {
      return NextResponse.json(
        { success: false, message: 'Values cannot be negative' },
        { status: 400 }
      );
    }

    await connectDB();

    // Use provided date or default to today
    const date = requestDate || new Date().toISOString().split('T')[0];
    
    // Create timestamp for the specified date (use current time on that date)
    const now = new Date();
    const timestamp = requestDate 
      ? new Date(`${requestDate}T${now.toTimeString().split(' ')[0]}`)
      : now;

    const foodEntry = await FoodEntry.create({
      userId,
      name: name.trim(),
      calories,
      protein,
      carbs,
      fat,
      timestamp,
      date,
    });

    return NextResponse.json({
      success: true,
      message: 'Food logged successfully',
      entry: {
        id: foodEntry._id.toString(),
        name: foodEntry.name,
        calories: foodEntry.calories,
        protein: foodEntry.protein,
        carbs: foodEntry.carbs,
        fat: foodEntry.fat,
        timestamp: foodEntry.timestamp.toISOString(),
        date: foodEntry.date,
      },
    });
  } catch (error) {
    console.error('Food log error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while logging food' },
      { status: 500 }
    );
  }
}

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

    await connectDB();

    let query: any = { userId };
    
    if (date) {
      query.date = date;
    }

    const entries = await FoodEntry.find(query)
      .sort({ timestamp: -1 })
      .lean();

    const formattedEntries = entries.map(entry => ({
      id: entry._id.toString(),
      userId: entry.userId.toString(),
      name: entry.name,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      timestamp: entry.timestamp.toISOString(),
      date: entry.date,
    }));

    return NextResponse.json({
      success: true,
      entries: formattedEntries,
    });
  } catch (error) {
    console.error('Food fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching food entries' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');
    const userId = searchParams.get('userId');

    if (!entryId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Entry ID and User ID are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await FoodEntry.findOneAndDelete({
      _id: entryId,
      userId: userId,
    });

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Entry not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Food entry deleted successfully',
    });
  } catch (error) {
    console.error('Food delete error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while deleting food entry' },
      { status: 500 }
    );
  }
}
