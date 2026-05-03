'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WorkoutEntry, WorkoutType } from '@/lib/types';

const workoutTypes: { value: WorkoutType; label: string; icon: string }[] = [
  { value: 'running', label: 'Running', icon: '🏃' },
  { value: 'swimming', label: 'Swimming', icon: '🏊' },
  { value: 'gym', label: 'Gym', icon: '💪' },
];

export default function WorkoutPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);

  // Form state
  const [selectedType, setSelectedType] = useState<WorkoutType>('running');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      fetchWorkoutEntries();
    }
  }, [user, selectedDate]);

  const fetchWorkoutEntries = async () => {
    try {
      const response = await fetch(`/api/workout?userId=${user?.userId}&date=${selectedDate}`);
      const data = await response.json();
      if (data.success) {
        setWorkoutEntries(data.entries);
      }
    } catch (err) {
      console.error('Failed to fetch workout entries:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const caloriesValue = parseFloat(caloriesBurned);

      if (isNaN(caloriesValue) || caloriesValue < 0) {
        setError('Calories burned must be a positive number');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.userId,
          type: selectedType,
          caloriesBurned: caloriesValue,
          notes: notes.trim() || undefined,
          date: selectedDate, // Log to the selected date
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCaloriesBurned('');
        setNotes('');
        setSuccess('Workout logged!');
        setTimeout(() => setSuccess(''), 3000);
        await fetchWorkoutEntries();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to log workout');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const response = await fetch(`/api/workout?entryId=${entryId}&userId=${user?.userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Entry deleted!');
        setTimeout(() => setSuccess(''), 3000);
        await fetchWorkoutEntries();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete entry');
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    if (selected.getTime() === today.getTime()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (selected.getTime() === yesterday.getTime()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getWorkoutIcon = (type: WorkoutType) => {
    return workoutTypes.find(w => w.value === type)?.icon || '🏋️';
  };

  const getWorkoutLabel = (type: WorkoutType) => {
    return workoutTypes.find(w => w.value === type)?.label || type;
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Date Navigation */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-4">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <svg className="w-6 h-6 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 text-center">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{formatDate(selectedDate)}</h2>
            <input
              type="date"
              value={selectedDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-2 px-3 py-1 text-sm text-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button onClick={() => changeDate(1)} disabled={isToday} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <svg className="w-6 h-6 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Log Workout Form */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Log Workout</h3>
          {!isToday && (
            <span className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
              Logging to {formatDate(selectedDate)}
            </span>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Workout Type</label>
            <div className="grid grid-cols-3 gap-3">
              {workoutTypes.map((workout) => (
                <button
                  key={workout.value}
                  type="button"
                  onClick={() => setSelectedType(workout.value)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedType === workout.value
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="text-3xl mb-2">{workout.icon}</div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{workout.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Calories Burned</label>
            <input
              type="number"
              step="1"
              value={caloriesBurned}
              onChange={(e) => setCaloriesBurned(e.target.value)}
              placeholder="Enter calories burned"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about your workout..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-semibold py-3 rounded-full transition-colors"
          >
            {isLoading ? 'Logging...' : 'Log Workout'}
          </button>
        </form>
      </div>

      {/* Workout Entries List */}
      {workoutEntries.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Workout History ({workoutEntries.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {workoutEntries.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-3xl">{getWorkoutIcon(entry.type)}</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{getWorkoutLabel(entry.type)}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium text-orange-600 dark:text-orange-400">🔥 {entry.caloriesBurned} kcal</span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">• {formatTime(entry.timestamp)}</span>
                    </div>
                    {entry.notes && <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{entry.notes}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-2 ml-4"
                  title="Delete"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-8 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">No workouts logged for this day</p>
        </div>
      )}
    </div>
  );
}
