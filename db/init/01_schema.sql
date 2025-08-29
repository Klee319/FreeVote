-- 日本語アクセント投票サイト データベーススキーマ
-- PostgreSQL 14+ 対応

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Note: pg_cronは別途インストールが必要（開発環境では省略可能）
-- CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- trigram拡張（検索用）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==========================================
-- テーブル定義
-- ==========================================

-- 都道府県マスタテーブル
CREATE TABLE IF NOT EXISTS prefectures (
    code CHAR(2) PRIMARY KEY, -- '01'～'47'
    name VARCHAR(10) NOT NULL, -- '北海道'～'沖縄県'
    region VARCHAR(10) NOT NULL -- '北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州'
);

-- 語カテゴリマスタテーブル
CREATE TABLE IF NOT EXISTS word_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- '一般語', '専門語', '方言', '固有名詞'
    description TEXT
);

-- アクセント型定義テーブル
CREATE TABLE IF NOT EXISTS accent_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL, -- 'atamadaka', 'heiban', 'nakadaka', 'odaka'
    name VARCHAR(20) NOT NULL, -- '頭高型', '平板型', '中高型', '尾高型'
    description TEXT,
    sort_order INTEGER DEFAULT 0
);

-- ユーザー認証テーブル（Supabase Authと連携）
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    prefecture_code CHAR(2) REFERENCES prefectures(code),
    age_group VARCHAR(10) CHECK (age_group IN ('10s', '20s', '30s', '40s', '50s', '60s', '70s+')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 単語マスタテーブル
CREATE TABLE IF NOT EXISTS words (
    id SERIAL PRIMARY KEY,
    headword VARCHAR(100) NOT NULL, -- 見出し語
    reading VARCHAR(200) NOT NULL, -- 読み（カタカナ）
    category_id INTEGER REFERENCES word_categories(id),
    mora_count INTEGER NOT NULL, -- モーラ数
    mora_segments JSONB NOT NULL, -- モーラ分割結果: ["カ", "ガ", "ク"]
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- インデックス用
    CONSTRAINT unique_word_reading UNIQUE (headword, reading)
);

-- 別表記テーブル（多対多関係）
CREATE TABLE IF NOT EXISTS word_aliases (
    id SERIAL PRIMARY KEY,
    word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
    alias VARCHAR(100) NOT NULL, -- 別表記
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 各語のアクセント型オプションテーブル（常に4件）
CREATE TABLE IF NOT EXISTS accent_options (
    id SERIAL PRIMARY KEY,
    word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
    accent_type_id INTEGER REFERENCES accent_types(id),
    accent_pattern JSONB NOT NULL, -- 音の高低パターン: [0, 1, 1, 0] （0=低, 1=高）
    drop_position INTEGER, -- 下がり目の位置（中高型・尾高型用）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_word_accent UNIQUE (word_id, accent_type_id)
);

-- デバイス識別テーブル
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fingerprint_hash VARCHAR(64) UNIQUE NOT NULL, -- ブラウザフィンガープリントのハッシュ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 投票テーブル
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
    accent_type_id INTEGER REFERENCES accent_types(id),
    device_id UUID REFERENCES devices(id),
    user_id UUID REFERENCES users(id), -- ログインユーザーの場合のみ
    prefecture_code CHAR(2) REFERENCES prefectures(code),
    age_group VARCHAR(10) CHECK (age_group IN ('10s', '20s', '30s', '40s', '50s', '60s', '70s+')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT unique_device_word_24h UNIQUE (device_id, word_id)
);

-- 都道府県別統計テーブル（集計用）
CREATE TABLE IF NOT EXISTS word_pref_stats (
    id SERIAL PRIMARY KEY,
    word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
    prefecture_code CHAR(2) REFERENCES prefectures(code),
    accent_type_id INTEGER REFERENCES accent_types(id),
    vote_count INTEGER DEFAULT 0,
    vote_percentage DECIMAL(5,2) DEFAULT 0.00, -- その県でのそのアクセント型の割合
    total_votes_in_pref INTEGER DEFAULT 0, -- その県でのその語の総投票数
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_word_pref_accent UNIQUE (word_id, prefecture_code, accent_type_id)
);

-- 全国統計テーブル（集計用）
CREATE TABLE IF NOT EXISTS word_national_stats (
    id SERIAL PRIMARY KEY,
    word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
    accent_type_id INTEGER REFERENCES accent_types(id),
    vote_count INTEGER DEFAULT 0,
    vote_percentage DECIMAL(5,2) DEFAULT 0.00,
    total_votes INTEGER DEFAULT 0, -- その語の全国総投票数
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_word_national_accent UNIQUE (word_id, accent_type_id)
);

-- 新語投稿テーブル
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    headword VARCHAR(100) NOT NULL,
    reading VARCHAR(200) NOT NULL,
    category_id INTEGER REFERENCES word_categories(id),
    aliases TEXT, -- カンマ区切りの別表記
    submitted_by UUID REFERENCES users(id),
    initial_accent_type_id INTEGER REFERENCES accent_types(id), -- 投稿者の初期投票
    prefecture_code CHAR(2) REFERENCES prefectures(code),
    age_group VARCHAR(10),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    moderator_comment TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_submission_word_reading UNIQUE (headword, reading)
);

-- レート制限テーブル
CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'vote', 'submit', 'search'
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_ip_action_window UNIQUE (ip_address, action_type, window_start)
);

-- 監査ログテーブル
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    device_id UUID REFERENCES devices(id),
    action VARCHAR(100) NOT NULL, -- 'vote', 'submit', 'approve', 'reject'
    resource_type VARCHAR(50) NOT NULL, -- 'word', 'vote', 'submission'
    resource_id INTEGER,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- インデックス定義
-- ==========================================

-- 基本検索用インデックス
CREATE INDEX IF NOT EXISTS idx_words_headword ON words USING gin (headword gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_words_reading ON words USING gin (reading gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_word_aliases_alias ON word_aliases USING gin (alias gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_words_status ON words (status);
CREATE INDEX IF NOT EXISTS idx_words_created_at ON words (created_at DESC);

-- 投票関連インデックス
CREATE INDEX IF NOT EXISTS idx_votes_word_id ON votes (word_id);
CREATE INDEX IF NOT EXISTS idx_votes_device_word ON votes (device_id, word_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_prefecture ON votes (prefecture_code);

-- 統計用インデックス
CREATE INDEX IF NOT EXISTS idx_word_pref_stats_word_pref ON word_pref_stats (word_id, prefecture_code);
CREATE INDEX IF NOT EXISTS idx_word_national_stats_word ON word_national_stats (word_id);

-- パフォーマンス用複合インデックス
CREATE INDEX IF NOT EXISTS idx_votes_word_pref_accent ON votes (word_id, prefecture_code, accent_type_id);
CREATE INDEX IF NOT EXISTS idx_words_approved ON words (id) WHERE status = 'approved';