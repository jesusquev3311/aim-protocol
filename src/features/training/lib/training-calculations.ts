type MatchScore = { kills: number; deaths: number };
type TrainingDaySummary = { id: string; day_number: number; date: string; status: "pending" | "completed" };

export function calculateKd({ kills, deaths }: MatchScore) {
  return deaths === 0 ? kills : kills / deaths;
}

export function calculateAverageKd(matches: MatchScore[]) {
  if (matches.length === 0) return 0;
  const kills = matches.reduce((total, match) => total + match.kills, 0);
  const deaths = matches.reduce((total, match) => total + match.deaths, 0);
  return deaths === 0 ? kills : kills / deaths;
}

export function getCurrentTrainingDay(days: TrainingDaySummary[]) {
  if (days.length === 0) return null;
  return days.find((day) => day.status === "pending") ?? days.at(-1) ?? null;
}

export function getRecommendedWeapon(matchNumber: number) {
  if (matchNumber <= 2) return "Sheriff";
  if (matchNumber <= 4) return "Guardian";
  return "Vandal or Phantom";
}
