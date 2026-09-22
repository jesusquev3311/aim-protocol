import { z } from "zod";

export const routineSchema = z.object({
  sessionDate: z.string().min(1, "Choose a session date."),
  overaimBots: z.number().int().min(0).max(999),
  underaimBots: z.number().int().min(0).max(999),
  flickBots: z.number().int().min(0).max(999),
  microflickMinutes: z.number().int().min(0).max(120),
  practiceMinutes: z.number().int().min(0).max(480),
  deathmatches: z.number().int().min(0).max(20),
  rankedMatches: z.number().int().min(0).max(20),
  shootingErrorGraph: z.boolean(),
  stopBeforeShooting: z.boolean(),
  noCrouchSpray: z.boolean(),
  burstStrafe: z.boolean(),
  notes: z.string().max(2000, "Notes must be 2,000 characters or fewer."),
});

export type RoutineValues = z.infer<typeof routineSchema>;
