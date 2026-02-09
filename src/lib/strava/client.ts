import {
  StravaAthleteSchema,
  StravaGearSchema,
  StravaActivitySchema,
  type StravaAthlete,
  type StravaGear,
  type StravaActivity,
} from "./schemas";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

export class StravaClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetch<T>(endpoint: string, schema: { parse: (data: unknown) => T }): Promise<T> {
    const response = await fetch(`${STRAVA_API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        throw new Error("Strava rate limit exceeded. Please try again later.");
      }
      throw new Error(`Strava API request failed (${status})`);
    }

    const data = await response.json();
    return schema.parse(data);
  }

  private async fetchArray<T>(endpoint: string, schema: { parse: (data: unknown) => T }): Promise<T[]> {
    const response = await fetch(`${STRAVA_API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        throw new Error("Strava rate limit exceeded. Please try again later.");
      }
      throw new Error(`Strava API request failed (${status})`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Expected array response from Strava API");
    }

    return data.map((item) => schema.parse(item));
  }

  async getAthlete(): Promise<StravaAthlete> {
    return this.fetch("/athlete", StravaAthleteSchema);
  }

  async getGear(gearId: string): Promise<StravaGear> {
    return this.fetch(`/gear/${gearId}`, StravaGearSchema);
  }

  async getActivities(options: {
    after?: number; // Unix timestamp
    before?: number;
    page?: number;
    per_page?: number;
  } = {}): Promise<StravaActivity[]> {
    const params = new URLSearchParams();

    if (options.after) params.set("after", options.after.toString());
    if (options.before) params.set("before", options.before.toString());
    if (options.page) params.set("page", options.page.toString());
    if (options.per_page) params.set("per_page", options.per_page.toString());

    const queryString = params.toString();
    const endpoint = `/athlete/activities${queryString ? `?${queryString}` : ""}`;

    return this.fetchArray(endpoint, StravaActivitySchema);
  }

  async getAllActivitiesSince(afterDate: Date, maxPages = 10): Promise<StravaActivity[]> {
    const allActivities: StravaActivity[] = [];
    const after = Math.floor(afterDate.getTime() / 1000);

    for (let page = 1; page <= maxPages; page++) {
      const activities = await this.getActivities({
        after,
        page,
        per_page: 100,
      });

      if (activities.length === 0) break;

      allActivities.push(...activities);

      if (activities.length < 100) break;
    }

    return allActivities;
  }
}
