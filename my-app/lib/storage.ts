// Client-side storage management for user data
import { User, UserSession, WeightEntry } from './types';

const USERS_KEY = 'fitness_app_users';
const SESSION_KEY = 'fitness_app_session';
const WEIGHT_HISTORY_KEY = 'fitness_app_weight_history';

// User management
export function getAllUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveUser(user: User): void {
  const users = getAllUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByUsername(username: string): User | null {
  const users = getAllUsers();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

export function findUserById(userId: string): User | null {
  const users = getAllUsers();
  return users.find(u => u.id === userId) || null;
}

// Session management
export function saveSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}

// Weight history management
export function getAllWeightEntries(): WeightEntry[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(WEIGHT_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

export function getUserWeightHistory(userId: string): WeightEntry[] {
  const allEntries = getAllWeightEntries();
  return allEntries
    .filter(entry => entry.userId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function saveWeightEntry(entry: WeightEntry): void {
  const entries = getAllWeightEntries();
  entries.push(entry);
  localStorage.setItem(WEIGHT_HISTORY_KEY, JSON.stringify(entries));
}

export function deleteWeightEntry(entryId: string): void {
  const entries = getAllWeightEntries();
  const filtered = entries.filter(e => e.id !== entryId);
  localStorage.setItem(WEIGHT_HISTORY_KEY, JSON.stringify(filtered));
}

export function getLatestWeight(userId: string): WeightEntry | null {
  const history = getUserWeightHistory(userId);
  return history.length > 0 ? history[0] : null;
}
