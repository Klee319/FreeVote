/**
 * モーラ分割・アクセント処理ユーティリティ
 */

/**
 * カタカナ文字列をモーラ単位に分割する
 * 拗音（ャュョァィゥェォ）は直前の文字と結合して1モーラとする
 */
export function splitIntoMora(katakana: string): string[] {
  const mora: string[] = [];
  const chars = Array.from(katakana);
  
  // 拗音判定用のセット
  const smallKana = new Set([
    'ャ', 'ュ', 'ョ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ', 
    'ッ', 'ヮ', 'ヵ', 'ヶ'
  ]);
  
  // 長音符・促音の扱い
  const longVowelMarks = new Set(['ー', '～']);
  
  let i = 0;
  while (i < chars.length) {
    const currentChar = chars[i];
    const nextChar = chars[i + 1];
    
    if (i > 0 && smallKana.has(currentChar) && currentChar !== 'ッ') {
      // 拗音の場合は前の文字と結合（促音は除く）
      mora[mora.length - 1] += currentChar;
    } else if (currentChar === 'ッ') {
      // 促音は単独のモーラ
      mora.push(currentChar);
    } else if (longVowelMarks.has(currentChar)) {
      // 長音符は前のモーラと結合
      if (mora.length > 0) {
        mora[mora.length - 1] += currentChar;
      } else {
        mora.push(currentChar);
      }
    } else if (nextChar && smallKana.has(nextChar) && nextChar !== 'ッ') {
      // 次が拗音なら結合（促音は除く）
      mora.push(currentChar + nextChar);
      i++; // 次の文字をスキップ
    } else {
      // 通常の文字
      mora.push(currentChar);
    }
    
    i++;
  }
  
  return mora;
}

/**
 * モーラ数をカウント
 */
export function countMora(katakana: string): number {
  return splitIntoMora(katakana).length;
}

/**
 * アクセント型に応じたピッチパターンを生成
 */
export function generateAccentPattern(
  moraCount: number, 
  accentType: 'atamadaka' | 'heiban' | 'nakadaka' | 'odaka',
  dropPosition?: number
): number[] {
  const pattern = new Array(moraCount);
  
  switch (accentType) {
    case 'atamadaka':
      // 頭高: [1, 0, 0, ...]
      pattern[0] = 1;
      for (let i = 1; i < moraCount; i++) {
        pattern[i] = 0;
      }
      break;
      
    case 'heiban':
      // 平板: [0, 1, 1, ...]
      pattern[0] = 0;
      for (let i = 1; i < moraCount; i++) {
        pattern[i] = 1;
      }
      break;
      
    case 'nakadaka':
      // 中高: [0, 1, 1, ..., 1, 0, 0, ...]
      const drop = dropPosition || Math.floor(moraCount / 2) + 1;
      pattern[0] = 0;
      for (let i = 1; i < Math.min(drop, moraCount); i++) {
        pattern[i] = 1;
      }
      for (let i = drop; i < moraCount; i++) {
        pattern[i] = 0;
      }
      break;
      
    case 'odaka':
      // 尾高: [0, 1, 1, ..., 1]（助詞で下がる）
      if (moraCount === 1) {
        pattern[0] = 1;
      } else {
        pattern[0] = 0;
        for (let i = 1; i < moraCount; i++) {
          pattern[i] = 1;
        }
      }
      break;
  }
  
  return pattern;
}

/**
 * 読みをカタカナに正規化
 */
export function normalizeReading(reading: string): string {
  // ひらがなをカタカナに変換
  return reading.replace(/[\u3041-\u3096]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) + 0x60);
  });
}

/**
 * アクセント線の描画用データを生成
 */
export function generateAccentLineData(
  pattern: number[],
  moraSegments: string[]
): {
  points: { x: number; y: number }[];
  dropMarkers: number[];
} {
  const width = 280;
  const height = 80;
  const moraWidth = width / moraSegments.length;
  
  const points = pattern.map((level, i) => ({
    x: i * moraWidth + moraWidth / 2,
    y: level === 1 ? 20 : 50, // 高い=20px, 低い=50px
  }));
  
  // 下がり目の位置を特定
  const dropMarkers: number[] = [];
  for (let i = 0; i < pattern.length - 1; i++) {
    if (pattern[i] === 1 && pattern[i + 1] === 0) {
      dropMarkers.push(i + 1);
    }
  }
  
  return { points, dropMarkers };
}

/**
 * モーラ分割のテスト用検証
 */
export function validateMoraSplit(input: string, expected: string[]): boolean {
  const result = splitIntoMora(input);
  return JSON.stringify(result) === JSON.stringify(expected);
}

// エクスポート用のテストケース（開発時のみ）
export const TEST_CASES = [
  { input: 'サクラ', expected: ['サ', 'ク', 'ラ'] },
  { input: 'キャベツ', expected: ['キャ', 'ベ', 'ツ'] },
  { input: 'コーヒー', expected: ['コー', 'ヒー'] },
  { input: 'ガッコウ', expected: ['ガッ', 'コ', 'ウ'] },
  { input: 'シュウマツ', expected: ['シュ', 'ウ', 'マ', 'ツ'] },
  { input: 'トウキョウ', expected: ['ト', 'ウ', 'キョ', 'ウ'] },
];