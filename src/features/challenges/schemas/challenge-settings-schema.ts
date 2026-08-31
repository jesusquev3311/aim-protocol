import { z } from "zod";

export const challengeSettingsSchema = z.object({
  startDate: z.string().date("Choose a valid start date"),
});

export type ChallengeSettingsValues = z.infer<typeof challengeSettingsSchema>;
