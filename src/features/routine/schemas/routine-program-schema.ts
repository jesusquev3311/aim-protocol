import { z } from "zod";

export const routineProgramDurations = [7, 15, 30] as const;
export const weekdayOptions = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
] as const;

export const routineProgramSchema = z.object({
  name: z.string().trim().min(3, "Use at least 3 characters.").max(60, "Use 60 characters or fewer."),
  startDate: z.string().min(1, "Choose a start date."),
  durationDays: z.union([z.literal(7), z.literal(15), z.literal(30)]),
  weekdays: z.array(z.number().int().min(1).max(7)).min(1, "Choose at least one training day."),
});

export type RoutineProgramValues = z.infer<typeof routineProgramSchema>;
