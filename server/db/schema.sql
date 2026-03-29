-- Community Supplies - Consolidated Schema
-- For Railway PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('member', 'steward');
CREATE TYPE join_request_status AS ENUM ('pending', 'vouched', 'rejected');

-- Profiles (users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  signal_contact TEXT,
  role user_role NOT NULL DEFAULT 'member',
  vouched_at TIMESTAMPTZ,
  vouched_by UUID REFERENCES profiles(id),
  intro_text TEXT,
  zip_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supplies
CREATE TABLE supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  condition TEXT NOT NULL DEFAULT 'good',
  contact_email TEXT,
  cross_streets TEXT,
  date_available TEXT,
  house_rules TEXT[],
  illustration_url TEXT,
  image_url TEXT,
  images TEXT[],
  lender_notes TEXT,
  lent_out BOOLEAN DEFAULT false,
  location TEXT,
  neighborhood TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  party_types TEXT[],
  zip_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Books
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  genre TEXT,
  condition TEXT NOT NULL DEFAULT 'good',
  house_rules TEXT[],
  lender_notes TEXT,
  lent_out BOOLEAN DEFAULT false,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Join requests
CREATE TABLE join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT,
  intro TEXT,
  connection_context TEXT,
  cross_streets TEXT,
  phone_number TEXT,
  referral_source TEXT,
  status join_request_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  voucher_id UUID REFERENCES profiles(id)
);

-- Supply requests (contact messages)
CREATE TABLE supply_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id UUID NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
  supply_name TEXT NOT NULL,
  supply_owner_id UUID NOT NULL REFERENCES profiles(id),
  sender_name TEXT NOT NULL,
  sender_contact TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Community steward requests (start-a-community)
CREATE TABLE community_steward_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  co_stewards JSONB,
  reason TEXT NOT NULL,
  questions TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Site config (key-value store)
CREATE TABLE site_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_supplies_owner ON supplies(owner_id);
CREATE INDEX idx_supplies_category ON supplies(category);
CREATE INDEX idx_books_owner ON books(owner_id);
CREATE INDEX idx_join_requests_status ON join_requests(status);
CREATE INDEX idx_profiles_username ON profiles(username);
