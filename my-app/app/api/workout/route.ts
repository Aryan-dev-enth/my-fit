import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { WorkoutEntry } from '@/lib/models/WorkoutEntry';

export async function POST(request: NextRequest) {
  try {
    const { userId, type, caloriesBurned, notes, date: requestDate } = await request.json();

    if (!userId || !type || caloriesBurned === undefined) {
      return NextResponse.json(
        { success: false, message: 'User ID, workout type, and calories burned are required' },
        { status: 400 }
      );
    }

    if (!['running', 'swimming', 'gym'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid workout type' },
        { status: 400 }
      );
    }

    if (caloriesBurned < 0) {
      return NextResponse.json(
        { success: false, message: 'Calories burned cannot be negative' },
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

    const workoutEntry = await WorkoutEntry.create({
      userId,
      type,
      caloriesBurned,
      timestamp,
      date,
      notes: notes?.trim() || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Workout logged successfully',
      entry: {
        id: workoutEntry._id.toString(),
        type: workoutEntry.type,
        caloriesBurned: workoutEntry.caloriesBurned,
        timestamp: workoutEntry.timestamp.toISOString(),
        date: workoutEntry.date,
        notes: workoutEntry.notes,
      },
    });
  } catch (error) {
    console.error('Workout log error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while logging workout' },
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

    const entries = await WorkoutEntry.find(query)
      .sort({ timestamp: -1 })
      .lean();

    const formattedEntries = entries.map(entry => ({
      id: entry._id.toString(),
      userId: entry.userId.toString(),
      type: entry.type,
      caloriesBurned: entry.caloriesBurned,
      timestamp: entry.timestamp.toISOString(),
      date: entry.date,
      notes: entry.notes,
    }));

    return NextResponse.json({
      success: true,
      entries: formattedEntries,
    });
  } catch (error) {
    console.error('Workout fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching workout entries' },
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

    const result = await WorkoutEntry.findOneAndDelete({
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
      message: 'Workout entry deleted successfully',
    });
  } catch (error) {
    console.error('Workout delete error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while deleting workout entry' },
      { status: 500 }
    );
  }
}
