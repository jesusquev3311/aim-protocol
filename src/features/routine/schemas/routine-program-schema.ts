import { z } from "zod";

export const routineProgramDurations = [7, 15, 30] as const;
export const routineProgramSchema = z.object({
  name: z.string().trim().min(3, "Use at least 3 characters.").max(60, "Use 60 characters or fewer."),
  startDate: z.string().min(1, "Choose a start date."),
  durationDays: z.union([z.literal(7), z.literal(15), z.literal(30)]),
  templateCode: z.enum(["mechanics_protocol", "corner_strafe_benchmark"]),
  setsPerSide: z.union([z.literal(5), z.literal(7)]).nullable(),
}).superRefine((values, context) => {
  if (values.templateCode === "corner_strafe_benchmark" && values.setsPerSide === null) context.addIssue({ code: "custom", path: ["setsPerSide"], message: "Choose 5 or 7 sets per corner." });
  if (values.templateCode === "mechanics_protocol" && values.setsPerSide !== null) context.addIssue({ code: "custom", path: ["setsPerSide"], message: "Sets apply only to the Corner Strafe Benchmark." });
});

export type RoutineProgramValues = z.infer<typeof routineProgramSchema>;
