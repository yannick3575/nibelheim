-- Nibelheim Database Schema
-- Run this in Supabase SQL Editor (Database > SQL Editor)

-- ============================================
-- CORE TABLES
-- ============================================

-- Profil utilisateur (extend Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuration des modules par utilisateur
CREATE TABLE IF NOT EXISTS user_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Table générique pour les données des modules
CREATE TABLE IF NOT EXISTS module_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  data_type TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TECH WATCH MODULE TABLES
-- ============================================

-- Extension pgvector pour embeddings (si disponible)
CREATE EXTENSION IF NOT EXISTS vector;

-- Articles collectés
CREATE TABLE IF NOT EXISTS tech_watch_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  embedding vector(1536),  -- OpenAI ada-002 dimension
  relevance_score FLOAT,
  tags TEXT[],
  published_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT false,
  UNIQUE(user_id, url)
);

-- Index pour recherche vectorielle
CREATE INDEX IF NOT EXISTS tech_watch_articles_embedding_idx 
  ON tech_watch_articles 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Résumés/Digests générés
CREATE TABLE IF NOT EXISTS tech_watch_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  summary TEXT NOT NULL,
  key_topics TEXT[],
  article_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sources configurées par l'utilisateur
CREATE TABLE IF NOT EXISTS tech_watch_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'rss', 'api', 'manual'
  name TEXT NOT NULL,
  url TEXT,
  config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_watch_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_watch_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_watch_sources ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User modules policies
CREATE POLICY "Users can manage own modules" ON user_modules
  FOR ALL USING (auth.uid() = user_id);

-- Module data policies
CREATE POLICY "Users can manage own module data" ON module_data
  FOR ALL USING (auth.uid() = user_id);

-- Tech Watch policies
CREATE POLICY "Users manage own articles" ON tech_watch_articles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own digests" ON tech_watch_digests
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own sources" ON tech_watch_sources
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_data_updated_at
  BEFORE UPDATE ON module_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
