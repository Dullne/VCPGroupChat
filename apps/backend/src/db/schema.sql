PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS group_profiles (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  mode TEXT NOT NULL DEFAULT 'sequential',
  invite_prompt TEXT DEFAULT '',
  mode_options_json TEXT NOT NULL DEFAULT '{}',
  group_prompt TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  role_name TEXT DEFAULT '',
  role_order INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (team_id, role_id)
);

CREATE TABLE IF NOT EXISTS group_profile_members (
  profile_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  role_name TEXT DEFAULT '',
  role_order INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (profile_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_templates (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  external_id TEXT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  template_content TEXT DEFAULT '',
  defaults_json TEXT NOT NULL DEFAULT '{}',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS persons (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  source_template_id TEXT,
  legacy_role_id TEXT,
  identity_kind TEXT NOT NULL DEFAULT 'person',
  description TEXT DEFAULT '',
  personality TEXT DEFAULT '',
  emotional_style TEXT DEFAULT '',
  voice_style TEXT DEFAULT '',
  relationship_profile_json TEXT NOT NULL DEFAULT '{}',
  memory_json TEXT NOT NULL DEFAULT '{}',
  model_preferences_json TEXT NOT NULL DEFAULT '{}',
  lifecycle_status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS team_person_members (
  team_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  person_name TEXT DEFAULT '',
  member_order INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  legacy_role_id TEXT,
  PRIMARY KEY (team_id, person_id)
);

CREATE TABLE IF NOT EXISTS group_person_members (
  profile_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  person_name TEXT DEFAULT '',
  group_alias TEXT DEFAULT '',
  member_order INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  speaking_policy_json TEXT NOT NULL DEFAULT '{}',
  legacy_role_id TEXT,
  PRIMARY KEY (profile_id, person_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  speaker_id TEXT,
  speaker_name TEXT,
  speaker_person_id TEXT,
  speaker_membership_id TEXT,
  content_text TEXT,
  content_json TEXT NOT NULL,
  round_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ephemeral_roles (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  role_spec_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  promoted_core_role_id TEXT
);

CREATE TABLE IF NOT EXISTS session_reflections (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_message_count INTEGER NOT NULL DEFAULT 0,
  candidate_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memory_candidates (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  reflection_id TEXT,
  scope TEXT NOT NULL DEFAULT 'shared',
  target_role_id TEXT,
  target_role_name TEXT,
  target_person_id TEXT,
  target_membership_id TEXT,
  memory_owner_type TEXT NOT NULL DEFAULT 'legacy_role',
  memory_owner_id TEXT,
  notebook TEXT NOT NULL DEFAULT '公共',
  content TEXT NOT NULL,
  reason TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  confirmed_at TEXT,
  confirmed_by TEXT,
  core_write_status TEXT NOT NULL DEFAULT 'not_wired',
  core_write_result_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS round_syntheses (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  round_index INTEGER NOT NULL,
  conversation_policy TEXT NOT NULL DEFAULT 'casual',
  consensus_state TEXT NOT NULL DEFAULT 'exploration_only',
  source_message_ids_json TEXT NOT NULL DEFAULT '[]',
  participant_states_json TEXT NOT NULL DEFAULT '[]',
  memory_deposition_json TEXT NOT NULL DEFAULT '{}',
  project_assets_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(session_id, round_index)
);

CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_messages_session_created ON session_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_persons_legacy_role_id ON persons(legacy_role_id);
CREATE INDEX IF NOT EXISTS idx_persons_source_template_id ON persons(source_template_id);
CREATE INDEX IF NOT EXISTS idx_team_person_members_team_id ON team_person_members(team_id);
CREATE INDEX IF NOT EXISTS idx_group_person_members_profile_id ON group_person_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_session_reflections_session_created ON session_reflections(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_candidates_session_status ON memory_candidates(session_id, status);
CREATE INDEX IF NOT EXISTS idx_round_syntheses_session_round ON round_syntheses(session_id, round_index);
