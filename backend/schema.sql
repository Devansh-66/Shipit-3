DROP TABLE IF EXISTS audits;
CREATE TABLE audits (
  id TEXT PRIMARY KEY,
  file_name TEXT,
  file_type TEXT, 
  audit_score INTEGER,
  audit_json TEXT, -- The full JSON report from the AI
  created_at INTEGER
);

DROP TABLE IF EXISTS feedback_history;
CREATE TABLE feedback_history (
  id TEXT PRIMARY KEY,
  original_audit_id TEXT,
  improved_audit_id TEXT,
  improvement_score INTEGER,
  notes TEXT,
  created_at INTEGER
);
