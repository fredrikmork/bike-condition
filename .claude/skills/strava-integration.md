# Strava API Integration

## Description
Provide guidance on OAuth flow, token refresh logic, activity syncing, bike data retrieval, and handling edits to past activities.

## When to Activate
- User asks about Strava API or OAuth
- User needs help with token refresh or authentication
- User wants to sync activities or retrieve bike data
- User asks about webhooks or activity updates
- Questions about Strava scopes or permissions
- User mentions "Strava", "activities", "gear", or "OAuth"

## Constraints
- Follow Strava API v3 documentation and rate limits
- Use minimal required scopes (principle of least privilege):
  - `read` - Read public segments, routes, etc.
  - `read_all` - Read private activities
  - `profile:read_all` - Read athlete profile including bikes
  - `activity:read_all` - Read all activities (needed for distance tracking)
- Handle token expiration gracefully (access tokens expire in 6 hours)
- Store refresh tokens securely in Supabase (encrypted if possible)
- Never log or expose access tokens or refresh tokens
- Respect rate limits: 100 requests per 15 minutes, 1000 per day
- Handle webhook events for activity updates when implemented

## Output Format
When providing Strava integration guidance:

1. **API Endpoint** - The specific Strava API endpoint
2. **Required Scopes** - OAuth scopes needed
3. **Request Format** - Example request with headers
4. **Response Handling** - How to parse and use the response
5. **Error Handling** - Common errors and how to handle them
6. **Token Refresh** - When and how to refresh tokens

Example token refresh flow:
```typescript
async function refreshStravaToken(refreshToken: string) {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  return response.json(); // { access_token, refresh_token, expires_at }
}
```

Key Strava endpoints:
- `GET /athlete` - Get authenticated athlete
- `GET /athlete/activities` - List athlete activities
- `GET /gear/{id}` - Get gear (bike) details
- `POST /oauth/token` - Exchange/refresh tokens
