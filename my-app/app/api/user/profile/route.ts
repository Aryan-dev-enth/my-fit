import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';

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

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        height: user.height,
        age: user.age,
        gender: user.gender,
        activityLevel: user.activityLevel || 'moderate',
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, age, gender, activityLevel } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const updates: any = {};

    if (age !== undefined) {
      if (age < 10 || age > 120) {
        return NextResponse.json(
          { success: false, message: 'Age must be between 10 and 120' },
          { status: 400 }
        );
      }
      updates.age = age;
    }

    if (gender !== undefined) {
      if (!['male', 'female'].includes(gender)) {
        return NextResponse.json(
          { success: false, message: 'Gender must be male or female' },
          { status: 400 }
        );
      }
      updates.gender = gender;
    }

    if (activityLevel !== undefined) {
      if (!['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(activityLevel)) {
        return NextResponse.json(
          { success: false, message: 'Invalid activity level' },
          { status: 400 }
        );
      }
      updates.activityLevel = activityLevel;
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        height: user.height,
        age: user.age,
        gender: user.gender,
        activityLevel: user.activityLevel,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while updating profile' },
      { status: 500 }
    );
  }
}
