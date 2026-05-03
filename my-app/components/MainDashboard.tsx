'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateCalories, formatCalories, formatWeightChange, getDeficitStatus } from '@/lib/calorieCalculations';

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
  
  // Progress & predictions (removed - now using deficit history for forecast)
  
  // Weight chart data
  weightChartData: Array<{
    date: string;
    weight: number;
    formattedDate: string;
  }>;
  
  // Deficit history
  deficitHistory?: {
    last10Days: Array<{
      date: string;
      consumed: number;
      burned: number;
      deficit: number;
      weight?: number;
      tdee?: number;
      formattedDate: string;
    }>;
    last30Days: {
      totalDeficit: number;
      expectedWeightChange: number;
      avgDailyDeficit: number;
    };
  };
  
  // Weekly macros
  weeklyMacros?: {
    idealMacros: {
      protein: number;
      carbs: number;
      fat: number;
      calories: number;
      tdee: number;
      avgDailyWorkout: number;
    } | null;
    dailyMacros: Array<{
      date: string;
      formattedDate: string;
      dayOfWeek: string;
      protein: number;
      carbs: number;
      fat: number;
      calories: number;
      workoutCalories: number;
      hasData: boolean;
    }>;
    weeklyAverages: {
      protein: number;
      carbs: number;
      fat: number;
      calories: number;
      workoutCalories: number;
    } | null;
    daysWithData: number;
  };
  
  // Goal
  goal?: {
    targetWeight: number;
    targetDate: Date;
    daysRemaining: number;
    weightToLose: number;
    requiredDailyDeficit: number;
    requiredWeeklyDeficit: number;
    isAchievable: boolean;
  } | null;
  
  // Profile status
  hasCompleteProfile: boolean;
  hasWeight: boolean;
}

export default function MainDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [user, selectedDate]); // Re-fetch when date changes

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel (removed prediction API since we use deficit history for forecast)
      const [caloriesRes, weightRes, foodTotalsRes, weightHistoryRes, deficitHistoryRes, weeklyMacrosRes, goalRes] = await Promise.all([
        fetch(`/api/calories/daily?userId=${user?.userId}&date=${selectedDate}`),
        fetch(`/api/body/weight?userId=${user?.userId}&limit=1`),
        fetch(`/api/food/daily-totals?userId=${user?.userId}&date=${selectedDate}`),
        fetch(`/api/body/weight?userId=${user?.userId}&limit=30`),
        fetch(`/api/calories/history?userId=${user?.userId}&days=30`),
        fetch(`/api/macros/weekly?userId=${user?.userId}&days=7`),
        fetch(`/api/user/goal?userId=${user?.userId}`),
      ]);

      const caloriesData = await caloriesRes.json();
      const weightData = await weightRes.json();
      const foodTotalsData = await foodTotalsRes.json();
      const weightHistoryData = await weightHistoryRes.json();
      const deficitHistoryData = await deficitHistoryRes.json();
      const weeklyMacrosData = await weeklyMacrosRes.json();
      const goalData = await goalRes.json();

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

      // Process weight history for chart
      if (weightHistoryData.success && weightHistoryData.entries.length > 0) {
        const chartData = weightHistoryData.entries.reverse().map((entry: any) => ({
          date: entry.timestamp,
          weight: entry.weight,
          formattedDate: new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));

        // Add goal trajectory if goal exists
        if (dashboardData.goal && dashboardData.currentWeight) {
          const today = new Date();
          const targetDate = new Date(dashboardData.goal.targetDate);
          const startWeight = dashboardData.currentWeight;
          const targetWeight = dashboardData.goal.targetWeight;
          const totalDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const dailyWeightLoss = (startWeight - targetWeight) / totalDays;

          // Add trajectory to each data point
          chartData.forEach((point: any, index: number) => {
            const pointDate = new Date(point.date);
            const daysFromToday = Math.ceil((pointDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysFromToday <= 0) {
              // Past dates - show trajectory from start
              const daysFromStart = Math.ceil((pointDate.getTime() - new Date(chartData[0].date).getTime()) / (1000 * 60 * 60 * 24));
              point.goalTrajectory = startWeight - (dailyWeightLoss * daysFromStart);
            } else if (daysFromToday <= totalDays) {
              // Future dates within goal period
              point.goalTrajectory = startWeight - (dailyWeightLoss * daysFromToday);
            } else {
              // Beyond goal date
              point.goalTrajectory = targetWeight;
            }
          });

          // Extend chart to show future trajectory
          const lastDate = new Date(chartData[chartData.length - 1].date);
          for (let i = 1; i <= Math.min(totalDays, 30); i++) {
            const futureDate = new Date(lastDate);
            futureDate.setDate(futureDate.getDate() + i);
            
            if (futureDate <= targetDate) {
              const daysFromToday = Math.ceil((futureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              chartData.push({
                date: futureDate.toISOString(),
                weight: null, // No actual weight yet
                goalTrajectory: startWeight - (dailyWeightLoss * daysFromToday),
                formattedDate: futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              });
            }
          }
        }

        dashboardData.weightChartData = chartData;
      }

      // Process deficit history - always set it even if empty
      if (deficitHistoryData.history) {
        const history = deficitHistoryData.history;
        console.log('=== DEFICIT HISTORY DEBUG ===');
        console.log('Raw history data:', history);
        console.log('Daily data array:', history.dailyData);
        console.log('Total deficit from API:', history.totalDeficit);
        console.log('Days from API:', history.days);
        
        // Calculate average based on actual logged days (length of dailyData array)
        const loggedDays = history.dailyData.length;
        const avgDailyDeficit = loggedDays > 0 ? history.totalDeficit / loggedDays : 0;
        
        // Forecast 7-day weight change based on average daily deficit
        const forecastedDeficit = avgDailyDeficit * 7;
        const forecastedWeightChange = forecastedDeficit / 7700;
        
        console.log('Logged days count:', loggedDays);
        console.log('Calculated avg daily deficit:', avgDailyDeficit);
        console.log('7-day forecasted deficit:', forecastedDeficit);
        console.log('7-day forecasted weight change:', forecastedWeightChange);
        console.log('Expected weight change:', history.expectedWeightChange);
        
        dashboardData.deficitHistory = {
          last10Days: history.dailyData.slice(0, 10),
          last30Days: {
            totalDeficit: history.totalDeficit,
            expectedWeightChange: forecastedWeightChange, // Use forecasted value
            avgDailyDeficit: avgDailyDeficit,
          }
        };
        console.log('Final deficit history object:', dashboardData.deficitHistory);
        console.log('=== END DEBUG ===');
      } else {
        console.log('Deficit history failed:', deficitHistoryData); // Debug log
        // Set empty deficit history so section still shows
        dashboardData.deficitHistory = {
          last10Days: [],
          last30Days: {
            totalDeficit: 0,
            expectedWeightChange: 0,
            avgDailyDeficit: 0,
          }
        };
      }

      // Process weekly macros
      if (weeklyMacrosData.success && weeklyMacrosData.data) {
        dashboardData.weeklyMacros = weeklyMacrosData.data;
      }

      // Process goal
      if (goalData.success && goalData.goal && dashboardData.currentWeight) {
        const targetDate = new Date(goalData.goal.targetDate);
        const today = new Date();
        const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const weightToLose = dashboardData.currentWeight - goalData.goal.targetWeight;
        
        // Calculate required deficit
        // 1 kg = 7700 kcal
        const totalDeficitNeeded = weightToLose * 7700;
        const requiredDailyDeficit = daysRemaining > 0 ? totalDeficitNeeded / daysRemaining : 0;
        const requiredWeeklyDeficit = requiredDailyDeficit * 7;
        
        // Check if achievable (max safe rate: 1 kg per week = 1100 kcal/day deficit)
        const isAchievable = requiredDailyDeficit <= 1100;
        
        dashboardData.goal = {
          targetWeight: goalData.goal.targetWeight,
          targetDate,
          daysRemaining,
          weightToLose,
          requiredDailyDeficit: Math.round(requiredDailyDeficit),
          requiredWeeklyDeficit: Math.round(requiredWeeklyDeficit),
          isAchievable,
        };
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
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const goToPreviousDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newDay = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${newYear}-${newMonth}-${newDay}`);
  };

  const goToNextDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newDay = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${newYear}-${newMonth}-${newDay}`);
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
  const isWeightLoss = data.deficitHistory && data.deficitHistory.last30Days.expectedWeightChange > 0;

  // Use centralized calculation function
  const todayCalculation = calculateCalories({
    tdee: data.tdee,
    consumed: data.consumed,
    burned: data.burned,
  });

  const carbsPercentage = calculateMacroPercentage(data.carbs, carbsGoal);
  const proteinPercentage = calculateMacroPercentage(data.protein, proteinGoal);
  const fatPercentage = calculateMacroPercentage(data.fat, fatGoal);

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDate()}</p>
            {!isToday && (
              <button
                onClick={goToToday}
                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                Go to Today
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Date Navigation */}
          <button
            onClick={goToPreviousDay}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            title="Previous Day"
          >
            <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
            className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          
          <button
            onClick={goToNextDay}
            disabled={isToday}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Day"
          >
            <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Refresh Button */}
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

      {/* Main Stats Grid */}
      {data.hasCompleteProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calories Card */}
          <div className={`lg:col-span-2 rounded-2xl p-6 shadow-lg transition-colors ${
            todayCalculation.isDeficit
              ? 'bg-gradient-to-br from-green-400 to-green-500 dark:from-green-600 dark:to-green-700'
              : 'bg-gradient-to-br from-red-400 to-red-500 dark:from-red-600 dark:to-red-700'
          }`}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-white/80 text-sm font-medium mb-1">
                  {isToday ? "Today's Calories" : "Calories"}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">
                    {Math.abs(Math.round(todayCalculation.remaining))}
                  </span>
                  <span className="text-white/80 text-lg">
                    {todayCalculation.isDeficit ? 'left' : 'over'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/70 text-xs mb-1">Budget</div>
                <div className="text-white text-2xl font-bold">{todayCalculation.totalBudget}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    todayCalculation.isDeficit ? 'bg-white' : 'bg-red-200'
                  }`}
                  style={{ 
                    width: `${Math.min(100, Math.max(0, 100 - todayCalculation.remainingPercentage))}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <div className="text-white/70 text-xs mb-1">Maintenance</div>
                <div className="text-white text-lg font-bold">{todayCalculation.maintenance}</div>
              </div>
              {todayCalculation.workoutBonus > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                  <div className="text-white/70 text-xs mb-1">Workout</div>
                  <div className="text-white text-lg font-bold">+{todayCalculation.workoutBonus}</div>
                </div>
              )}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <div className="text-white/70 text-xs mb-1">Eaten</div>
                <div className="text-white text-lg font-bold">{todayCalculation.consumed}</div>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4 text-center">
              <div className="text-white/80 text-xs">
                {todayCalculation.isDeficit
                  ? `✅ Deficit: ${formatCalories(todayCalculation.actualDeficit)} kcal`
                  : `❌ Surplus: ${formatCalories(Math.abs(todayCalculation.actualDeficit))} kcal`
                }
              </div>
            </div>
          </div>

          {/* Body Stats Card */}
          {data.hasWeight && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Body Stats</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-zinc-600 dark:text-zinc-400 text-xs mb-1">Weight</div>
                  <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                    {data.currentWeight?.toFixed(1)}
                    <span className="text-lg text-zinc-500 ml-1">kg</span>
                  </div>
                </div>
                {data.currentBMI && (
                  <div>
                    <div className="text-zinc-600 dark:text-zinc-400 text-xs mb-1">BMI</div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                      {data.currentBMI.toFixed(1)}
                    </div>
                  </div>
                )}
                {data.deficitHistory && data.deficitHistory.last30Days.expectedWeightChange !== 0 && (
                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="text-zinc-600 dark:text-zinc-400 text-xs mb-1">7-Day Forecast</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                        {(data.currentWeight! - data.deficitHistory.last30Days.expectedWeightChange).toFixed(1)}
                      </span>
                      <span className={`text-sm font-medium ${
                        data.deficitHistory.last30Days.expectedWeightChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {data.deficitHistory.last30Days.expectedWeightChange > 0 ? '↓' : '↑'} {Math.abs(data.deficitHistory.last30Days.expectedWeightChange).toFixed(1)} kg
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Based on your avg daily deficit
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Macros Card */}
      {data.hasCompleteProfile && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
            {isToday ? "Today's Macros" : "Macros"}
          </h3>
          <div className="grid grid-cols-3 gap-6">
            {/* Protein */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#f3f4f6" strokeWidth="8" fill="none" className="dark:stroke-zinc-800" />
                  <circle
                    cx="48" cy="48" r="40" stroke="#f97316" strokeWidth="8" fill="none"
                    strokeDasharray="251"
                    strokeDashoffset={251 - (251 * Math.min(proteinPercentage / 100, 1))}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{data.protein}</div>
                  <div className="text-xs text-zinc-500">/{proteinGoal}g</div>
                </div>
              </div>
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Protein</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{proteinPercentage}%</div>
            </div>

            {/* Carbs */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#f3f4f6" strokeWidth="8" fill="none" className="dark:stroke-zinc-800" />
                  <circle
                    cx="48" cy="48" r="40" stroke="#ef4444" strokeWidth="8" fill="none"
                    strokeDasharray="251"
                    strokeDashoffset={251 - (251 * Math.min(carbsPercentage / 100, 1))}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{data.carbs}</div>
                  <div className="text-xs text-zinc-500">/{carbsGoal}g</div>
                </div>
              </div>
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Carbs</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{carbsPercentage}%</div>
            </div>

            {/* Fat */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#f3f4f6" strokeWidth="8" fill="none" className="dark:stroke-zinc-800" />
                  <circle
                    cx="48" cy="48" r="40" stroke="#3b82f6" strokeWidth="8" fill="none"
                    strokeDasharray="251"
                    strokeDashoffset={251 - (251 * Math.min(fatPercentage / 100, 1))}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{data.fat}</div>
                  <div className="text-xs text-zinc-500">/{fatGoal}g</div>
                </div>
              </div>
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Fat</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{fatPercentage}%</div>
            </div>
          </div>
          {(data.protein === 0 && data.carbs === 0 && data.fat === 0) && (
            <div className="mt-4 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No food logged today. Add entries in the <strong>Food</strong> tab.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Goal Card */}
      {data.goal && data.currentWeight && (
        <div className={`rounded-2xl p-6 shadow-lg border transition-colors ${
          data.goal.isAchievable
            ? 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800'
            : 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className={`text-sm font-medium mb-1 ${
                data.goal.isAchievable ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'
              }`}>
                🎯 Weight Goal
              </h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${
                  data.goal.isAchievable ? 'text-purple-900 dark:text-purple-50' : 'text-orange-900 dark:text-orange-50'
                }`}>
                  {data.goal.targetWeight} kg
                </span>
                <span className={`text-sm ${
                  data.goal.isAchievable ? 'text-purple-700 dark:text-purple-300' : 'text-orange-700 dark:text-orange-300'
                }`}>
                  by {new Date(data.goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
              <div className={`text-xs mb-1 ${
                data.goal.isAchievable ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'
              }`}>
                To Lose
              </div>
              <div className={`text-xl font-bold ${
                data.goal.isAchievable ? 'text-purple-900 dark:text-purple-50' : 'text-orange-900 dark:text-orange-50'
              }`}>
                {data.goal.weightToLose.toFixed(1)} kg
              </div>
            </div>

            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
              <div className={`text-xs mb-1 ${
                data.goal.isAchievable ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'
              }`}>
                Days Left
              </div>
              <div className={`text-xl font-bold ${
                data.goal.isAchievable ? 'text-purple-900 dark:text-purple-50' : 'text-orange-900 dark:text-orange-50'
              }`}>
                {data.goal.daysRemaining}
              </div>
            </div>

            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
              <div className={`text-xs mb-1 ${
                data.goal.isAchievable ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'
              }`}>
                Daily Deficit
              </div>
              <div className={`text-xl font-bold ${
                data.goal.isAchievable ? 'text-purple-900 dark:text-purple-50' : 'text-orange-900 dark:text-orange-50'
              }`}>
                {data.goal.requiredDailyDeficit}
              </div>
              <div className={`text-xs ${
                data.goal.isAchievable ? 'text-purple-700 dark:text-purple-300' : 'text-orange-700 dark:text-orange-300'
              }`}>
                kcal/day
              </div>
            </div>

            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
              <div className={`text-xs mb-1 ${
                data.goal.isAchievable ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'
              }`}>
                Weekly Pace
              </div>
              <div className={`text-xl font-bold ${
                data.goal.isAchievable ? 'text-purple-900 dark:text-purple-50' : 'text-orange-900 dark:text-orange-50'
              }`}>
                {(data.goal.weightToLose / (data.goal.daysRemaining / 7)).toFixed(2)}
              </div>
              <div className={`text-xs ${
                data.goal.isAchievable ? 'text-purple-700 dark:text-purple-300' : 'text-orange-700 dark:text-orange-300'
              }`}>
                kg/week
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className={data.goal.isAchievable ? 'text-purple-700 dark:text-purple-300' : 'text-orange-700 dark:text-orange-300'}>
                Current: {data.currentWeight.toFixed(1)} kg
              </span>
              <span className={data.goal.isAchievable ? 'text-purple-700 dark:text-purple-300' : 'text-orange-700 dark:text-orange-300'}>
                Target: {data.goal.targetWeight} kg
              </span>
            </div>
            <div className="h-3 bg-white/30 dark:bg-black/30 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  data.goal.isAchievable ? 'bg-purple-600 dark:bg-purple-400' : 'bg-orange-600 dark:bg-orange-400'
                }`}
                style={{ 
                  width: `${Math.min(100, Math.max(0, ((data.currentWeight - data.goal.targetWeight) / data.goal.weightToLose) * 100))}%` 
                }}
              ></div>
            </div>
          </div>

          {!data.goal.isAchievable && (
            <div className="bg-orange-200 dark:bg-orange-900/40 rounded-lg p-3 text-xs text-orange-900 dark:text-orange-200">
              ⚠️ <strong>Warning:</strong> This goal requires a deficit of {data.goal.requiredDailyDeficit} kcal/day, which exceeds the safe maximum of 1100 kcal/day. Consider extending your timeline.
            </div>
          )}

          {data.goal.isAchievable && (
            <div className="bg-purple-200 dark:bg-purple-900/40 rounded-lg p-3 text-xs text-purple-900 dark:text-purple-200">
              ✅ This goal is achievable with consistent effort. Maintain a daily deficit of {data.goal.requiredDailyDeficit} kcal to reach your target!
            </div>
          )}
        </div>
      )}

      {/* Weight Progress Chart */}
      {data.weightChartData.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Weight Progress</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.weightChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-800" />
              <XAxis 
                dataKey="formattedDate" 
                stroke="#9ca3af"
                style={{ fontSize: '11px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '11px' }}
                domain={[
                  (dataMin: number) => data.goal ? Math.min(dataMin - 2, data.goal.targetWeight - 2) : dataMin - 2,
                  'dataMax + 2'
                ]}
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
              {/* Goal Trajectory Line - shows ideal path to goal */}
              {data.goal && (
                <Line
                  type="monotone"
                  dataKey="goalTrajectory"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Goal Path"
                />
              )}
              {/* Actual Weight Line */}
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#16a34a' }}
                name="Actual Weight"
              />
            </LineChart>
          </ResponsiveContainer>
          {data.goal && (
            <div className="mt-3 flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-6 h-1 bg-green-500 rounded"></div>
                <span className="text-zinc-600 dark:text-zinc-400">Your Weight</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-0.5 bg-purple-500" style={{ borderTop: '2px dashed #a855f7' }}></div>
                <span className="text-zinc-600 dark:text-zinc-400">Goal Path (to {data.goal.targetWeight} kg)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deficit History Section */}
      {data.deficitHistory ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Calorie Deficit History</h3>
          
          {!data.hasCompleteProfile ? (
            <div className="text-center py-8">
              <p className="text-zinc-500 dark:text-zinc-400 mb-2">Complete your profile to see deficit history</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Go to the <strong>Body</strong> tab to add age, gender, activity level, weight, and height</p>
            </div>
          ) : data.deficitHistory.last10Days && data.deficitHistory.last10Days.length > 0 ? (
            <>
              {/* 30-Day Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="text-blue-600 dark:text-blue-400 text-xs font-medium mb-1">
                Total Deficit ({data.deficitHistory.last10Days.length} days logged)
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-50">
                {formatCalories(data.deficitHistory.last30Days.totalDeficit)}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">kcal</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="text-purple-600 dark:text-purple-400 text-xs font-medium mb-1">Avg Daily Deficit</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-50">
                {formatCalories(data.deficitHistory.last30Days.avgDailyDeficit)}
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">kcal/day</div>
            </div>

            <div className={`bg-gradient-to-br rounded-xl p-4 border ${
              data.deficitHistory.last30Days.expectedWeightChange > 0
                ? 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
                : 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
            }`}>
              <div className={`text-xs font-medium mb-1 ${
                data.deficitHistory.last30Days.expectedWeightChange > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                7-Day Forecast
              </div>
              <div className={`text-2xl font-bold ${
                data.deficitHistory.last30Days.expectedWeightChange > 0
                  ? 'text-green-900 dark:text-green-50'
                  : 'text-red-900 dark:text-red-50'
              }`}>
                {formatWeightChange(data.deficitHistory.last30Days.expectedWeightChange)}
              </div>
              <div className={`text-xs mt-1 ${
                data.deficitHistory.last30Days.expectedWeightChange > 0
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                if you continue
              </div>
            </div>
          </div>

          {/* Last 10 Days Table */}
          <div>
            <h4 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-3">Last 10 Days Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Date</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Weight</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">TDEE</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Workout</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Budget</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Eaten</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Deficit</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deficitHistory.last10Days.map((day, index) => {
                    // Use centralized calculation for each day
                    const dayCalc = calculateCalories({
                      tdee: day.tdee || data.tdee,
                      consumed: day.consumed,
                      burned: day.burned,
                    });
                    const status = getDeficitStatus(dayCalc.isDeficit);
                    
                    return (
                      <tr key={day.date} className={`border-b border-zinc-100 dark:border-zinc-800 ${
                        index === 0 ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''
                      }`}>
                        <td className="py-3 px-3 text-zinc-900 dark:text-zinc-50 font-medium">
                          {day.formattedDate}
                          {index === 0 && <span className="ml-2 text-xs text-zinc-500">(Today)</span>}
                        </td>
                        <td className="py-3 px-3 text-right text-zinc-700 dark:text-zinc-300">
                          {day.weight ? `${day.weight.toFixed(1)} kg` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400 font-medium">
                          {day.tdee || dayCalc.maintenance}
                        </td>
                        <td className="py-3 px-3 text-right text-orange-600 dark:text-orange-400">
                          {dayCalc.workoutBonus > 0 ? `+${dayCalc.workoutBonus}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right text-zinc-700 dark:text-zinc-300 font-medium">
                          {dayCalc.totalBudget}
                        </td>
                        <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 font-medium">
                          {dayCalc.consumed}
                        </td>
                        <td className={`py-3 px-3 text-right font-bold ${
                          status.color === 'green'
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatCalories(dayCalc.actualDeficit)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            status.color === 'green'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {status.emoji} {status.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Note */}
          <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              <strong>Formula:</strong> Deficit = (Maintenance {todayCalculation.maintenance} + Workout) - Eaten. 
              Weight change: 1 kg ≈ 7,700 kcal. 
              {data.deficitHistory.last30Days.expectedWeightChange > 0 
                ? ' Positive deficit = weight loss.' 
                : ' Negative deficit (surplus) = weight gain.'}
              {' '}The 7-day forecast is based on your average daily deficit from logged days.
            </p>
          </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-zinc-500 dark:text-zinc-400">No deficit history data available yet. Start logging food and workouts!</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Weekly Macros Section */}
      {data.weeklyMacros && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Weekly Macro Tracking</h3>
          
          {/* Ideal Macros vs Actual */}
          {data.weeklyMacros.idealMacros && data.weeklyMacros.weeklyAverages && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Ideal Targets */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="text-blue-600 dark:text-blue-400 text-xs font-medium mb-3">💡 Ideal Daily Targets</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-900 dark:text-blue-50">Calories</span>
                    <span className="text-lg font-bold text-blue-900 dark:text-blue-50">{data.weeklyMacros.idealMacros.calories} kcal</span>
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                    TDEE {data.weeklyMacros.idealMacros.tdee} + Avg Workout {data.weeklyMacros.idealMacros.avgDailyWorkout}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-900 dark:text-blue-50">Protein (30%)</span>
                    <span className="text-base font-bold text-orange-600 dark:text-orange-400">{data.weeklyMacros.idealMacros.protein}g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-900 dark:text-blue-50">Carbs (40%)</span>
                    <span className="text-base font-bold text-red-600 dark:text-red-400">{data.weeklyMacros.idealMacros.carbs}g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-900 dark:text-blue-50">Fat (30%)</span>
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">{data.weeklyMacros.idealMacros.fat}g</span>
                  </div>
                </div>
              </div>

              {/* Actual Averages */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <h4 className="text-green-600 dark:text-green-400 text-xs font-medium mb-3">📊 Your 7-Day Average ({data.weeklyMacros.daysWithData} days logged)</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-900 dark:text-green-50">Calories</span>
                    <span className="text-lg font-bold text-green-900 dark:text-green-50">{data.weeklyMacros.weeklyAverages.calories} kcal</span>
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300 mb-2">
                    {data.weeklyMacros.weeklyAverages.calories < data.weeklyMacros.idealMacros.calories 
                      ? `${data.weeklyMacros.idealMacros.calories - data.weeklyMacros.weeklyAverages.calories} below target` 
                      : `${data.weeklyMacros.weeklyAverages.calories - data.weeklyMacros.idealMacros.calories} above target`}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-900 dark:text-green-50">Protein</span>
                    <span className="text-base font-bold text-orange-600 dark:text-orange-400">
                      {data.weeklyMacros.weeklyAverages.protein}g
                      <span className="text-xs ml-1">
                        ({Math.round((data.weeklyMacros.weeklyAverages.protein / data.weeklyMacros.idealMacros.protein) * 100)}%)
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-900 dark:text-green-50">Carbs</span>
                    <span className="text-base font-bold text-red-600 dark:text-red-400">
                      {data.weeklyMacros.weeklyAverages.carbs}g
                      <span className="text-xs ml-1">
                        ({Math.round((data.weeklyMacros.weeklyAverages.carbs / data.weeklyMacros.idealMacros.carbs) * 100)}%)
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-900 dark:text-green-50">Fat</span>
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                      {data.weeklyMacros.weeklyAverages.fat}g
                      <span className="text-xs ml-1">
                        ({Math.round((data.weeklyMacros.weeklyAverages.fat / data.weeklyMacros.idealMacros.fat) * 100)}%)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Breakdown Table */}
          <div>
            <h4 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-3">Last 7 Days Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Date</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Calories</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Protein</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Carbs</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Fat</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Workout</th>
                  </tr>
                </thead>
                <tbody>
                  {data.weeklyMacros.dailyMacros.map((day, index) => (
                    <tr key={day.date} className={`border-b border-zinc-100 dark:border-zinc-800 ${
                      !day.hasData ? 'opacity-50' : ''
                    } ${index === 0 ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''}`}>
                      <td className="py-3 px-3 text-zinc-900 dark:text-zinc-50 font-medium">
                        <div>{day.dayOfWeek}</div>
                        <div className="text-xs text-zinc-500">{day.formattedDate}</div>
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-700 dark:text-zinc-300 font-medium">
                        {day.hasData ? day.calories : '-'}
                      </td>
                      <td className="py-3 px-3 text-right text-orange-600 dark:text-orange-400 font-medium">
                        {day.hasData ? `${day.protein}g` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 font-medium">
                        {day.hasData ? `${day.carbs}g` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400 font-medium">
                        {day.hasData ? `${day.fat}g` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right text-green-600 dark:text-green-400">
                        {day.workoutCalories > 0 ? `+${day.workoutCalories}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Note */}
          <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              <strong>Macro Split:</strong> 30% Protein, 40% Carbs, 30% Fat based on your average daily calorie budget (TDEE + avg workout calories).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
