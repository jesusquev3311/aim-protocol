type MatchScore = { kills: number; deaths: number };
type TrainingDaySummary = { id: string; day_number: number; date: string; status: "pending" | "partial" | "completed" };

export function calculateKd({ kills, deaths }: MatchScore) {
  return deaths === 0 ? kills : kills / deaths;
}

export function calculateAverageKd(matches: MatchScore[]) {
  if (matches.length === 0) return 0;
  return matches.reduce((total, match) => total + calculateKd(match), 0) / matches.length;
}

export function getCurrentTrainingDay(days: TrainingDaySummary[], today = getLocalDate()) {
  if (days.length === 0) return null;
  return days.find((day) => day.date === today)
    ?? [...days].reverse().find((day) => day.date < today)
    ?? days[0];
}

export function getRecommendedWeapon(matchNumber: number) {
  if (matchNumber <= 2) return "Sheriff";
  if (matchNumber <= 4) return "Guardian";
  return "Vandal or Phantom";
}

function getLocalDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
