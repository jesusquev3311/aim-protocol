import { z } from "zod";

export const routineProgramDurations = [7, 15, 30] as const;
export const routineProgramSchema = z.object({
  name: z.string().trim().min(3, "Use at least 3 characters.").max(60, "Use 60 characters or fewer."),
  startDate: z.string().min(1, "Choose a start date."),
  durationDays: z.union([z.literal(7), z.literal(15), z.literal(30)]),
});

export type RoutineProgramValues = z.infer<typeof routineProgramSchema>;
