'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { user, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-zinc-900 dark:to-zinc-800 py-12">
        <Dashboard />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-zinc-900 dark:to-zinc-800 px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
          Fitness Tracker
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Track your fitness journey, one day at a time
        </p>
      </div>

      {showLogin ? (
        <LoginForm onSwitchToRegister={() => setShowLogin(false)} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setShowLogin(true)} />
      )}
    </div>
  );
}
