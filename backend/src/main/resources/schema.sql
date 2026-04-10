CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments (course_id);

CREATE INDEX IF NOT EXISTS idx_files_course_id ON files (course_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files (uploaded_by);

CREATE INDEX IF NOT EXISTS idx_ratings_file_id ON ratings (file_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_active_lookup ON auth_sessions (session_id, revoked_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_active_users ON auth_sessions (revoked_at, expires_at, user_id);

CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users ((lower(email)));
CREATE INDEX IF NOT EXISTS idx_courses_name_lower ON courses ((lower(name)));
CREATE INDEX IF NOT EXISTS idx_courses_code_lower ON courses ((lower(course_code)));
