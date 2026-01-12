-- QualitySync Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('PM', 'QA', 'ENG');
CREATE TYPE test_status AS ENUM ('pending', 'pass', 'fail', 'escalated');
CREATE TYPE bug_status AS ENUM ('open', 'in_progress', 'resolved', 'closed', 'converted_to_test');
CREATE TYPE bug_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'QA',
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMPTZ,
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test cases table
CREATE TABLE test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_platform VARCHAR(255) NOT NULL,
    test_case TEXT NOT NULL,
    expected_result TEXT NOT NULL,
    status test_status DEFAULT 'pending',
    evidence_url TEXT,
    notes TEXT,
    assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    source_bug_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unlisted bugs table
CREATE TABLE unlisted_bugs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_platform VARCHAR(255) NOT NULL,
    jam_link TEXT NOT NULL,
    description TEXT NOT NULL,
    note TEXT,
    severity bug_severity DEFAULT 'medium',
    status bug_status DEFAULT 'open',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    converted_to_test_id UUID REFERENCES test_cases(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for source_bug_id after unlisted_bugs table is created
ALTER TABLE test_cases
ADD CONSTRAINT fk_source_bug
FOREIGN KEY (source_bug_id) REFERENCES unlisted_bugs(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_users_reset_token ON users(reset_password_token);

CREATE INDEX idx_test_cases_status ON test_cases(status);
CREATE INDEX idx_test_cases_assigned_to ON test_cases(assigned_to);
CREATE INDEX idx_test_cases_created_by ON test_cases(created_by);
CREATE INDEX idx_test_cases_created_at ON test_cases(created_at DESC);

CREATE INDEX idx_unlisted_bugs_status ON unlisted_bugs(status);
CREATE INDEX idx_unlisted_bugs_created_by ON unlisted_bugs(created_by);
CREATE INDEX idx_unlisted_bugs_severity ON unlisted_bugs(severity);
CREATE INDEX idx_unlisted_bugs_created_at ON unlisted_bugs(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_cases_updated_at
    BEFORE UPDATE ON test_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unlisted_bugs_updated_at
    BEFORE UPDATE ON unlisted_bugs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlisted_bugs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Service role can do everything
CREATE POLICY "Service role full access on users" ON users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policies for test_cases
CREATE POLICY "Service role full access on test_cases" ON test_cases
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policies for unlisted_bugs
CREATE POLICY "Service role full access on unlisted_bugs" ON unlisted_bugs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create view for dashboard statistics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM test_cases) as total_tests,
    (SELECT COUNT(*) FROM test_cases WHERE status = 'pass') as passed_tests,
    (SELECT COUNT(*) FROM test_cases WHERE status = 'fail') as failed_tests,
    (SELECT COUNT(*) FROM test_cases WHERE status = 'pending') as pending_tests,
    (SELECT COUNT(*) FROM test_cases WHERE status = 'escalated') as escalated_tests,
    (SELECT COUNT(*) FROM unlisted_bugs WHERE status = 'open') as open_bugs,
    (SELECT COUNT(*) FROM unlisted_bugs) as total_bugs;

-- Grant access to the view
GRANT SELECT ON dashboard_stats TO anon, authenticated, service_role;
