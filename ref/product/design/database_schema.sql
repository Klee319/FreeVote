-- 日本語アクセント投票サイト データベーススキーマ
-- PostgreSQL 14+ 対応

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ユーザー認証テーブル（Supabase Authと連携）
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    prefecture_code CHAR(2) REFERENCES prefectures(code),
    age_group VARCHAR(10) CHECK (age_group IN ('10s', '20s', '30s', '40s', '50s', '60s', '70s+')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 都道府県マスタテーブル
CREATE TABLE prefectures (
    code CHAR(2) PRIMARY KEY, -- '01'～'47'
    name VARCHAR(10) NOT NULL, -- '北海道'～'沖縄県'
    region VARCHAR(10) NOT NULL -- '北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州'
);

-- 語カテゴリマスタテーブル
CREATE TABLE word_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- '一般語', '専門語', '方言', '固有名詞'
    description TEXT
);

-- 単語マスタテーブル
CREATE TABLE words (
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
CREATE TABLE word_aliases (
    id SERIAL PRIMARY KEY,
    word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
    alias VARCHAR(100) NOT NULL, -- 別表記
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- アクセント型定義テーブル
CREATE TABLE accent_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL, -- 'atamadaka', 'heiban', 'nakadaka', 'odaka'
    name VARCHAR(20) NOT NULL, -- '頭高型', '平板型', '中高型', '尾高型'
    description TEXT,
    sort_order INTEGER DEFAULT 0
);

-- 各語のアクセント型オプションテーブル（常に4件）
CREATE TABLE accent_options (
    id SERIAL PRIMARY KEY,
    word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
    accent_type_id INTEGER REFERENCES accent_types(id),
    accent_pattern JSONB NOT NULL, -- 音の高低パターン: [0, 1, 1, 0] （0=低, 1=高）
    drop_position INTEGER, -- 下がり目の位置（中高型・尾高型用）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_word_accent UNIQUE (word_id, accent_type_id)
);

-- デバイス識別テーブル
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fingerprint_hash VARCHAR(64) UNIQUE NOT NULL, -- ブラウザフィンガープリントのハッシュ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 投票テーブル
CREATE TABLE votes (
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
CREATE TABLE word_pref_stats (
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
CREATE TABLE word_national_stats (
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
CREATE TABLE submissions (
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
CREATE TABLE rate_limits (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'vote', 'submit', 'search'
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_ip_action_window UNIQUE (ip_address, action_type, window_start)
);

-- 監査ログテーブル
CREATE TABLE audit_logs (
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
CREATE INDEX idx_words_headword ON words USING gin (headword gin_trgm_ops);
CREATE INDEX idx_words_reading ON words USING gin (reading gin_trgm_ops);
CREATE INDEX idx_word_aliases_alias ON word_aliases USING gin (alias gin_trgm_ops);
CREATE INDEX idx_words_status ON words (status);
CREATE INDEX idx_words_created_at ON words (created_at DESC);

-- 投票関連インデックス
CREATE INDEX idx_votes_word_id ON votes (word_id);
CREATE INDEX idx_votes_device_word ON votes (device_id, word_id);
CREATE INDEX idx_votes_created_at ON votes (created_at DESC);
CREATE INDEX idx_votes_prefecture ON votes (prefecture_code);

-- 統計用インデックス
CREATE INDEX idx_word_pref_stats_word_pref ON word_pref_stats (word_id, prefecture_code);
CREATE INDEX idx_word_national_stats_word ON word_national_stats (word_id);

-- パフォーマンス用複合インデックス
CREATE INDEX idx_votes_word_pref_accent ON votes (word_id, prefecture_code, accent_type_id);
CREATE INDEX idx_words_approved ON words (id) WHERE status = 'approved';

-- ==========================================
-- 初期データ投入
-- ==========================================

-- 都道府県マスタ
INSERT INTO prefectures (code, name, region) VALUES
('01', '北海道', '北海道'),
('02', '青森県', '東北'), ('03', '岩手県', '東北'), ('04', '宮城県', '東北'),
('05', '秋田県', '東北'), ('06', '山形県', '東北'), ('07', '福島県', '東北'),
('08', '茨城県', '関東'), ('09', '栃木県', '関東'), ('10', '群馬県', '関東'),
('11', '埼玉県', '関東'), ('12', '千葉県', '関東'), ('13', '東京都', '関東'), ('14', '神奈川県', '関東'),
('15', '新潟県', '中部'), ('16', '富山県', '中部'), ('17', '石川県', '中部'),
('18', '福井県', '中部'), ('19', '山梨県', '中部'), ('20', '長野県', '中部'),
('21', '岐阜県', '中部'), ('22', '静岡県', '中部'), ('23', '愛知県', '中部'),
('24', '三重県', '近畿'), ('25', '滋賀県', '近畿'), ('26', '京都府', '近畿'),
('27', '大阪府', '近畿'), ('28', '兵庫県', '近畿'), ('29', '奈良県', '近畿'), ('30', '和歌山県', '近畿'),
('31', '鳥取県', '中国'), ('32', '島根県', '中国'), ('33', '岡山県', '中国'),
('34', '広島県', '中国'), ('35', '山口県', '中国'),
('36', '徳島県', '四国'), ('37', '香川県', '四国'), ('38', '愛媛県', '四国'), ('39', '高知県', '四国'),
('40', '福岡県', '九州'), ('41', '佐賀県', '九州'), ('42', '長崎県', '九州'),
('43', '熊本県', '九州'), ('44', '大分県', '九州'), ('45', '宮崎県', '九州'),
('46', '鹿児島県', '九州'), ('47', '沖縄県', '九州');

-- アクセント型マスタ
INSERT INTO accent_types (code, name, description, sort_order) VALUES
('atamadaka', '頭高型', '第1モーラが高く、第2モーラ以降が低い', 1),
('heiban', '平板型', '第1モーラが低く、第2モーラ以降が高く平坦', 2),
('nakadaka', '中高型', '語の中間で高→低に下がる', 3),
('odaka', '尾高型', '語末モーラが高く、助詞で下がる', 4);

-- 語カテゴリマスタ
INSERT INTO word_categories (name, description) VALUES
('一般語', '日常的に使われる一般的な語彙'),
('専門語', '特定の分野で使われる専門用語'),
('方言', '特定地域で使われる方言・訛り'),
('固有名詞', '人名・地名・商品名など');

-- ==========================================
-- トリガー定義
-- ==========================================

-- 更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_words_updated_at
    BEFORE UPDATE ON words
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_votes_updated_at
    BEFORE UPDATE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_word_pref_stats_updated_at
    BEFORE UPDATE ON word_pref_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_word_national_stats_updated_at
    BEFORE UPDATE ON word_national_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 投票統計自動更新トリガー
CREATE OR REPLACE FUNCTION update_vote_stats()
RETURNS TRIGGER AS $$
DECLARE
    pref_total INTEGER;
    national_total INTEGER;
BEGIN
    -- 都道府県別統計更新
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- その語・県・アクセント型の投票数を更新
        INSERT INTO word_pref_stats (word_id, prefecture_code, accent_type_id, vote_count)
        VALUES (NEW.word_id, NEW.prefecture_code, NEW.accent_type_id, 1)
        ON CONFLICT (word_id, prefecture_code, accent_type_id)
        DO UPDATE SET 
            vote_count = word_pref_stats.vote_count + 1,
            updated_at = NOW();
        
        -- その語・県の総投票数を計算
        SELECT SUM(vote_count) INTO pref_total
        FROM word_pref_stats
        WHERE word_id = NEW.word_id AND prefecture_code = NEW.prefecture_code;
        
        -- パーセンテージを更新
        UPDATE word_pref_stats 
        SET 
            total_votes_in_pref = pref_total,
            vote_percentage = ROUND((vote_count::DECIMAL / pref_total) * 100, 2)
        WHERE word_id = NEW.word_id AND prefecture_code = NEW.prefecture_code;
        
        -- 全国統計更新
        INSERT INTO word_national_stats (word_id, accent_type_id, vote_count)
        VALUES (NEW.word_id, NEW.accent_type_id, 1)
        ON CONFLICT (word_id, accent_type_id)
        DO UPDATE SET 
            vote_count = word_national_stats.vote_count + 1,
            updated_at = NOW();
        
        -- 全国総投票数を計算
        SELECT SUM(vote_count) INTO national_total
        FROM word_national_stats
        WHERE word_id = NEW.word_id;
        
        -- パーセンテージを更新
        UPDATE word_national_stats 
        SET 
            total_votes = national_total,
            vote_percentage = ROUND((vote_count::DECIMAL / national_total) * 100, 2)
        WHERE word_id = NEW.word_id;
    END IF;
    
    -- 古い投票の統計減算（UPDATEの場合）
    IF TG_OP = 'UPDATE' AND OLD.accent_type_id != NEW.accent_type_id THEN
        -- 旧アクセント型の統計を減算
        UPDATE word_pref_stats 
        SET vote_count = GREATEST(vote_count - 1, 0)
        WHERE word_id = OLD.word_id AND prefecture_code = OLD.prefecture_code AND accent_type_id = OLD.accent_type_id;
        
        UPDATE word_national_stats 
        SET vote_count = GREATEST(vote_count - 1, 0)
        WHERE word_id = OLD.word_id AND accent_type_id = OLD.accent_type_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vote_stats
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_vote_stats();

-- 語承認時のアクセント型オプション自動生成
CREATE OR REPLACE FUNCTION create_accent_options()
RETURNS TRIGGER AS $$
DECLARE
    accent_type RECORD;
    pattern JSONB;
    drop_pos INTEGER;
BEGIN
    -- 承認された時のみ実行
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- 4つのアクセント型それぞれのオプションを生成
        FOR accent_type IN SELECT * FROM accent_types ORDER BY sort_order LOOP
            -- アクセント型に応じてパターンを生成
            CASE accent_type.code
                WHEN 'atamadaka' THEN
                    -- 頭高: [1,0,0,0...] (モーラ数に応じて)
                    pattern = '[1]'::jsonb || array_to_json(array_fill(0, ARRAY[NEW.mora_count-1]))::jsonb;
                    drop_pos = 1;
                WHEN 'heiban' THEN
                    -- 平板: [0,1,1,1...] 
                    pattern = '[0]'::jsonb || array_to_json(array_fill(1, ARRAY[NEW.mora_count-1]))::jsonb;
                    drop_pos = NULL;
                WHEN 'nakadaka' THEN
                    -- 中高: [0,1,1,0...] (仮に2モーラ目で下がると仮定)
                    pattern = '[0,1]'::jsonb || array_to_json(array_fill(0, ARRAY[GREATEST(NEW.mora_count-2, 0)]))::jsonb;
                    drop_pos = 2;
                WHEN 'odaka' THEN
                    -- 尾高: [0,1,1,1] (語末が高)
                    IF NEW.mora_count = 1 THEN
                        pattern = '[1]'::jsonb;
                    ELSE
                        pattern = '[0]'::jsonb || array_to_json(array_fill(1, ARRAY[NEW.mora_count-1]))::jsonb;
                    END IF;
                    drop_pos = NEW.mora_count;
            END CASE;
            
            INSERT INTO accent_options (word_id, accent_type_id, accent_pattern, drop_position)
            VALUES (NEW.id, accent_type.id, pattern, drop_pos);
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_accent_options
    AFTER INSERT OR UPDATE ON words
    FOR EACH ROW
    EXECUTE FUNCTION create_accent_options();

-- ==========================================
-- バッチ処理（pg_cron）
-- ==========================================

-- 24時間前の投票制限を削除（毎時実行）
SELECT cron.schedule('cleanup-old-vote-constraints', '0 * * * *', 
    'UPDATE votes SET updated_at = updated_at WHERE created_at < NOW() - INTERVAL ''24 hours'''
);

-- 統計データ整合性チェック（日次実行）
SELECT cron.schedule('daily-stats-consistency', '0 2 * * *', 
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_word_stats_summary'
);

-- レート制限テーブルのクリーンアップ（日次実行）
SELECT cron.schedule('cleanup-rate-limits', '0 3 * * *', 
    'DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL ''1 day'''
);

-- ==========================================
-- ビュー定義
-- ==========================================

-- 語の詳細情報ビュー
CREATE VIEW v_word_details AS
SELECT 
    w.id,
    w.headword,
    w.reading,
    w.mora_count,
    w.mora_segments,
    wc.name as category_name,
    w.status,
    w.created_at,
    array_agg(wa.alias ORDER BY wa.id) as aliases,
    COUNT(v.id) as total_votes
FROM words w
LEFT JOIN word_categories wc ON w.category_id = wc.id
LEFT JOIN word_aliases wa ON w.id = wa.word_id
LEFT JOIN votes v ON w.id = v.word_id
WHERE w.status = 'approved'
GROUP BY w.id, w.headword, w.reading, w.mora_count, w.mora_segments, wc.name, w.status, w.created_at;

-- 人気語ランキングビュー
CREATE VIEW v_word_ranking AS
SELECT 
    w.id,
    w.headword,
    w.reading,
    COUNT(v.id) as vote_count,
    COUNT(DISTINCT v.prefecture_code) as prefecture_count,
    w.created_at
FROM words w
LEFT JOIN votes v ON w.id = v.word_id
WHERE w.status = 'approved'
GROUP BY w.id, w.headword, w.reading, w.created_at
ORDER BY vote_count DESC, w.created_at DESC;

-- マテリアライズドビューで重い集計を高速化
CREATE MATERIALIZED VIEW mv_word_stats_summary AS
SELECT 
    w.id as word_id,
    w.headword,
    w.reading,
    COUNT(v.id) as total_votes,
    COUNT(DISTINCT v.prefecture_code) as prefecture_count,
    COUNT(DISTINCT DATE(v.created_at)) as active_days,
    MAX(v.created_at) as last_vote_at
FROM words w
LEFT JOIN votes v ON w.id = v.word_id
WHERE w.status = 'approved'
GROUP BY w.id, w.headword, w.reading;

-- 一意インデックス作成
CREATE UNIQUE INDEX idx_mv_word_stats_word_id ON mv_word_stats_summary (word_id);

-- ==========================================
-- セキュリティ設定
-- ==========================================

-- RLS (Row Level Security) 有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ参照・更新可能
CREATE POLICY users_own_data ON users
    FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 投稿は投稿者本人のみ参照可能
CREATE POLICY submissions_own_data ON submissions
    FOR ALL
    TO authenticated
    USING (auth.uid() = submitted_by);

-- 投票データは匿名参照のみ、統計目的
CREATE POLICY votes_anonymous_read ON votes
    FOR SELECT
    TO public
    USING (true);

-- 管理者は全データアクセス可能
CREATE POLICY admin_full_access ON submissions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );

COMMENT ON DATABASE current_database() IS '日本語アクセント投票サイト - 都道府県別アクセント分布調査システム';