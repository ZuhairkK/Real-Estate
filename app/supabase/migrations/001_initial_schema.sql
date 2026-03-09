-- UP: Initial schema for Activus AI

-- Agents table (core user record)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  slug TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  brokerage TEXT,
  years_active INTEGER,
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-generate slug from name on insert
CREATE OR REPLACE FUNCTION generate_agent_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL AND NEW.name IS NOT NULL THEN
    NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'))
                || '-' || substr(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_agent_slug
  BEFORE INSERT ON agents
  FOR EACH ROW
  EXECUTE FUNCTION generate_agent_slug();

-- Raw signals table (private — calendar events, email metadata)
CREATE TABLE raw_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('google_calendar', 'gmail')),
  external_id TEXT, -- Google event/thread ID for dedup
  signal_data JSONB NOT NULL, -- raw event metadata
  signal_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, source, external_id)
);

CREATE INDEX idx_raw_signals_agent ON raw_signals(agent_id);
CREATE INDEX idx_raw_signals_timestamp ON raw_signals(signal_timestamp);

-- Classified activities (output of AI classification)
CREATE TABLE classified_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'buyer_consultation',
    'listing_presentation',
    'open_house',
    'property_tour',
    'market_evaluation',
    'contract_review',
    'training_mentorship',
    'client_meeting',
    'listing_preparation',
    'other'
  )),
  confidence_score REAL NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  activity_date DATE NOT NULL,
  source_signal_ids UUID[] DEFAULT '{}', -- references to raw_signals used
  agent_confirmed BOOLEAN, -- null = not reviewed, true = confirmed, false = dismissed
  metadata JSONB DEFAULT '{}', -- non-sensitive summary info
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activities_agent ON classified_activities(agent_id);
CREATE INDEX idx_activities_date ON classified_activities(activity_date);
CREATE INDEX idx_activities_type ON classified_activities(activity_type);

-- RLS Policies
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE classified_activities ENABLE ROW LEVEL SECURITY;

-- Agents can read their own record (via service role for now, cookie-based auth)
-- Public can read limited agent info via slug
CREATE POLICY "Public can view agent profiles"
  ON agents FOR SELECT
  USING (true);

-- Raw signals: only accessible via service role (no direct client access)
CREATE POLICY "No direct access to raw signals"
  ON raw_signals FOR ALL
  USING (false);

-- Classified activities: public can read confirmed activities
CREATE POLICY "Public can view confirmed activities"
  ON classified_activities FOR SELECT
  USING (agent_confirmed IS NOT FALSE AND confidence_score >= 0.5);

-- DOWN:
-- DROP TABLE classified_activities;
-- DROP TABLE raw_signals;
-- DROP TABLE agents;
-- DROP FUNCTION generate_agent_slug();
