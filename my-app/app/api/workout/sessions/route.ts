import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { WorkoutSession } from '@/lib/models/WorkoutSession';
import { WORKOUT_TEMPLATES } from '@/lib/workoutTemplates';
import { v4 as uuidv4 } from 'uuid';

// GET - Fetch workout sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date'); // YYYY-MM-DD
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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
    } else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const sessions = await WorkoutSession.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const formattedSessions = sessions.map(session => ({
      id: session._id.toString(),
      userId: session.userId.toString(),
      date: session.date,
      workoutType: session.workoutType,
      exercises: session.exercises,
      duration: session.duration,
      caloriesBurned: session.caloriesBurned,
      notes: session.notes,
      completed: session.completed,
      startTime: session.startTime?.toISOString(),
      endTime: session.endTime?.toISOString(),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
    });
  } catch (error) {
    console.error('Workout sessions fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching workout sessions' },
      { status: 500 }
    );
  }
}

// POST - Create a new workout session
export async function POST(request: NextRequest) {
  try {
    const { userId, date, workoutType, exercises, duration, caloriesBurned, notes } = await request.json();

    if (!userId || !date || !workoutType) {
      return NextResponse.json(
        { success: false, message: 'User ID, date, and workout type are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if session already exists for this date
    const existingSession = await WorkoutSession.findOne({ userId, date });
    if (existingSession) {
      return NextResponse.json(
        { success: false, message: 'A workout session already exists for this date' },
        { status: 400 }
      );
    }

    // Get template exercises if not provided
    let sessionExercises = exercises;
    if (!exercises || exercises.length === 0) {
      const template = WORKOUT_TEMPLATES[workoutType];
      if (template) {
        sessionExercises = template.exercises.map(ex => ({
          id: uuidv4(),
          name: ex.name,
          targetSets: ex.targetSets,
          targetRepsMin: ex.targetRepsMin,
          targetRepsMax: ex.targetRepsMax,
          category: ex.category,
          sets: Array.from({ length: ex.targetSets }, (_, i) => ({
            setNumber: i + 1,
            completed: false,
          })),
        }));
      }
    }

    const session = await WorkoutSession.create({
      userId,
      date,
      workoutType,
      exercises: sessionExercises || [],
      duration,
      caloriesBurned,
      notes,
      completed: false,
    });

    return NextResponse.json({
      success: true,
      message: 'Workout session created successfully',
      session: {
        id: session._id.toString(),
        userId: session.userId.toString(),
        date: session.date,
        workoutType: session.workoutType,
        exercises: session.exercises,
        duration: session.duration,
        caloriesBurned: session.caloriesBurned,
        notes: session.notes,
        completed: session.completed,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Workout session creation error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating workout session' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing workout session
export async function PUT(request: NextRequest) {
  try {
    const { sessionId, userId, exercises, duration, caloriesBurned, notes, completed, startTime, endTime } = await request.json();

    if (!sessionId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Session ID and User ID are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const updateData: any = { updatedAt: new Date() };
    
    if (exercises !== undefined) updateData.exercises = exercises;
    if (duration !== undefined) updateData.duration = duration;
    if (caloriesBurned !== undefined) updateData.caloriesBurned = caloriesBurned;
    if (notes !== undefined) updateData.notes = notes;
    if (completed !== undefined) updateData.completed = completed;
    if (startTime !== undefined) updateData.startTime = startTime ? new Date(startTime) : null;
    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null;

    const session = await WorkoutSession.findOneAndUpdate(
      { _id: sessionId, userId },
      updateData,
      { new: true }
    );

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Workout session updated successfully',
      session: {
        id: session._id.toString(),
        userId: session.userId.toString(),
        date: session.date,
        workoutType: session.workoutType,
        exercises: session.exercises,
        duration: session.duration,
        caloriesBurned: session.caloriesBurned,
        notes: session.notes,
        completed: session.completed,
        startTime: session.startTime?.toISOString(),
        endTime: session.endTime?.toISOString(),
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Workout session update error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while updating workout session' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a workout session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Session ID and User ID are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await WorkoutSession.findOneAndDelete({
      _id: sessionId,
      userId,
    });

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Session not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Workout session deleted successfully',
    });
  } catch (error) {
    console.error('Workout session delete error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while deleting workout session' },
      { status: 500 }
    );
  }
}
