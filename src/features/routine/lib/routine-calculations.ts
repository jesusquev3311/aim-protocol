type RoutineProgressInput = { overaimBots: number; underaimBots: number; flickBots: number; microflickMinutes: number; practiceMinutes: number };
type RoutineHistoryItem = { session_date: string; ranked_matches: number; completed_at: string | null };

export function calculateRoutineProgress(values: RoutineProgressInput) {
  const ratios = [values.overaimBots / 30, values.underaimBots / 30, values.flickBots / 30, values.microflickMinutes / 3, values.practiceMinutes / 30];
  return Math.round((ratios.reduce((sum, ratio) => sum + Math.min(1, ratio), 0) / ratios.length) * 100);
}

export function isRoutineComplete(values: RoutineProgressInput) {
  return values.overaimBots >= 30 && values.underaimBots >= 30 && values.flickBots >= 30 && values.microflickMinutes >= 3 && values.practiceMinutes >= 30;
}

export function getWeekBounds(date: string) {
  const value = new Date(`${date}T12:00:00`);
  const day = value.getDay();
  value.setDate(value.getDate() - ((day + 6) % 7));
  const start = toLocalDate(value);
  value.setDate(value.getDate() + 6);
  return { start, end: toLocalDate(value) };
}

export function calculateWeeklyRanked(sessions: RoutineHistoryItem[], selectedDate: string) {
  const { start, end } = getWeekBounds(selectedDate);
  return sessions.filter((session) => session.session_date >= start && session.session_date <= end).reduce((total, session) => total + session.ranked_matches, 0);
}

export function calculateRoutineStreak(sessions: RoutineHistoryItem[], today: string) {
  const completed = new Set(sessions.filter((session) => session.completed_at).map((session) => session.session_date));
  const cursor = new Date(`${today}T12:00:00`);
  if (!completed.has(today)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (completed.has(toLocalDate(cursor))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

function toLocalDate(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}
