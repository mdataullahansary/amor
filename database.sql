-- Amor Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Relationships Table
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active'
);

-- Users Table (extends Supabase Auth users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    relationship_id UUID REFERENCES relationships(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE
);

-- Messages (Realtime Chat)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    message_type VARCHAR(50) DEFAULT 'text', -- text, image, voice
    media_url TEXT,
    reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Reactions
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Diary Entries
CREATE TABLE diary_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    mood VARCHAR(50), -- Happy, Love, Sad, Sick, Missing You, Special Day
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diary Media
CREATE TABLE diary_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(50) NOT NULL, -- image, voice
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movie Sessions
CREATE TABLE movie_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_title VARCHAR(255) NOT NULL,
    video_url TEXT,
    session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_minutes INTEGER,
    messages_count INTEGER DEFAULT 0,
    reactions_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'planned' -- planned, active, completed
);

-- Gallery Items
CREATE TABLE gallery_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(50) NOT NULL, -- image, video
    caption TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    item_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice Memories
CREATE TABLE voice_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    audio_url TEXT NOT NULL,
    duration_seconds INTEGER,
    category VARCHAR(100), -- Good morning, Birthday, Random
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar Events
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type VARCHAR(50), -- Birthday, Anniversary, Exam, Appointment, Movie Night
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time Capsules
CREATE TABLE time_capsules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    message TEXT,
    media_url TEXT,
    media_type VARCHAR(50),
    unlock_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_opened BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Users can only see themselves and their partner (users in the same relationship)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their partner" 
ON users FOR SELECT 
USING (auth.uid() = id OR relationship_id IN (SELECT relationship_id FROM users WHERE id = auth.uid()));

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can update their own profile" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- Base policy template for relationship-bound tables
-- Function to get user's relationship_id
CREATE OR REPLACE FUNCTION get_user_relationship_id()
RETURNS UUID AS $$
  SELECT relationship_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Messages RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their relationship" 
ON messages FOR SELECT USING (relationship_id = get_user_relationship_id());
CREATE POLICY "Users can insert messages in their relationship" 
ON messages FOR INSERT WITH CHECK (relationship_id = get_user_relationship_id() AND sender_id = auth.uid());
CREATE POLICY "Users can update their own messages" 
ON messages FOR UPDATE USING (sender_id = auth.uid());

-- Diary Entries RLS
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view diary entries in their relationship" 
ON diary_entries FOR SELECT USING (relationship_id = get_user_relationship_id());
CREATE POLICY "Users can insert diary entries in their relationship" 
ON diary_entries FOR INSERT WITH CHECK (relationship_id = get_user_relationship_id() AND author_id = auth.uid());
CREATE POLICY "Users can update their own diary entries" 
ON diary_entries FOR UPDATE USING (author_id = auth.uid());

-- Follow similar RLS for other tables (movie_sessions, gallery_items, voice_memories, calendar_events, time_capsules)
ALTER TABLE movie_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Relationship view" ON movie_sessions FOR SELECT USING (relationship_id = get_user_relationship_id());
CREATE POLICY "Relationship insert" ON movie_sessions FOR INSERT WITH CHECK (relationship_id = get_user_relationship_id());

ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Relationship view" ON gallery_items FOR SELECT USING (relationship_id = get_user_relationship_id());
CREATE POLICY "Relationship insert" ON gallery_items FOR INSERT WITH CHECK (relationship_id = get_user_relationship_id());
CREATE POLICY "Relationship update" ON gallery_items FOR UPDATE USING (relationship_id = get_user_relationship_id());

ALTER TABLE voice_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Relationship view" ON voice_memories FOR SELECT USING (relationship_id = get_user_relationship_id());
CREATE POLICY "Relationship insert" ON voice_memories FOR INSERT WITH CHECK (relationship_id = get_user_relationship_id());

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Relationship view" ON calendar_events FOR SELECT USING (relationship_id = get_user_relationship_id());
CREATE POLICY "Relationship insert" ON calendar_events FOR INSERT WITH CHECK (relationship_id = get_user_relationship_id());
CREATE POLICY "Relationship update" ON calendar_events FOR UPDATE USING (relationship_id = get_user_relationship_id());

ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Relationship view" ON time_capsules FOR SELECT USING (relationship_id = get_user_relationship_id());
CREATE POLICY "Relationship insert" ON time_capsules FOR INSERT WITH CHECK (relationship_id = get_user_relationship_id());

-- Enable Realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE movie_sessions;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_messages_modtime BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diary_entries_modtime BEFORE UPDATE ON diary_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
