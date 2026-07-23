-- SiteDefteri (KomşuCep) Database Schema
-- Run this script in Neon SQL console to initialize the database

CREATE TABLE IF NOT EXISTS apartments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  "flatsCount" INTEGER,
  blocks JSONB,
  "monthlyDues" DECIMAL(10,2) DEFAULT 0,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  "aptId" TEXT NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  "residentType" TEXT,
  block TEXT,
  "flatNo" INTEGER,
  "createdAt" TIMESTAMP NOT NULL,
  "resetToken" VARCHAR(255),
  "resetTokenExpiry" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  "aptId" TEXT NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  "createdAt" TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  "receiptUrl" TEXT,
  "userId" TEXT
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  "aptId" TEXT NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "readBy" JSONB DEFAULT '[]',
  type TEXT,
  duration INTEGER DEFAULT 7
);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  "aptId" TEXT NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  progress JSONB DEFAULT '[]',
  "completedAt" TEXT
);

CREATE TABLE IF NOT EXISTS repairs (
  id TEXT PRIMARY KEY,
  "aptId" TEXT NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  cost DECIMAL(10,2),
  "createdAt" TEXT NOT NULL,
  progress JSONB DEFAULT '[]',
  "resolvedAt" TEXT
);

CREATE TABLE IF NOT EXISTS polls (
  id TEXT PRIMARY KEY,
  "aptId" TEXT NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  votes JSONB,
  "createdBy" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'approved'
);

CREATE TABLE IF NOT EXISTS dues (
  id TEXT PRIMARY KEY,
  "aptId" TEXT NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,
  "paidAt" TEXT,
  "transactionId" TEXT,
  "bulkTransactionId" TEXT
);

-- Unique constraints (run if tables already exist without them)
ALTER TABLE apartments ADD CONSTRAINT IF NOT EXISTS apartments_code_unique UNIQUE (code);
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_email_unique UNIQUE (email);
