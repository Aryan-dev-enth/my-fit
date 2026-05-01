'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardData {
  // Body data
  currentWeight?: number;
  currentBMI?: number;
  height?: number;
  
  // Calorie system (today)
  tdee: number;
  consumed: number;
  burned: number;
  net: number;
  deficit: number;
  
  // Macros (today)
  protein: number;
  carbs: number;
  fat: number;
  
  // Progress & predictions
  weeklyPrediction?: {
    predictedWeightChange: number;
    predictedWeight: number;
    totalDeficit: number;
    avgDailyDeficit: number;
  };
  
  // Weight chart data
  weightChartData: Array<{
    date: string;
    weight: number;
    formattedDate: string;
  }>;
  
  // Profile status
  hasCompleteProfile: boolean;
  hasWeight: boolean;
}

export default function MainDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch all data in parallel
      const [caloriesRes, weightRes, predictionRes, foodTotalsRes, weightHistoryRes] = await Promise.all([
        fetch(`/api/calories/daily?userId=${user?.userId}&date=${today}`),
        fetch(`/api/body/weight?userId=${user?.userId}&limit=1`),
        fetch(`/api/calories/prediction?userId=${user?.userId}&days=7`),
        fetch(`/api/food/daily-totals?userId=${user?.userId}&date=${today}`),
        fetch(`/api/body/weight?userId=${user?.userId}&limit=30`),
      ]);

      const caloriesData = await caloriesRes.json();
      const weightData = await weightRes.json();
      const predictionData = await predictionRes.json();
      const foodTotalsData = await foodTotalsRes.json();
      const weightHistoryData = await weightHistoryRes.json();

      const dashboardData: DashboardData = {
        tdee: 0,
        consumed: 0,
        burned: 0,
        net: 0,
        deficit: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        weightChartData: [],
        hasCompleteProfile: false,
        hasWeight: false,
      };

      // Process calories data
      if (caloriesData.success && caloriesData.calculation) {
        dashboardData.tdee = caloriesData.calculation.tdee;
        dashboardData.consumed = caloriesData.calculation.consumed;
        dashboardData.burned = caloriesData.calculation.burned;
        dashboardData.net = caloriesData.calculation.net;
        dashboardData.deficit = caloriesData.calculation.deficit;
        dashboardData.hasCompleteProfile = true;
      }

      // Process weight data
      if (weightData.success && weightData.entries.length > 0) {
        const latest = weightData.entries[0];
        dashboardData.currentWeight = latest.weight;
        dashboardData.currentBMI = latest.bmi;
        dashboardData.hasWeight = true;
      }

      // Process macros
      if (foodTotalsData.success && foodTotalsData.totals) {
        dashboardData.protein = foodTotalsData.totals.protein;
        dashboardData.carbs = foodTotalsData.totals.carbs;
        dashboardData.fat = foodTotalsData.totals.fat;
      }

      // Process prediction data
      if (predictionData.success && predictionData.prediction) {
        dashboardData.weeklyPrediction = {
          predictedWeightChange: predictionData.prediction.predictedWeightChange,
          predictedWeight: predictionData.prediction.predictedWeight,
          totalDeficit: predictionData.prediction.totalDeficit,
          avgDailyDeficit: predictionData.prediction.avgDailyDeficit,
        };
      }

      // Process weight history for chart
      if (weightHistoryData.success && weightHistoryData.entries.length > 0) {
        dashboardData.weightChartData = weightHistoryData.entries.reverse().map((entry: any) => ({
          date: entry.timestamp,
          weight: entry.weight,
          formattedDate: new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));
      }

      setData(dashboardData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Calculate macro percentages
  const calculateMacroPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  // Macro goals (example - you can make these dynamic)
  const proteinGoal = data?.tdee ? Math.round((data.tdee * 0.3) / 4) : 150; // 30% of calories, 4 cal/g
  const carbsGoal = data?.tdee ? Math.round((data.tdee * 0.4) / 4) : 200; // 40% of calories, 4 cal/g
  const fatGoal = data?.tdee ? Math.round((data.tdee * 0.3) / 9) : 65; // 30% of calories, 9 cal/g

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-8 text-center">
        <p className="text-red-700 dark:text-red-400 text-lg">Failed to load dashboard data</p>
      </div>
    );
  }

  const isDeficit = data.deficit > 0;
  const isSurplus = data.deficit < 0;
  const isWeightLoss = data.weeklyPrediction && data.weeklyPrediction.predictedWeightChange > 0;

  // Calculate remaining calories to eat today
  // Remaining = TDEE + Burned - Consumed
  const remainingCalories = data.tdee + data.burned - data.consumed;
  
  // Calculate actual deficit (TDEE - Consumed)
  const actualDeficit = data.tdee - data.consumed;

  const carbsPercentage = calculateMacroPercentage(data.carbs, carbsGoal);
  const proteinPercentage = calculateMacroPercentage(data.protein, proteinGoal);
  const fatPercentage = calculateMacroPercentage(data.fat, fatGoal);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {formatDate()}
          </h2>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          title="Refresh"
        >
          <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Setup Warnings */}
      {!data.hasCompleteProfile && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Complete your profile in the <strong>Body</strong> tab to see all metrics
          </p>
        </div>
      )}

      {!data.hasWeight && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            📊 Log your weight and height in the <strong>Body</strong> tab
          </p>
        </div>
      )}

      {/* Main Calorie Card - Nutrio Style */}
      {data.hasCompleteProfile && (
        <div className="bg-gradient-to-br from-green-400 to-green-500 dark:from-green-600 dark:to-green-700 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-xs sm:text-sm font-medium text-white/90">🍽️ Eaten</div>
              <div className="text-xl sm:text-2xl font-bold text-white">{data.consumed}</div>
              <div className="text-xs sm:text-sm text-white/70">kcal</div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-xs sm:text-sm font-medium text-white/90">🔥 Burned</div>
              <div className="text-xl sm:text-2xl font-bold text-white">{data.burned}</div>
              <div className="text-xs sm:text-sm text-white/70">kcal</div>
            </div>
          </div>

          {/* Large Center Circle */}
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <div className="relative">
              <svg className="w-36 h-36 sm:w-48 sm:h-48 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="10"
                  fill="none"
                  className="sm:hidden"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  stroke="white"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${Math.max(0, Math.min(100, (data.consumed / (data.tdee + data.burned)) * 100)) * 4.02} 402`}
                  strokeLinecap="round"
                  className="sm:hidden"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="12"
                  fill="none"
                  className="hidden sm:block"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="white"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${Math.max(0, Math.min(100, (data.consumed / (data.tdee + data.burned)) * 100)) * 5.53} 553`}
                  strokeLinecap="round"
                  className="hidden sm:block"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl sm:text-5xl font-bold text-white">{Math.max(0, remainingCalories)}</div>
                <div className="text-xs sm:text-sm text-white/80 mt-1">kcal left</div>
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-white/70 mb-1">Goal</div>
              <div className="text-base sm:text-lg font-bold text-white">{data.tdee}</div>
            </div>
            <div>
              <div className="text-xs text-white/70 mb-1">Budget</div>
              <div className="text-base sm:text-lg font-bold text-white">{data.tdee + data.burned}</div>
              <div className="text-xs text-white/60">+{data.burned} burned</div>
            </div>
            <div>
              <div className="text-xs text-white/70 mb-1">Deficit</div>
              <div className={`text-base sm:text-lg font-bold ${actualDeficit > 0 ? 'text-white' : 'text-red-200'}`}>
                {Math.abs(actualDeficit)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Macros - Circular Progress Style */}
      {data.hasCompleteProfile && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-6 shadow-lg border border-zinc-100 dark:border-zinc-800">
          <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4 sm:mb-6">Today's Macros</h3>
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            {/* Carbs */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-2 sm:mb-3">
                <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90">
                  {/* Background circle - mobile */}
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#f3f4f6"
                    strokeWidth="6"
                    fill="none"
                    className="dark:stroke-zinc-800 sm:hidden"
                  />
                  {/* Progress circle - mobile */}
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#ef4444"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray="226"
                    strokeDashoffset={226 - (data.carbs > 0 ? 226 : 0)}
                    strokeLinecap="round"
                    className="sm:hidden transition-all duration-500"
                  />
                  {/* Background circle - desktop */}
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#f3f4f6"
                    strokeWidth="8"
                    fill="none"
                    className="dark:stroke-zinc-800 hidden sm:block"
                  />
                  {/* Progress circle - desktop */}
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#ef4444"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="251"
                    strokeDashoffset={251 - (data.carbs > 0 ? 251 : 0)}
                    strokeLinecap="round"
                    className="hidden sm:block transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50">{data.carbs}</div>
                  <div className="text-xs text-zinc-500">g</div>
                </div>
              </div>
              <div className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">Carbs</div>
            </div>

            {/* Protein */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-2 sm:mb-3">
                <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90">
                  {/* Background circle - mobile */}
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#f3f4f6"
                    strokeWidth="6"
                    fill="none"
                    className="dark:stroke-zinc-800 sm:hidden"
                  />
                  {/* Progress circle - mobile */}
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#f97316"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray="226"
                    strokeDashoffset={226 - (data.protein > 0 ? 226 : 0)}
                    strokeLinecap="round"
                    className="sm:hidden transition-all duration-500"
                  />
                  {/* Background circle - desktop */}
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#f3f4f6"
                    strokeWidth="8"
                    fill="none"
                    className="dark:stroke-zinc-800 hidden sm:block"
                  />
                  {/* Progress circle - desktop */}
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#f97316"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="251"
                    strokeDashoffset={251 - (data.protein > 0 ? 251 : 0)}
                    strokeLinecap="round"
                    className="hidden sm:block transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50">{data.protein}</div>
                  <div className="text-xs text-zinc-500">g</div>
                </div>
              </div>
              <div className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">Protein</div>
            </div>

            {/* Fat */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-2 sm:mb-3">
                <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90">
                  {/* Background circle - mobile */}
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#f3f4f6"
                    strokeWidth="6"
                    fill="none"
                    className="dark:stroke-zinc-800 sm:hidden"
                  />
                  {/* Progress circle - mobile */}
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#3b82f6"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray="226"
                    strokeDashoffset={226 - (data.fat > 0 ? 226 : 0)}
                    strokeLinecap="round"
                    className="sm:hidden transition-all duration-500"
                  />
                  {/* Background circle - desktop */}
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#f3f4f6"
                    strokeWidth="8"
                    fill="none"
                    className="dark:stroke-zinc-800 hidden sm:block"
                  />
                  {/* Progress circle - desktop */}
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="251"
                    strokeDashoffset={251 - (data.fat > 0 ? 251 : 0)}
                    strokeLinecap="round"
                    className="hidden sm:block transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50">{data.fat}</div>
                  <div className="text-xs text-zinc-500">g</div>
                </div>
              </div>
              <div className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">Fat</div>
            </div>
          </div>
          {(data.protein === 0 && data.carbs === 0 && data.fat === 0) && (
            <div className="mt-4 text-center">
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                No food logged today. Add entries in the <strong>Food</strong> tab.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Body Stats Card */}
      {data.hasWeight && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-6 shadow-lg border border-zinc-100 dark:border-zinc-800">
          <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Body Stats</h3>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
              <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-1">Weight</div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {data.currentWeight?.toFixed(1)}
              </div>
              <div className="text-xs text-zinc-500">kg</div>
            </div>
            {data.currentBMI && (
              <div className="text-center p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-1">BMI</div>
                <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {data.currentBMI.toFixed(1)}
                </div>
                <div className="text-xs text-zinc-500">Normal</div>
              </div>
            )}
            {data.height && (
              <div className="text-center p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-1">Height</div>
                <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {data.height}
                </div>
                <div className="text-xs text-zinc-500">cm</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weekly Prediction */}
      {data.weeklyPrediction && data.hasWeight && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-6 shadow-lg border border-zinc-100 dark:border-zinc-800">
          <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">7-Day Prediction</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-1">Expected Weight</div>
              <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {data.weeklyPrediction.predictedWeight.toFixed(1)} kg
              </div>
              <div className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                isWeightLoss 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                <span>{isWeightLoss ? '↓' : '↑'}</span>
                <span>{Math.abs(data.weeklyPrediction.predictedWeightChange).toFixed(2)} kg</span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-1">Avg Daily Deficit</div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {Math.abs(Math.round(data.weeklyPrediction.avgDailyDeficit))}
              </div>
              <div className="text-xs text-zinc-500">kcal/day</div>
            </div>
          </div>
        </div>
      )}

      {/* Weight Progress Chart */}
      {data.weightChartData.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-6 shadow-lg border border-zinc-100 dark:border-zinc-800">
          <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Weight Progress</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.weightChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-800" />
              <XAxis 
                dataKey="formattedDate" 
                stroke="#9ca3af"
                style={{ fontSize: '10px' }}
                className="sm:text-xs"
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '10px' }}
                className="sm:text-xs"
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  fontSize: '12px'
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, fill: '#16a34a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
