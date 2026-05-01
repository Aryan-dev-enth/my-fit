import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const { userId, height } = await request.json();

    if (!userId || !height) {
      return NextResponse.json(
        { success: false, message: 'User ID and height are required' },
        { status: 400 }
      );
    }

    if (height < 50 || height > 300) {
      return NextResponse.json(
        { success: false, message: 'Height must be between 50 and 300 cm' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      userId,
      { height },
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
      message: 'Height updated successfully',
      height: user.height,
    });
  } catch (error) {
    console.error('Height update error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while updating height' },
      { status: 500 }
    );
  }
}

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
      height: user.height || null,
    });
  } catch (error) {
    console.error('Height fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching height' },
      { status: 500 }
    );
  }
}
