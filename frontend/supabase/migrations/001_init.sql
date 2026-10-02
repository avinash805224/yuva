-- ============================================================================
-- EcoPulse 360 — Supabase Database Schema
-- Run this ONCE in your Supabase SQL Editor (supabase.com → SQL Editor → New Query)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. AUTH PROFILES (extends Supabase Auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'operator', 'viewer')),
  building_id TEXT DEFAULT 'schneider-tower-blr',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. ZONES (building zones configuration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area_m2 REAL NOT NULL,
  max_occupancy INT NOT NULL,
  base_plug_kw REAL DEFAULT 0,
  base_light_kw REAL DEFAULT 0,
  floor INT DEFAULT 1,
  building_id TEXT DEFAULT 'schneider-tower-blr',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default zones
INSERT INTO zones (id, name, area_m2, max_occupancy, base_plug_kw, base_light_kw) VALUES
  ('workstations', 'Open Workstations', 800, 120, 18, 6.5),
  ('boardroom', 'Executive Boardroom', 120, 20, 3.2, 1.8),
  ('cafeteria', 'Cafeteria & Atrium', 300, 80, 8.0, 4.2),
  ('server_room', 'Server / IT Room', 60, 4, 42, 0.8)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. TELEMETRY (time-series sensor readings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS telemetry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id TEXT NOT NULL REFERENCES zones(id),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  temperature REAL,
  humidity REAL,
  co2 REAL,
  pm25 REAL,
  lux REAL,
  occupancy INT,
  hvac_power REAL,
  lighting_power REAL,
  plug_power REAL,
  setpoint REAL,
  pmv REAL,
  ppd REAL,
  ieq_score REAL
);

-- Index for fast time-range queries
CREATE INDEX IF NOT EXISTS idx_telemetry_zone_time ON telemetry (zone_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_time ON telemetry (timestamp DESC);

-- ============================================================================
-- 4. BUILDING OVERVIEW SNAPSHOTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS building_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_power REAL,
  today_energy REAL,
  today_cost REAL,
  carbon_rate REAL,
  bee_star_rating INT,
  epi REAL,
  hvac_total REAL,
  lighting_total REAL,
  plug_total REAL,
  solar_pv REAL,
  grid_import REAL,
  battery_soc REAL,
  building_score INT
);

CREATE INDEX IF NOT EXISTS idx_snapshots_time ON building_snapshots (timestamp DESC);

-- ============================================================================
-- 5. OCCUPANT VOTES
-- ============================================================================
CREATE TABLE IF NOT EXISTS occupant_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id TEXT NOT NULL REFERENCES zones(id),
  vote TEXT NOT NULL CHECK (vote IN ('too_cold', 'comfortable', 'too_warm')),
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_votes_zone_time ON occupant_votes (zone_id, timestamp DESC);

-- ============================================================================
-- 6. ALERTS (FDD + Anomaly)
-- ============================================================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT now(),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  type TEXT NOT NULL CHECK (type IN ('fdd', 'anomaly', 'equipment', 'comfort', 'peak', 'ai')),
  equipment TEXT,
  title TEXT NOT NULL,
  description TEXT,
  energy_bleed REAL DEFAULT 0,
  cost_bleed REAL DEFAULT 0,
  zone_id TEXT REFERENCES zones(id),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_alerts_time ON alerts (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts (severity, acknowledged);

-- ============================================================================
-- 7. AI RECOMMENDATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  impact TEXT CHECK (impact IN ('high', 'medium', 'low')),
  urgency TEXT CHECK (urgency IN ('immediate', 'today', 'this_week')),
  category TEXT,
  saving_kwh REAL DEFAULT 0,
  saving_cost REAL DEFAULT 0,
  saving_co2 REAL DEFAULT 0,
  applied BOOLEAN DEFAULT false,
  applied_by UUID REFERENCES auth.users(id),
  applied_at TIMESTAMPTZ
);

-- ============================================================================
-- 8. EQUIPMENT HEALTH
-- ============================================================================
CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  health_score REAL DEFAULT 100,
  status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy', 'attention', 'warning', 'critical')),
  current_power REAL,
  expected_power REAL,
  predicted_issue TEXT,
  recommendation TEXT,
  days_to_action INT DEFAULT 90,
  last_inspection DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default equipment
INSERT INTO equipment (id, name, type, health_score, status, current_power, expected_power, predicted_issue, recommendation, days_to_action) VALUES
  ('ahu-01', 'AHU-01 (Workstations)', 'ahu', 88, 'healthy', 12.4, 11.8, 'None detected', 'Continue regular maintenance.', 45),
  ('ahu-02', 'AHU-02 (Boardroom)', 'ahu', 74, 'attention', 5.8, 4.9, 'Fan belt wear detected.', 'Schedule belt inspection within 14 days.', 14),
  ('ahu-03', 'AHU-03 (Cafeteria)', 'ahu', 68, 'warning', 14.8, 11.9, 'Possible filter clogging.', 'Schedule inspection within 7 days.', 7),
  ('chiller-01', 'Chiller Plant (Central)', 'chiller', 91, 'healthy', 38, 36, 'None detected.', 'Condenser water treatment on schedule.', 60),
  ('pump-chw', 'CHW Pump (Primary)', 'pump', 82, 'healthy', 4.2, 4.0, 'Minor seal wear.', 'Monitor for 30 days.', 30),
  ('vrf-server', 'VRF Unit (Server Room)', 'vrf', 85, 'healthy', 8.5, 8.0, 'Refrigerant charge low.', 'Check at next maintenance.', 21),
  ('light-ctrl', 'Lighting Control Panel', 'lighting', 94, 'healthy', 13.5, 13.0, 'None detected.', 'All circuits normal.', 90),
  ('ups-server', 'UPS & Server Rack', 'server', 56, 'critical', 42, 38, 'Battery capacity degradation 72%.', 'Replace UPS battery within 5 days.', 5)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. ENERGY FORECASTS (stored predictions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS energy_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generated_at TIMESTAMPTZ DEFAULT now(),
  forecast_date DATE NOT NULL,
  hour INT NOT NULL CHECK (hour >= 0 AND hour <= 23),
  predicted_kw REAL,
  optimized_kw REAL,
  actual_kw REAL,
  peak_threshold REAL DEFAULT 130
);

CREATE INDEX IF NOT EXISTS idx_forecasts_date ON energy_forecasts (forecast_date, hour);

-- ============================================================================
-- 10. HVAC MODES (user-controlled per zone)
-- ============================================================================
CREATE TABLE IF NOT EXISTS hvac_modes (
  zone_id TEXT PRIMARY KEY REFERENCES zones(id),
  mode TEXT NOT NULL DEFAULT 'auto' CHECK (mode IN ('auto', 'comfort', 'energy_saver', 'peak_reduction')),
  set_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed defaults
INSERT INTO hvac_modes (zone_id, mode) VALUES
  ('workstations', 'auto'), ('boardroom', 'auto'), ('cafeteria', 'auto'), ('server_room', 'auto')
ON CONFLICT (zone_id) DO NOTHING;

-- ============================================================================
-- 11. DEMAND RESPONSE EVENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS dr_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'pre_cooling', 'peak_active', 'recovery')),
  triggered_at TIMESTAMPTZ DEFAULT now(),
  triggered_by UUID REFERENCES auth.users(id),
  target_grid_draw REAL DEFAULT 60,
  curtailment_kw REAL DEFAULT 0,
  savings_rupees REAL DEFAULT 0,
  ended_at TIMESTAMPTZ,
  notes TEXT
);

-- ============================================================================
-- 12. AUDIT LOG (track all actions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log (timestamp DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupant_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hvac_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dr_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, edit own
CREATE POLICY "Profiles readable by all authenticated" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Telemetry: authenticated users can read, service can write
CREATE POLICY "Telemetry readable by authenticated" ON telemetry FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Telemetry insertable by authenticated" ON telemetry FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Building snapshots: readable by all authenticated
CREATE POLICY "Snapshots readable" ON building_snapshots FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Snapshots insertable" ON building_snapshots FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Votes: anyone authenticated can vote and see votes
CREATE POLICY "Votes readable" ON occupant_votes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Votes insertable" ON occupant_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Alerts: readable by all, writable by authenticated
CREATE POLICY "Alerts readable" ON alerts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Alerts insertable" ON alerts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Alerts updatable" ON alerts FOR UPDATE USING (auth.role() = 'authenticated');

-- Recommendations: readable, writable by authenticated
CREATE POLICY "Recs readable" ON recommendations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Recs insertable" ON recommendations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Recs updatable" ON recommendations FOR UPDATE USING (auth.role() = 'authenticated');

-- Equipment: readable by all, updatable by authenticated
CREATE POLICY "Equipment readable" ON equipment FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Equipment updatable" ON equipment FOR UPDATE USING (auth.role() = 'authenticated');

-- Forecasts: readable
CREATE POLICY "Forecasts readable" ON energy_forecasts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Forecasts insertable" ON energy_forecasts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- HVAC modes: readable, updatable
CREATE POLICY "HVAC readable" ON hvac_modes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "HVAC updatable" ON hvac_modes FOR UPDATE USING (auth.role() = 'authenticated');

-- DR Events: readable, insertable
CREATE POLICY "DR readable" ON dr_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "DR insertable" ON dr_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "DR updatable" ON dr_events FOR UPDATE USING (auth.role() = 'authenticated');

-- Audit log: only admins can read
CREATE POLICY "Audit readable by admins" ON audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Audit insertable" ON audit_log FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Zones: readable by all authenticated
CREATE POLICY "Zones readable" ON zones FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- REALTIME: Enable realtime for key tables
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE telemetry;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE occupant_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE building_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE hvac_modes;
ALTER PUBLICATION supabase_realtime ADD TABLE dr_events;

-- ============================================================================
-- DONE! Your EcoPulse 360 database is ready.
-- ============================================================================
