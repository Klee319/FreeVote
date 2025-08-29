import { AccentType, AccentTypeCode } from '../value-objects/accent-type';

/**
 * アクセントパターン情報
 */
export interface AccentPattern {
  accentType: AccentType;
  pitchPattern: number[]; // 0=低, 1=高
  dropPosition: number | null; // 下がり目の位置（null=平板型）
}

/**
 * AccentPatternGenerator Service
 * モーラ配列からアクセントパターンを生成するサービス
 */
export class AccentPatternGenerator {
  /**
   * 指定されたアクセント型に基づいてピッチパターンを生成
   * @param moraSegments モーラ配列
   * @param accentType アクセント型
   * @returns アクセントパターン
   */
  static generate(moraSegments: string[], accentType: AccentType): AccentPattern {
    const moraCount = moraSegments.length;

    if (moraCount === 0) {
      throw new Error('Mora segments cannot be empty');
    }

    switch (accentType.getCode()) {
      case AccentTypeCode.ATAMADAKA:
        return this.generateAtamadaka(moraCount);
      case AccentTypeCode.HEIBAN:
        return this.generateHeiban(moraCount);
      case AccentTypeCode.NAKADAKA:
        return this.generateNakadaka(moraCount);
      case AccentTypeCode.ODAKA:
        return this.generateOdaka(moraCount);
      default:
        throw new Error(`Unknown accent type: ${accentType.toString()}`);
    }
  }

  /**
   * すべてのアクセント型のパターンを生成
   * @param moraSegments モーラ配列
   * @returns すべてのアクセントパターンの配列
   */
  static generateAllPatterns(moraSegments: string[]): AccentPattern[] {
    return AccentType.getAllTypes().map((accentType) =>
      this.generate(moraSegments, accentType),
    );
  }

  /**
   * 頭高型のパターンを生成
   * 第1モーラが高く、第2モーラ以降が低い
   * @param moraCount モーラ数
   */
  private static generateAtamadaka(moraCount: number): AccentPattern {
    const pattern = new Array(moraCount).fill(0);
    pattern[0] = 1;

    return {
      accentType: AccentType.ATAMADAKA,
      pitchPattern: pattern,
      dropPosition: 1,
    };
  }

  /**
   * 平板型のパターンを生成
   * 第1モーラが低く、第2モーラ以降が高く平坦
   * @param moraCount モーラ数
   */
  private static generateHeiban(moraCount: number): AccentPattern {
    const pattern = new Array(moraCount).fill(1);
    if (moraCount > 1) {
      pattern[0] = 0;
    }

    return {
      accentType: AccentType.HEIBAN,
      pitchPattern: pattern,
      dropPosition: null, // 平板型には下がり目がない
    };
  }

  /**
   * 中高型のパターンを生成
   * 語の中間で高→低に下がる
   * @param moraCount モーラ数
   */
  private static generateNakadaka(moraCount: number): AccentPattern {
    const pattern = new Array(moraCount).fill(0);

    // 中高型のパターン生成ロジック
    // 2モーラの場合: [0,1]
    // 3モーラの場合: [0,1,0] または [0,1,1]
    // 4モーラ以上: 中央付近にピークを作る
    if (moraCount === 1) {
      // 1モーラの語に中高型は適用しない（頭高型と同じになる）
      pattern[0] = 1;
      return {
        accentType: AccentType.NAKADAKA,
        pitchPattern: pattern,
        dropPosition: 1,
      };
    } else if (moraCount === 2) {
      pattern[0] = 0;
      pattern[1] = 1;
      return {
        accentType: AccentType.NAKADAKA,
        pitchPattern: pattern,
        dropPosition: 2,
      };
    } else {
      // 3モーラ以上の場合、中央付近を高くする
      const peakStart = 1;
      const peakEnd = Math.ceil(moraCount / 2);
      
      pattern[0] = 0;
      for (let i = peakStart; i <= peakEnd; i++) {
        pattern[i] = 1;
      }
      
      return {
        accentType: AccentType.NAKADAKA,
        pitchPattern: pattern,
        dropPosition: peakEnd + 1,
      };
    }
  }

  /**
   * 尾高型のパターンを生成
   * 語末モーラが高く、助詞で下がる
   * @param moraCount モーラ数
   */
  private static generateOdaka(moraCount: number): AccentPattern {
    const pattern = new Array(moraCount).fill(1);
    
    if (moraCount === 1) {
      // 1モーラの尾高型は全体が高い
      pattern[0] = 1;
    } else {
      // 2モーラ以上は最初が低く、それ以降が高い
      pattern[0] = 0;
    }

    return {
      accentType: AccentType.ODAKA,
      pitchPattern: pattern,
      dropPosition: moraCount, // 語末の後で下がる
    };
  }

  /**
   * ピッチパターンを視覚的な文字列に変換（デバッグ用）
   * @param pattern ピッチパターン配列
   * @returns 視覚的な文字列表現
   */
  static patternToVisualString(pattern: number[]): string {
    return pattern.map((pitch) => (pitch === 1 ? '￣' : '＿')).join('');
  }
}