import { z } from "zod";

export const deathmatchRatings = ["poor", "average", "good"] as const;
export const weaponOptions = ["Sheriff", "Guardian", "Vandal", "Phantom", "Other"] as const;

export const deathmatchSchema = z.object({
  kills: z.number().int().min(0, "Kills cannot be negative").max(999, "Enter a realistic value"),
  deaths: z.number().int().min(0, "Deaths cannot be negative").max(999, "Enter a realistic value"),
  weapon: z.string().trim().min(1, "Choose a weapon"),
  rating: z.enum(deathmatchRatings),
  notes: z.string().trim().max(1000, "Notes must be 1,000 characters or fewer"),
});

export type DeathmatchValues = z.infer<typeof deathmatchSchema>;
export type SkillResult = (typeof deathmatchRatings)[number];
