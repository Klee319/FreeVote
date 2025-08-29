/**
 * MoraAnalyzer Service
 * 日本語のモーラ分析を行うサービス
 * カタカナ文字列をモーラ（音韻単位）に分割する
 */
export class MoraAnalyzer {
  // 小書き文字（拗音・促音）のセット
  private static readonly SMALL_KANA = new Set([
    'ァ', 'ィ', 'ゥ', 'ェ', 'ォ',
    'ャ', 'ュ', 'ョ',
    'ヮ', 'ヵ', 'ヶ',
    'ッ',
  ]);

  // 長音記号
  private static readonly LONG_VOWEL = 'ー';

  /**
   * カタカナ文字列をモーラに分割
   * @param reading カタカナ読み
   * @returns モーラの配列
   */
  static splitIntoMora(reading: string): string[] {
    if (!reading || reading.length === 0) {
      return [];
    }

    // カタカナ以外の文字が含まれているかチェック
    if (!this.isValidKatakana(reading)) {
      throw new Error('Reading must be in katakana');
    }

    const moraList: string[] = [];
    let i = 0;

    while (i < reading.length) {
      const currentChar = reading[i];
      let mora = currentChar;

      // 次の文字が小書き文字の場合、結合して1モーラとする
      if (i + 1 < reading.length) {
        const nextChar = reading[i + 1];
        
        // 拗音（きゃ、しゅ、ちょ等）の処理
        if (this.SMALL_KANA.has(nextChar) && nextChar !== 'ッ') {
          mora = currentChar + nextChar;
          i += 2;
        }
        // 促音（っ）は単独で1モーラ
        else if (nextChar === 'ッ') {
          moraList.push(mora);
          i++;
          if (i < reading.length) {
            moraList.push('ッ');
            i++;
          }
        }
        // 長音記号は前のモーラと結合
        else if (nextChar === this.LONG_VOWEL) {
          mora = currentChar + nextChar;
          i += 2;
        }
        // 通常の文字
        else {
          moraList.push(mora);
          i++;
        }
      } else {
        moraList.push(mora);
        i++;
      }
    }

    return moraList;
  }

  /**
   * モーラ数を取得
   * @param reading カタカナ読み
   * @returns モーラ数
   */
  static countMora(reading: string): number {
    return this.splitIntoMora(reading).length;
  }

  /**
   * カタカナ文字列かどうかを検証
   * @param str 検証する文字列
   * @returns カタカナのみの場合true
   */
  private static isValidKatakana(str: string): boolean {
    // カタカナと長音記号のみを許可
    const katakanaRegex = /^[ァ-ヴー]+$/;
    return katakanaRegex.test(str);
  }

  /**
   * ひらがなをカタカナに変換
   * @param hiragana ひらがな文字列
   * @returns カタカナ文字列
   */
  static hiraganaToKatakana(hiragana: string): string {
    return hiragana.replace(/[\u3041-\u3096]/g, (match) => {
      const chr = match.charCodeAt(0) + 0x60;
      return String.fromCharCode(chr);
    });
  }

  /**
   * カタカナをひらがなに変換
   * @param katakana カタカナ文字列
   * @returns ひらがな文字列
   */
  static katakanaToHiragana(katakana: string): string {
    return katakana.replace(/[\u30a1-\u30f6]/g, (match) => {
      const chr = match.charCodeAt(0) - 0x60;
      return String.fromCharCode(chr);
    });
  }
}