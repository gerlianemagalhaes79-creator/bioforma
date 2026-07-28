import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Calculates active study streak in consecutive days.
 * An active streak requires activity today (or yesterday).
 * If the user's last activity was before yesterday, streak resets to 0 (or 1 on new activity today).
 */
export function calculateStreak(activityDates: string[] = []): number {
  if (!activityDates || activityDates.length === 0) return 0;

  // Filter valid YYYY-MM-DD strings and remove duplicates
  const sortedDates = Array.from(new Set(activityDates))
    .filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort((a, b) => b.localeCompare(a)); // Descending order (newest first)

  if (sortedDates.length === 0) return 0;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  const yesterdayStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;

  const newest = sortedDates[0];

  // If user hasn't been active today OR yesterday, the streak is broken (0 days)
  if (newest !== todayStr && newest !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  let currDate = new Date(newest + 'T12:00:00');

  while (true) {
    const prevDate = new Date(currDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;

    if (sortedDates.includes(prevStr)) {
      streak++;
      currDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Registers activity for today, recalculates streak,
 * saves to localStorage and Firestore user document.
 */
export async function recordUserActivity(uid?: string): Promise<number> {
  const activeUid = uid || 'guest';
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const storageKey = `activity_dates_${activeUid}`;
  let dates: string[] = [];

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) dates = JSON.parse(raw);
  } catch (_) {}

  // Also collect dates from question logs in localStorage if available
  try {
    const qLogsRaw = localStorage.getItem(`questionLogs_${activeUid}`);
    if (qLogsRaw) {
      const qLogs = JSON.parse(qLogsRaw);
      if (Array.isArray(qLogs)) {
        qLogs.forEach((log: any) => {
          if (log.timestamp) {
            const dateStr = new Date(log.timestamp).toISOString().split('T')[0];
            if (dateStr && !dates.includes(dateStr)) {
              dates.push(dateStr);
            }
          }
        });
      }
    }
  } catch (_) {}

  if (!dates.includes(todayStr)) {
    dates.push(todayStr);
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(dates));
  } catch (_) {}

  const newStreak = calculateStreak(dates);

  if (activeUid && activeUid !== 'guest') {
    try {
      await setDoc(doc(db, 'users', activeUid), {
        activityDates: dates,
        streakDays: newStreak,
        lastActiveDate: todayStr
      }, { merge: true });
    } catch (err) {
      console.warn("Erro ao salvar streak no Firestore:", err);
    }
  }

  window.dispatchEvent(new Event('userStreakUpdated'));
  return newStreak;
}
