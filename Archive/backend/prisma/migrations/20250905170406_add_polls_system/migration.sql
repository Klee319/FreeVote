-- CreateTable
CREATE TABLE "polls" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_accent_mode" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT NOT NULL,
    "word_id" INTEGER,
    "deadline" DATETIME,
    "share_hashtags" TEXT,
    "thumbnail_url" TEXT,
    "option_thumbnails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "polls_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "poll_votes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "poll_id" INTEGER NOT NULL,
    "option_index" INTEGER NOT NULL,
    "user_id" TEXT,
    "device_id" TEXT,
    "prefecture" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "voted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "poll_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_vote_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "options" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "device_id" TEXT,
    "user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "polls_status_deadline_idx" ON "polls"("status", "deadline");

-- CreateIndex
CREATE INDEX "poll_votes_poll_id_option_index_idx" ON "poll_votes"("poll_id", "option_index");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_poll_id_device_id_key" ON "poll_votes"("poll_id", "device_id");

-- CreateIndex
CREATE INDEX "user_vote_requests_status_idx" ON "user_vote_requests"("status");
