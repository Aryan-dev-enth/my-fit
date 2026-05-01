'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainDashboard from './MainDashboard';
import BodyPage from './BodyPage';
import FoodPage from './FoodPage';
import WorkoutPage from './WorkoutPage';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'body' | 'food' | 'workout'>('dashboard');

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg p-4 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Welcome, {user?.username}!
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1 sm:mt-2">
              Track your fitness journey
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 sm:px-6 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-sm sm:text-base text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Log Out
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-full font-semibold transition-colors text-xs sm:text-sm ${
              activeTab === 'dashboard'
                ? 'bg-green-500 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('body')}
            className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-full font-semibold transition-colors text-xs sm:text-sm ${
              activeTab === 'body'
                ? 'bg-green-500 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Body
          </button>
          <button
            onClick={() => setActiveTab('food')}
            className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-full font-semibold transition-colors text-xs sm:text-sm ${
              activeTab === 'food'
                ? 'bg-green-500 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Food
          </button>
          <button
            onClick={() => setActiveTab('workout')}
            className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-full font-semibold transition-colors text-xs sm:text-sm ${
              activeTab === 'workout'
                ? 'bg-green-500 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Workout
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && <MainDashboard />}
      {activeTab === 'body' && <BodyPage />}
      {activeTab === 'food' && <FoodPage />}
      {activeTab === 'workout' && <WorkoutPage />}
    </div>
  );
}
