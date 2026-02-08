import { z } from "zod";

// Strava API response schemas

export const StravaAthleteSchema = z.object({
  id: z.number(),
  username: z.string().nullable(),
  firstname: z.string(),
  lastname: z.string(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  profile: z.string(), // profile image URL
  profile_medium: z.string().nullable(),
  bikes: z.array(
    z.object({
      id: z.string(),
      primary: z.boolean(),
      name: z.string(),
      distance: z.number(),
    })
  ).optional(),
});

export const StravaGearSchema = z.object({
  id: z.string(),
  primary: z.boolean(),
  name: z.string(),
  distance: z.number(), // in meters
  brand_name: z.string().nullable().optional(),
  model_name: z.string().nullable().optional(),
  frame_type: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const StravaActivitySchema = z.object({
  id: z.number(),
  name: z.string(),
  distance: z.number(), // in meters
  moving_time: z.number(), // in seconds
  elapsed_time: z.number(),
  start_date: z.string(), // ISO date string
  start_date_local: z.string(),
  type: z.string(),
  sport_type: z.string().optional(),
  gear_id: z.string().nullable(),
});

export const StravaTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number(), // Unix timestamp
  expires_in: z.number(),
  token_type: z.string(),
});

// Types derived from schemas
export type StravaAthlete = z.infer<typeof StravaAthleteSchema>;
export type StravaGear = z.infer<typeof StravaGearSchema>;
export type StravaActivity = z.infer<typeof StravaActivitySchema>;
export type StravaTokenResponse = z.infer<typeof StravaTokenResponseSchema>;
