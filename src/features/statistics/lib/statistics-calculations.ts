type Day = { id: string; day_number: number; status: "pending" | "completed"; completed_at: string | null };
type Match = { training_day_id: string; weapon: string; kills: number; deaths: number };
type Skill = { id: number; name: string };
type SkillResult = { skill_id: number; result: "poor" | "average" | "good" };

export type NamedScore = { name: string; averageKd: number; matches: number };

export function buildChallengeStatistics(input: { days: Day[]; matches: Match[]; skills: Skill[]; skillResults: SkillResult[] }) {
  const overallKd = ratio(input.matches);
  const dayScores = input.days.map((day) => {
    const matches = input.matches.filter((match) => match.training_day_id === day.id);
    return { dayNumber: day.day_number, averageKd: ratio(matches), matches: matches.length, completedAt: day.completed_at };
  }).filter((day) => day.matches > 0);
  const weaponScores = groupScores(input.matches, (match) => match.weapon).sort((a, b) => b.averageKd - a.averageKd);
  const completedDays = input.days.filter((day) => day.status === "completed").length;
  const split = Math.max(1, Math.min(5, Math.floor(dayScores.length / 2)));
  const firstKd = average(dayScores.slice(0, split).map((day) => day.averageKd));
  const recentKd = average(dayScores.slice(-split).map((day) => day.averageKd));
  const improvementPercent = firstKd === 0 ? 0 : ((recentKd - firstKd) / firstKd) * 100;
  const skillScores = input.skills.map((skill) => {
    const results = input.skillResults.filter((result) => result.skill_id === skill.id);
    const counts = { poor: 0, average: 0, good: 0 };
    for (const result of results) counts[result.result] += 1;
    const score = results.length ? results.reduce((sum, result) => sum + ({ poor: 1, average: 2, good: 3 }[result.result]), 0) / results.length : 0;
    return { name: skill.name, score, counts, evaluations: results.length };
  }).filter((skill) => skill.evaluations > 0).sort((a, b) => b.score - a.score);

  const insights: string[] = [];
  if (dayScores.length < 2) insights.push("Record matches on at least two training days to unlock trend insights.");
  else if (improvementPercent > 5) insights.push(`Your recent K/D is ${Math.abs(improvementPercent).toFixed(0)}% higher than your opening sessions.`);
  else if (improvementPercent < -5) insights.push(`Your recent K/D is ${Math.abs(improvementPercent).toFixed(0)}% lower than your opening sessions. Consider shorter sessions and deliberate warm-ups.`);
  else insights.push("Your K/D is stable. Focus the next sessions on one specific mechanic to create a measurable change.");
  if (weaponScores[0]) insights.push(`${weaponScores[0].name} is your strongest recorded weapon at ${weaponScores[0].averageKd.toFixed(2)} K/D.`);
  if (skillScores.at(-1)) insights.push(`${skillScores.at(-1)?.name} is your clearest improvement area based on self-evaluations.`);

  return { totalMatches: input.matches.length, totalKills: sum(input.matches.map((match) => match.kills)), totalDeaths: sum(input.matches.map((match) => match.deaths)), overallKd, completedDays, dayScores, weaponScores, skillScores, firstKd, recentKd, improvementPercent, insights };
}

function groupScores(matches: Match[], key: (match: Match) => string): NamedScore[] {
  const groups = new Map<string, Match[]>();
  for (const match of matches) groups.set(key(match), [...(groups.get(key(match)) ?? []), match]);
  return [...groups].map(([name, values]) => ({ name, averageKd: ratio(values), matches: values.length }));
}

function ratio(matches: Pick<Match, "kills" | "deaths">[]) {
  const deaths = sum(matches.map((match) => match.deaths));
  const kills = sum(matches.map((match) => match.kills));
  return deaths === 0 ? kills : kills / deaths;
}

function sum(values: number[]) { return values.reduce((total, value) => total + value, 0); }
function average(values: number[]) { return values.length ? sum(values) / values.length : 0; }
