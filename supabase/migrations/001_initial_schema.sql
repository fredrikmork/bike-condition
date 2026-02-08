-- Bike Condition MVP Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strava_id BIGINT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (id = auth.uid());

-- ============================================
-- USER_TOKENS TABLE (No RLS - server-side only)
-- ============================================
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- No RLS on user_tokens - only accessed via service role

-- ============================================
-- BIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bikes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strava_gear_id TEXT NOT NULL,
  name TEXT NOT NULL,
  brand_name TEXT,
  model_name TEXT,
  frame_type INTEGER,
  description TEXT,
  total_distance INTEGER DEFAULT 0, -- in meters
  is_primary BOOLEAN DEFAULT FALSE,
  retired BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, strava_gear_id)
);

-- RLS for bikes
ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bikes" ON bikes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own bikes" ON bikes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bikes" ON bikes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own bikes" ON bikes
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- COMPONENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bike_id UUID NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- chain, cassette, tire_front, tire_rear, brake_pads, bar_tape, etc.
  recommended_distance INTEGER NOT NULL, -- in meters
  current_distance INTEGER DEFAULT 0, -- in meters
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  replaced_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for components (via bike ownership)
ALTER TABLE components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own components" ON components
  FOR SELECT USING (
    bike_id IN (SELECT id FROM bikes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own components" ON components
  FOR INSERT WITH CHECK (
    bike_id IN (SELECT id FROM bikes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own components" ON components
  FOR UPDATE USING (
    bike_id IN (SELECT id FROM bikes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own components" ON components
  FOR DELETE USING (
    bike_id IN (SELECT id FROM bikes WHERE user_id = auth.uid())
  );

-- ============================================
-- ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bike_id UUID REFERENCES bikes(id) ON DELETE SET NULL,
  strava_activity_id BIGINT UNIQUE NOT NULL,
  name TEXT,
  distance INTEGER NOT NULL, -- in meters
  moving_time INTEGER, -- in seconds
  start_date TIMESTAMPTZ NOT NULL,
  activity_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, strava_activity_id)
);

-- RLS for activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities" ON activities
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- SYNC_STATUS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sync_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_activity_sync TIMESTAMPTZ,
  last_bike_sync TIMESTAMPTZ,
  last_sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for sync_status
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync status" ON sync_status
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own sync status" ON sync_status
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_strava_id ON users(strava_id);
CREATE INDEX IF NOT EXISTS idx_bikes_user_id ON bikes(user_id);
CREATE INDEX IF NOT EXISTS idx_bikes_strava_gear_id ON bikes(strava_gear_id);
CREATE INDEX IF NOT EXISTS idx_components_bike_id ON components(bike_id);
CREATE INDEX IF NOT EXISTS idx_components_type ON components(type);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_bike_id ON activities(bike_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON activities(start_date);
CREATE INDEX IF NOT EXISTS idx_activities_strava_id ON activities(strava_activity_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tokens_updated_at
  BEFORE UPDATE ON user_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bikes_updated_at
  BEFORE UPDATE ON bikes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_components_updated_at
  BEFORE UPDATE ON components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_status_updated_at
  BEFORE UPDATE ON sync_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
