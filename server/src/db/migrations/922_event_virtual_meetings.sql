CREATE TABLE IF NOT EXISTS event_virtual_meetings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  provider          VARCHAR(50) NOT NULL,
  meeting_id        VARCHAR(255),
  calendar_event_id VARCHAR(255),
  conference_id     VARCHAR(255),
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, provider)
);
