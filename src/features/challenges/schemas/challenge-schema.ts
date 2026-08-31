import { z } from "zod";

export const challengeDurations = [5, 7, 15, 20, 30, 60] as const;
export const matchesPerDayOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const createChallengeSchema = z.object({
  durationDays: z.number().refine(
    (value) => challengeDurations.some((duration) => duration === value),
    "Choose an available duration",
  ),
  matchesPerDay: z.number().int().min(1, "Choose at least 1 match").max(10, "Choose no more than 10 matches"),
  startDate: z.string().date("Choose a valid start date"),
  recommendedMode: z.boolean(),
  skillIds: z.array(z.number().int().positive()).min(1, "Select at least one skill"),
});

export type CreateChallengeValues = z.infer<typeof createChallengeSchema>;
