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

-- デバイス最終アクセス時刻更新トリガー
CREATE OR REPLACE FUNCTION update_device_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE devices SET last_seen_at = NOW() WHERE id = NEW.device_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_device_last_seen
    AFTER INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_device_last_seen();