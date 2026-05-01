import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { WeightEntry } from '@/lib/models/WeightEntry';
import { calculateBMI } from '@/lib/bmi';

export async function POST(request: NextRequest) {
  try {
    const { userId, weight } = await request.json();

    if (!userId || !weight) {
      return NextResponse.json(
        { success: false, message: 'User ID and weight are required' },
        { status: 400 }
      );
    }

    if (weight < 20 || weight > 500) {
      return NextResponse.json(
        { success: false, message: 'Weight must be between 20 and 500 kg' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get user's height for BMI calculation
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate BMI if height is available
    let bmi = undefined;
    if (user.height) {
      bmi = calculateBMI(weight, user.height);
    }

    // Create weight entry
    const weightEntry = await WeightEntry.create({
      userId,
      weight,
      bmi,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Weight logged successfully',
      entry: {
        id: weightEntry._id.toString(),
        weight: weightEntry.weight,
        bmi: weightEntry.bmi,
        timestamp: weightEntry.timestamp.toISOString(),
      },
    });
  } catch (error) {
    console.error('Weight log error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while logging weight' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '30');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get weight history
    const entries = await WeightEntry.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    const formattedEntries = entries.map(entry => ({
      id: entry._id.toString(),
      userId: entry.userId.toString(),
      weight: entry.weight,
      bmi: entry.bmi,
      timestamp: entry.timestamp.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      entries: formattedEntries,
    });
  } catch (error) {
    console.error('Weight history fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching weight history' },
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

    const result = await WeightEntry.findOneAndDelete({
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
      message: 'Weight entry deleted successfully',
    });
  } catch (error) {
    console.error('Weight delete error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while deleting weight entry' },
      { status: 500 }
    );
  }
}
