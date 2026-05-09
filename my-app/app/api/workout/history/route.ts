import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { WorkoutSession } from '@/lib/models/WorkoutSession';

// GET - Fetch workout history for a specific exercise
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const exerciseName = searchParams.get('exerciseName');
    const workoutType = searchParams.get('workoutType');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    let query: any = { userId, completed: true };
    
    if (workoutType) {
      query.workoutType = workoutType;
    }

    const sessions = await WorkoutSession.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    if (exerciseName) {
      // Filter and extract specific exercise history
      const exerciseHistory = sessions
        .map(session => {
          const exercise = session.exercises.find(ex => ex.name === exerciseName);
          if (!exercise) return null;

          const completedSets = exercise.sets.filter(set => set.completed);
          if (completedSets.length === 0) return null;

          // Calculate best set (highest weight * reps)
          const bestSet = completedSets.reduce((best, set) => {
            const currentScore = (set.weight || 0) * (set.reps || 0);
            const bestScore = (best.weight || 0) * (best.reps || 0);
            return currentScore > bestScore ? set : best;
          }, completedSets[0]);

          return {
            date: session.date,
            sessionId: session._id.toString(),
            exercise: {
              name: exercise.name,
              category: exercise.category,
              completedSets: completedSets.length,
              totalSets: exercise.sets.length,
              bestSet: {
                weight: bestSet.weight,
                reps: bestSet.reps,
                setNumber: bestSet.setNumber,
              },
              allSets: completedSets.map(set => ({
                setNumber: set.setNumber,
                weight: set.weight,
                reps: set.reps,
                notes: set.notes,
              })),
            },
          };
        })
        .filter(Boolean);

      return NextResponse.json({
        success: true,
        exerciseName,
        history: exerciseHistory,
      });
    }

    // Return full session history
    const formattedSessions = sessions.map(session => ({
      id: session._id.toString(),
      date: session.date,
      workoutType: session.workoutType,
      duration: session.duration,
      caloriesBurned: session.caloriesBurned,
      completed: session.completed,
      exerciseCount: session.exercises.length,
      completedExercises: session.exercises.filter(ex => 
        ex.sets.some(set => set.completed)
      ).length,
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
    });
  } catch (error) {
    console.error('Workout history fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching workout history' },
      { status: 500 }
    );
  }
}
