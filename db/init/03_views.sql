-- ==========================================
-- ビュー定義
-- ==========================================

-- 語の詳細情報ビュー
CREATE OR REPLACE VIEW v_word_details AS
SELECT 
    w.id,
    w.headword,
    w.reading,
    w.mora_count,
    w.mora_segments,
    wc.name as category_name,
    w.status,
    w.created_at,
    array_agg(DISTINCT wa.alias ORDER BY wa.id) as aliases,
    COUNT(DISTINCT v.id) as total_votes
FROM words w
LEFT JOIN word_categories wc ON w.category_id = wc.id
LEFT JOIN word_aliases wa ON w.id = wa.word_id
LEFT JOIN votes v ON w.id = v.word_id
WHERE w.status = 'approved'
GROUP BY w.id, w.headword, w.reading, w.mora_count, w.mora_segments, wc.name, w.status, w.created_at;

-- 人気語ランキングビュー
CREATE OR REPLACE VIEW v_word_ranking AS
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

-- 地域別アクセント分布ビュー
CREATE OR REPLACE VIEW v_regional_accent_distribution AS
SELECT 
    w.id as word_id,
    w.headword,
    w.reading,
    p.region,
    p.name as prefecture_name,
    p.code as prefecture_code,
    at.name as accent_type_name,
    wps.vote_count,
    wps.vote_percentage,
    wps.total_votes_in_pref
FROM word_pref_stats wps
JOIN words w ON wps.word_id = w.id
JOIN prefectures p ON wps.prefecture_code = p.code
JOIN accent_types at ON wps.accent_type_id = at.id
WHERE w.status = 'approved'
ORDER BY w.id, p.region, p.code, at.sort_order;

-- アクティブな投稿者ビュー
CREATE OR REPLACE VIEW v_active_submitters AS
SELECT 
    u.id,
    u.display_name,
    u.prefecture_code,
    p.name as prefecture_name,
    COUNT(DISTINCT s.id) as submission_count,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'approved') as approved_count,
    COUNT(DISTINCT v.id) as vote_count,
    MAX(s.created_at) as last_submission_at,
    MAX(v.created_at) as last_vote_at
FROM users u
LEFT JOIN prefectures p ON u.prefecture_code = p.code
LEFT JOIN submissions s ON u.id = s.submitted_by
LEFT JOIN votes v ON u.id = v.user_id
GROUP BY u.id, u.display_name, u.prefecture_code, p.name
HAVING COUNT(DISTINCT s.id) > 0 OR COUNT(DISTINCT v.id) > 0;

-- 最近の活動ビュー
CREATE OR REPLACE VIEW v_recent_activities AS
(
    SELECT 
        'vote' as activity_type,
        v.created_at as activity_at,
        w.headword,
        w.reading,
        at.name as accent_type,
        p.name as prefecture_name,
        v.age_group,
        u.display_name as user_name
    FROM votes v
    JOIN words w ON v.word_id = w.id
    JOIN accent_types at ON v.accent_type_id = at.id
    LEFT JOIN prefectures p ON v.prefecture_code = p.code
    LEFT JOIN users u ON v.user_id = u.id
    WHERE v.created_at > NOW() - INTERVAL '7 days'
)
UNION ALL
(
    SELECT 
        'submission' as activity_type,
        s.created_at as activity_at,
        s.headword,
        s.reading,
        NULL as accent_type,
        p.name as prefecture_name,
        s.age_group,
        u.display_name as user_name
    FROM submissions s
    LEFT JOIN prefectures p ON s.prefecture_code = p.code
    LEFT JOIN users u ON s.submitted_by = u.id
    WHERE s.created_at > NOW() - INTERVAL '7 days'
)
ORDER BY activity_at DESC
LIMIT 100;

-- マテリアライズドビューで重い集計を高速化
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_word_stats_summary AS
SELECT 
    w.id as word_id,
    w.headword,
    w.reading,
    COUNT(v.id) as total_votes,
    COUNT(DISTINCT v.prefecture_code) as prefecture_count,
    COUNT(DISTINCT DATE(v.created_at)) as active_days,
    MAX(v.created_at) as last_vote_at,
    -- アクセント型別の集計
    COUNT(v.id) FILTER (WHERE at.code = 'atamadaka') as atamadaka_count,
    COUNT(v.id) FILTER (WHERE at.code = 'heiban') as heiban_count,
    COUNT(v.id) FILTER (WHERE at.code = 'nakadaka') as nakadaka_count,
    COUNT(v.id) FILTER (WHERE at.code = 'odaka') as odaka_count
FROM words w
LEFT JOIN votes v ON w.id = v.word_id
LEFT JOIN accent_types at ON v.accent_type_id = at.id
WHERE w.status = 'approved'
GROUP BY w.id, w.headword, w.reading;

-- 一意インデックス作成
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_word_stats_word_id ON mv_word_stats_summary (word_id);

-- 都道府県別サマリービュー
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_prefecture_summary AS
SELECT 
    p.code as prefecture_code,
    p.name as prefecture_name,
    p.region,
    COUNT(DISTINCT v.word_id) as unique_words_voted,
    COUNT(v.id) as total_votes,
    COUNT(DISTINCT v.device_id) as unique_devices,
    COUNT(DISTINCT v.user_id) as unique_users,
    -- 最も投票されているアクセント型
    MODE() WITHIN GROUP (ORDER BY v.accent_type_id) as most_common_accent_type_id
FROM prefectures p
LEFT JOIN votes v ON p.code = v.prefecture_code
GROUP BY p.code, p.name, p.region
ORDER BY p.code;

-- 一意インデックス作成
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_prefecture_summary_code ON mv_prefecture_summary (prefecture_code);