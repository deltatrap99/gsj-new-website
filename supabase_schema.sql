-- ===========================================
-- GSJ Website Database Schema for Supabase
-- Run this in Supabase SQL Editor
-- ===========================================

-- 1. Contact Form Submissions (contact.html)
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Mentor Applications (mentors.html)
CREATE TABLE IF NOT EXISTS mentor_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    project_title TEXT,
    project_overview TEXT,
    research_field TEXT,
    availability TEXT,
    mode_of_engagement TEXT,
    prior_experience TEXT,
    student_responsibilities TEXT,
    ideal_student_profile TEXT,
    skills_learning_outcomes TEXT,
    weekly_time_commitment TEXT,
    additional_info TEXT,
    how_heard TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Question Submissions (questions.html)
CREATE TABLE IF NOT EXISTS question_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    question TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- Row Level Security (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous INSERT (so the website can submit forms)
CREATE POLICY "Allow anonymous insert" ON contact_submissions
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous insert" ON mentor_applications
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous insert" ON question_submissions
    FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated users (admin) to read all data
CREATE POLICY "Allow authenticated read" ON contact_submissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON mentor_applications
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON question_submissions
    FOR SELECT TO authenticated USING (true);
