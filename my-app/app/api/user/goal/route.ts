import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';

// GET - Fetch user goal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      goal: user.goal || null,
    });
  } catch (error) {
    console.error('Get goal error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching goal' },
      { status: 500 }
    );
  }
}

// POST - Set/Update user goal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, targetWeight, targetDate } = body;

    if (!userId || !targetWeight || !targetDate) {
      return NextResponse.json(
        { success: false, message: 'User ID, target weight, and target date are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update goal
    user.goal = {
      targetWeight: parseFloat(targetWeight),
      targetDate: new Date(targetDate),
      createdAt: new Date(),
    };

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Goal updated successfully',
      goal: user.goal,
    });
  } catch (error) {
    console.error('Set goal error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while setting goal' },
      { status: 500 }
    );
  }
}

// DELETE - Remove user goal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    user.goal = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Goal removed successfully',
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while removing goal' },
      { status: 500 }
    );
  }
}
