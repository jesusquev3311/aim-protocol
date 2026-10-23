type RoutineProgressInput = { flickWarmupMinutes: number; overaimBots: number; underaimBots: number; flickBots: number; microflickMinutes: number; peekLeftRepetitions: number; peekRightRepetitions: number; strafeCloseRepetitions: number; strafeMidRepetitions: number; strafeLongRepetitions: number; practiceMinutes: number };
type RoutineHistoryItem = { session_date: string; ranked_matches: number; completed_at: string | null };

export function calculateRoutineProgress(values: RoutineProgressInput) {
  const peekRatio = average([safeRatio(values.peekLeftRepetitions, 20), safeRatio(values.peekRightRepetitions, 20)]);
  const strafeRatio = average([safeRatio(values.strafeCloseRepetitions, 60), safeRatio(values.strafeMidRepetitions, 60), safeRatio(values.strafeLongRepetitions, 60)]);
  const ratios = [safeRatio(values.flickWarmupMinutes, 3), safeRatio(values.overaimBots, 30), safeRatio(values.underaimBots, 30), safeRatio(values.flickBots, 30), safeRatio(values.microflickMinutes, 3), peekRatio, strafeRatio, safeRatio(values.practiceMinutes, 30)];
  return Math.round((ratios.reduce((sum, ratio) => sum + Math.min(1, ratio), 0) / ratios.length) * 100);
}

function average(values: number[]) { return values.reduce((sum, value) => sum + value, 0) / values.length; }

function safeRatio(value: number, target: number) {
  return Number.isFinite(value) && value > 0 ? value / target : 0;
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
