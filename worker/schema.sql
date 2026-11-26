-- SYAM Academy database (Cloudflare D1: syam-course)
CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, name TEXT, created_at INTEGER NOT NULL, last_seen INTEGER NOT NULL, role TEXT DEFAULT 'learner');
-- Existing databases: ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'learner';
CREATE TABLE IF NOT EXISTS progress (email TEXT PRIMARY KEY REFERENCES users(email), data TEXT NOT NULL, updated_at INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS tracks (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT DEFAULT '', color TEXT DEFAULT '#2f86ce', sort INTEGER DEFAULT 0, created_at INTEGER, updated_at INTEGER);
CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY, track_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT '', provider TEXT DEFAULT 'other', url TEXT DEFAULT '', level TEXT DEFAULT '', published INTEGER DEFAULT 1, sort INTEGER DEFAULT 0, created_at INTEGER, updated_at INTEGER);
CREATE TABLE IF NOT EXISTS modules (id TEXT PRIMARY KEY, course_id TEXT NOT NULL, title TEXT NOT NULL, sort INTEGER DEFAULT 0, created_at INTEGER, updated_at INTEGER);
CREATE TABLE IF NOT EXISTS lessons (id TEXT PRIMARY KEY, module_id TEXT NOT NULL, title TEXT NOT NULL, type TEXT DEFAULT 'video', url TEXT DEFAULT '', minutes INTEGER DEFAULT 0, body TEXT DEFAULT '', links TEXT DEFAULT '[]', published INTEGER DEFAULT 1, sort INTEGER DEFAULT 0, created_at INTEGER, updated_at INTEGER);
CREATE TABLE IF NOT EXISTS user_lessons (email TEXT NOT NULL, lesson_id TEXT NOT NULL, done INTEGER DEFAULT 0, done_at INTEGER, note TEXT DEFAULT '', saved INTEGER DEFAULT 0, position INTEGER DEFAULT 0, updated_at INTEGER, PRIMARY KEY (email, lesson_id));

CREATE INDEX IF NOT EXISTS idx_courses_track ON courses(track_id, sort);
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id, sort);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id, sort);
CREATE INDEX IF NOT EXISTS idx_user_lessons_lesson ON user_lessons(lesson_id);
