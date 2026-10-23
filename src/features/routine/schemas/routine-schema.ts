import { z } from "zod";

export const routineSchema = z.object({
  flickWarmupMinutes: z.number().int().refine((value) => value === 0 || (value >= 3 && value <= 10), "Record between 3 and 10 minutes."),
  overaimBots: z.number().int().min(0).max(30, "The Easy run contains at most 30 bots."),
  underaimBots: z.number().int().min(0).max(30, "The Easy run contains at most 30 bots."),
  flickBots: z.number().int().min(0).max(30, "The Easy run contains at most 30 bots."),
  microflickMinutes: z.number().int().min(0).max(120),
  practiceMinutes: z.number().int().min(0).max(45),
  deathmatches: z.number().int().min(0).max(20),
  rankedMatches: z.number().int().min(0).max(20),
  warmupHits: z.number().int().min(0).max(999).nullable(),
  microflickHits: z.number().int().min(0).max(999).nullable(),
  deathmatchKills: z.number().int().min(0).max(999).nullable(),
  deathmatchDeaths: z.number().int().min(0).max(999).nullable(),
  deathmatchWeapon: z.string().trim().max(40).nullable(),
  perceivedDifficulty: z.number().int().min(1).max(5).nullable(),
  confidenceBefore: z.number().int().min(1).max(5).nullable(),
  confidenceAfter: z.number().int().min(1).max(5).nullable(),
  sessionFocus: z.string().trim().max(80).nullable(),
  shootingErrorGraph: z.boolean(),
  stopBeforeShooting: z.boolean(),
  noCrouchSpray: z.boolean(),
  burstStrafe: z.boolean(),
  notes: z.string().max(2000, "Notes must be 2,000 characters or fewer."),
});

export type RoutineValues = z.infer<typeof routineSchema>;
