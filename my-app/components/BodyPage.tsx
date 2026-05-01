'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WeightEntry } from '@/lib/types';

export default function BodyPage() {
  const { user } = useAuth();
  const [height, setHeight] = useState<number | null>(null);
  const [heightInput, setHeightInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  
  // Profile fields
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [showProfileForm, setShowProfileForm] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      fetchHeight();
      fetchProfile();
      fetchWeightHistory();
    }
  }, [user]);

  const fetchHeight = async () => {
    try {
      const response = await fetch(`/api/body/height?userId=${user?.userId}`);
      const data = await response.json();
      if (data.success && data.height) {
        setHeight(data.height);
      }
    } catch (err) {
      console.error('Failed to fetch height:', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/user/profile?userId=${user?.userId}`);
      const data = await response.json();
      if (data.success) {
        if (data.profile.age) setAge(data.profile.age.toString());
        if (data.profile.gender) setGender(data.profile.gender);
        if (data.profile.activityLevel) setActivityLevel(data.profile.activityLevel);
        
        // Auto-show form if profile is incomplete
        const isIncomplete = !data.profile.age || !data.profile.gender || !data.profile.activityLevel;
        setShowProfileForm(isIncomplete);
      } else {
        // No profile exists, show form
        setShowProfileForm(true);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setShowProfileForm(true);
    }
  };

  const fetchWeightHistory = async () => {
    try {
      const response = await fetch(`/api/body/weight?userId=${user?.userId}&limit=30`);
      const data = await response.json();
      if (data.success) {
        setWeightHistory(data.entries);
      }
    } catch (err) {
      console.error('Failed to fetch weight history:', err);
    }
  };

  const handleHeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const heightValue = parseFloat(heightInput);
      if (isNaN(heightValue) || heightValue < 50 || heightValue > 300) {
        setError('Height must be between 50 and 300 cm');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/body/height', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.userId, height: heightValue }),
      });

      const data = await response.json();
      if (data.success) {
        setHeight(data.height);
        setHeightInput('');
        setSuccess('Height updated!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to update height');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const weightValue = parseFloat(weightInput);
      if (isNaN(weightValue) || weightValue < 20 || weightValue > 500) {
        setError('Weight must be between 20 and 500 kg');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/body/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.userId, weight: weightValue }),
      });

      const data = await response.json();
      if (data.success) {
        setWeightInput('');
        setSuccess('Weight logged!');
        setTimeout(() => setSuccess(''), 3000);
        await fetchWeightHistory();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to log weight');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const ageValue = parseInt(age);
      if (isNaN(ageValue) || ageValue < 10 || ageValue > 120) {
        setError('Age must be between 10 and 120');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.userId,
          age: ageValue,
          gender,
          activityLevel,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowProfileForm(false);
        setSuccess('Profile updated!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const response = await fetch(`/api/body/weight?entryId=${entryId}&userId=${user?.userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Entry deleted!');
        setTimeout(() => setSuccess(''), 3000);
        await fetchWeightHistory();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete entry');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

      {/* Profile Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Profile</h3>
          <button
            onClick={() => setShowProfileForm(!showProfileForm)}
            className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
          >
            {showProfileForm ? 'Cancel' : 'Update'}
          </button>
        </div>

        {showProfileForm ? (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter age"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Activity Level</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                  <option value="very_active">Very Active</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-semibold py-3 rounded-full transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        ) : (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {age && gender && activityLevel ? (
              <p>Age: {age} • Gender: {gender} • Activity: {activityLevel}</p>
            ) : (
              <p>Complete your profile to enable calorie calculations</p>
            )}
          </div>
        )}
      </div>

      {/* Height Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Height</h3>
        {height && (
          <div className="text-center py-2 mb-4">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{height} cm</span>
          </div>
        )}
        <form onSubmit={handleHeightSubmit} className="space-y-4">
          <input
            type="number"
            step="0.1"
            value={heightInput}
            onChange={(e) => setHeightInput(e.target.value)}
            placeholder="Enter height in cm"
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-semibold py-3 rounded-full transition-colors"
          >
            {isLoading ? 'Saving...' : height ? 'Update Height' : 'Set Height'}
          </button>
        </form>
      </div>

      {/* Log Weight */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Log Weight</h3>
        <form onSubmit={handleWeightSubmit} className="space-y-4">
          <input
            type="number"
            step="0.1"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="Enter weight in kg"
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-semibold py-3 rounded-full transition-colors"
          >
            {isLoading ? 'Logging...' : 'Log Weight'}
          </button>
        </form>
      </div>

      {/* Weight History */}
      {weightHistory.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Weight History</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {weightHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl"
              >
                <div className="flex-1">
                  <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{entry.weight} kg</span>
                  {entry.bmi && <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-2">BMI: {entry.bmi}</span>}
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{formatDate(entry.timestamp)}</p>
                </div>
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-2"
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
      )}
    </div>
  );
}
