-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "prefecture_code" TEXT,
    "age_group" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_prefecture_code_fkey" FOREIGN KEY ("prefecture_code") REFERENCES "prefectures" ("code") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prefectures" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "word_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "words" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "headword" TEXT NOT NULL,
    "reading" TEXT NOT NULL,
    "category_id" INTEGER,
    "mora_count" INTEGER NOT NULL,
    "mora_segments" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "submitted_by" TEXT,
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "words_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "word_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "words_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "words_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "word_aliases" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "word_id" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "word_aliases_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accent_types" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "accent_options" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "word_id" INTEGER NOT NULL,
    "accent_type_id" INTEGER NOT NULL,
    "accent_pattern" TEXT NOT NULL,
    "drop_position" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accent_options_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "accent_options_accent_type_id_fkey" FOREIGN KEY ("accent_type_id") REFERENCES "accent_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fingerprint_hash" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "votes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "word_id" INTEGER NOT NULL,
    "accent_type_id" INTEGER NOT NULL,
    "device_id" TEXT NOT NULL,
    "user_id" TEXT,
    "anonymous_device_id" TEXT,
    "prefecture_code" TEXT,
    "age_group" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "votes_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "votes_accent_type_id_fkey" FOREIGN KEY ("accent_type_id") REFERENCES "accent_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "votes_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "votes_anonymous_device_id_fkey" FOREIGN KEY ("anonymous_device_id") REFERENCES "anonymous_users" ("device_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "votes_prefecture_code_fkey" FOREIGN KEY ("prefecture_code") REFERENCES "prefectures" ("code") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "word_pref_stats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "word_id" INTEGER NOT NULL,
    "prefecture_code" TEXT NOT NULL,
    "accent_type_id" INTEGER NOT NULL,
    "vote_count" INTEGER NOT NULL DEFAULT 0,
    "vote_percentage" DECIMAL NOT NULL DEFAULT 0.00,
    "total_votes_in_pref" INTEGER NOT NULL DEFAULT 0,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "word_pref_stats_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "word_pref_stats_prefecture_code_fkey" FOREIGN KEY ("prefecture_code") REFERENCES "prefectures" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "word_pref_stats_accent_type_id_fkey" FOREIGN KEY ("accent_type_id") REFERENCES "accent_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "word_national_stats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "word_id" INTEGER NOT NULL,
    "accent_type_id" INTEGER NOT NULL,
    "vote_count" INTEGER NOT NULL DEFAULT 0,
    "vote_percentage" DECIMAL NOT NULL DEFAULT 0.00,
    "total_votes" INTEGER NOT NULL DEFAULT 0,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "word_national_stats_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "word_national_stats_accent_type_id_fkey" FOREIGN KEY ("accent_type_id") REFERENCES "accent_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "headword" TEXT NOT NULL,
    "reading" TEXT NOT NULL,
    "category_id" INTEGER,
    "aliases" TEXT,
    "submitted_by" TEXT,
    "initial_accent_type_id" INTEGER,
    "prefecture_code" TEXT,
    "age_group" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "moderator_comment" TEXT,
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "submissions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "word_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "submissions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "submissions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "submissions_initial_accent_type_id_fkey" FOREIGN KEY ("initial_accent_type_id") REFERENCES "accent_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "submissions_prefecture_code_fkey" FOREIGN KEY ("prefecture_code") REFERENCES "prefectures" ("code") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ip_address" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "window_start" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT,
    "device_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" INTEGER,
    "old_data" TEXT,
    "new_data" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "anonymous_users" (
    "device_id" TEXT NOT NULL PRIMARY KEY,
    "age_group" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "prefecture_code" TEXT NOT NULL,
    "registered_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_data" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "anonymous_users_prefecture_code_fkey" FOREIGN KEY ("prefecture_code") REFERENCES "prefectures" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "word_categories_name_key" ON "word_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "words_headword_reading_key" ON "words"("headword", "reading");

-- CreateIndex
CREATE UNIQUE INDEX "accent_types_code_key" ON "accent_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "accent_options_word_id_accent_type_id_key" ON "accent_options"("word_id", "accent_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "devices_fingerprint_hash_key" ON "devices"("fingerprint_hash");

-- CreateIndex
CREATE INDEX "votes_anonymous_device_id_idx" ON "votes"("anonymous_device_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_device_id_word_id_key" ON "votes"("device_id", "word_id");

-- CreateIndex
CREATE UNIQUE INDEX "word_pref_stats_word_id_prefecture_code_accent_type_id_key" ON "word_pref_stats"("word_id", "prefecture_code", "accent_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "word_national_stats_word_id_accent_type_id_key" ON "word_national_stats"("word_id", "accent_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_headword_reading_key" ON "submissions"("headword", "reading");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_ip_address_action_type_window_start_key" ON "rate_limits"("ip_address", "action_type", "window_start");

-- CreateIndex
CREATE INDEX "anonymous_users_prefecture_code_idx" ON "anonymous_users"("prefecture_code");

-- CreateIndex
CREATE INDEX "anonymous_users_last_active_at_idx" ON "anonymous_users"("last_active_at");

-- CreateIndex
CREATE INDEX "anonymous_users_registered_at_idx" ON "anonymous_users"("registered_at");
