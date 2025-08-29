import { Word, WordDetail, RankingWord, AccentType, PrefectureStat } from '@/types';
import { splitIntoMora, generateAccentPattern } from '@/lib/mora';

// モック語データ
export const mockWords: Word[] = [
  {
    id: 1,
    headword: '桜',
    reading: 'サクラ',
    category: 'general',
    moraCount: 3,
    moraSegments: ['サ', 'ク', 'ラ'],
    totalVotes: 1234,
    prefectureCount: 45,
    createdAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 2,
    headword: '富士山',
    reading: 'フジサン',
    category: 'proper_noun',
    moraCount: 4,
    moraSegments: ['フ', 'ジ', 'サ', 'ン'],
    totalVotes: 987,
    prefectureCount: 47,
    createdAt: '2024-01-14T10:00:00Z',
  },
  {
    id: 3,
    headword: '寿司',
    reading: 'スシ',
    category: 'general',
    moraCount: 2,
    moraSegments: ['ス', 'シ'],
    totalVotes: 856,
    prefectureCount: 42,
    createdAt: '2024-01-13T11:00:00Z',
  },
  {
    id: 4,
    headword: '東京',
    reading: 'トウキョウ',
    category: 'proper_noun',
    moraCount: 4,
    moraSegments: ['ト', 'ウ', 'キョ', 'ウ'],
    totalVotes: 1567,
    prefectureCount: 47,
    createdAt: '2024-01-12T12:00:00Z',
  },
  {
    id: 5,
    headword: '紅葉',
    reading: 'コウヨウ',
    category: 'general',
    moraCount: 4,
    moraSegments: ['コ', 'ウ', 'ヨ', 'ウ'],
    totalVotes: 432,
    prefectureCount: 35,
    createdAt: '2024-01-20T08:00:00Z',
  },
  {
    id: 6,
    headword: '雪景色',
    reading: 'ユキゲシキ',
    category: 'general',
    moraCount: 5,
    moraSegments: ['ユ', 'キ', 'ゲ', 'シ', 'キ'],
    totalVotes: 289,
    prefectureCount: 28,
    createdAt: '2024-01-19T14:00:00Z',
  },
  {
    id: 7,
    headword: 'コンピューター',
    reading: 'コンピューター',
    category: 'technical',
    moraCount: 7,
    moraSegments: ['コ', 'ン', 'ピュ', 'ー', 'ター'],
    totalVotes: 678,
    prefectureCount: 40,
    createdAt: '2024-01-18T15:00:00Z',
  },
  {
    id: 8,
    headword: '花見',
    reading: 'ハナミ',
    category: 'general',
    moraCount: 3,
    moraSegments: ['ハ', 'ナ', 'ミ'],
    totalVotes: 523,
    prefectureCount: 38,
    createdAt: '2024-01-17T16:00:00Z',
  },
];

// 都道府県統計のモック生成関数
function generateMockPrefectureStats(wordId: number): PrefectureStat[] {
  const prefectures = [
    { code: '13', name: '東京都', weight: 1.5 },
    { code: '27', name: '大阪府', weight: 1.3 },
    { code: '14', name: '神奈川県', weight: 1.2 },
    { code: '23', name: '愛知県', weight: 1.1 },
    { code: '11', name: '埼玉県', weight: 1.0 },
    { code: '12', name: '千葉県', weight: 1.0 },
    { code: '01', name: '北海道', weight: 0.9 },
    { code: '40', name: '福岡県', weight: 0.9 },
  ];
  
  const accentTypes: AccentType[] = ['atamadaka', 'heiban', 'nakadaka', 'odaka'];
  
  return prefectures.map(pref => {
    const totalVotes = Math.floor(Math.random() * 100 * pref.weight) + 10;
    const distribution: Record<AccentType, any> = {} as any;
    let remainingVotes = totalVotes;
    
    // ランダムにアクセント型の分布を生成
    const dominantIndex = Math.floor(Math.random() * 4);
    accentTypes.forEach((type, index) => {
      const isLast = index === accentTypes.length - 1;
      const votes = isLast 
        ? remainingVotes 
        : (index === dominantIndex)
          ? Math.floor(totalVotes * (0.4 + Math.random() * 0.3))
          : Math.floor(remainingVotes * Math.random() * 0.3);
      
      remainingVotes -= votes;
      distribution[type] = {
        count: Math.max(0, votes),
        percentage: (Math.max(0, votes) / totalVotes) * 100,
      };
    });
    
    return {
      prefectureCode: pref.code as any,
      prefectureName: pref.name,
      totalVotes,
      dominantAccent: accentTypes[dominantIndex],
      accentDistribution: distribution,
    };
  });
}

// 語詳細データのモック
export const mockWordDetails: Record<string, WordDetail> = {
  '1': {
    id: 1,
    headword: '桜',
    reading: 'サクラ',
    category: 'general',
    moraCount: 3,
    moraSegments: ['サ', 'ク', 'ラ'],
    totalVotes: 1234,
    prefectureCount: 45,
    createdAt: '2024-01-15T09:00:00Z',
    accentOptions: [
      {
        id: 1,
        accentType: { code: 'atamadaka', name: '頭高型' },
        pattern: generateAccentPattern(3, 'atamadaka'),
        dropPosition: 1,
      },
      {
        id: 2,
        accentType: { code: 'heiban', name: '平板型' },
        pattern: generateAccentPattern(3, 'heiban'),
      },
      {
        id: 3,
        accentType: { code: 'nakadaka', name: '中高型' },
        pattern: generateAccentPattern(3, 'nakadaka', 2),
        dropPosition: 2,
      },
      {
        id: 4,
        accentType: { code: 'odaka', name: '尾高型' },
        pattern: generateAccentPattern(3, 'odaka'),
        dropPosition: 3,
      },
    ],
    nationalStats: [
      { accentType: 'heiban', count: 678, percentage: 55 },
      { accentType: 'atamadaka', count: 345, percentage: 28 },
      { accentType: 'nakadaka', count: 123, percentage: 10 },
      { accentType: 'odaka', count: 88, percentage: 7 },
    ],
    prefectureStats: generateMockPrefectureStats(1),
    canVote: true,
    aliases: ['さくら', '櫻'],
  },
  '2': {
    id: 2,
    headword: '富士山',
    reading: 'フジサン',
    category: 'proper_noun',
    moraCount: 4,
    moraSegments: ['フ', 'ジ', 'サ', 'ン'],
    totalVotes: 987,
    prefectureCount: 47,
    createdAt: '2024-01-14T10:00:00Z',
    accentOptions: [
      {
        id: 5,
        accentType: { code: 'atamadaka', name: '頭高型' },
        pattern: generateAccentPattern(4, 'atamadaka'),
        dropPosition: 1,
      },
      {
        id: 6,
        accentType: { code: 'heiban', name: '平板型' },
        pattern: generateAccentPattern(4, 'heiban'),
      },
      {
        id: 7,
        accentType: { code: 'nakadaka', name: '中高型' },
        pattern: generateAccentPattern(4, 'nakadaka', 3),
        dropPosition: 3,
      },
      {
        id: 8,
        accentType: { code: 'odaka', name: '尾高型' },
        pattern: generateAccentPattern(4, 'odaka'),
        dropPosition: 4,
      },
    ],
    nationalStats: [
      { accentType: 'atamadaka', count: 512, percentage: 52 },
      { accentType: 'heiban', count: 296, percentage: 30 },
      { accentType: 'nakadaka', count: 108, percentage: 11 },
      { accentType: 'odaka', count: 71, percentage: 7 },
    ],
    prefectureStats: generateMockPrefectureStats(2),
    canVote: true,
    aliases: ['ふじさん', '富士'],
  },
  '3': {
    id: 3,
    headword: '寿司',
    reading: 'スシ',
    category: 'general',
    moraCount: 2,
    moraSegments: ['ス', 'シ'],
    totalVotes: 856,
    prefectureCount: 42,
    createdAt: '2024-01-13T11:00:00Z',
    accentOptions: [
      {
        id: 9,
        accentType: { code: 'atamadaka', name: '頭高型' },
        pattern: generateAccentPattern(2, 'atamadaka'),
        dropPosition: 1,
      },
      {
        id: 10,
        accentType: { code: 'heiban', name: '平板型' },
        pattern: generateAccentPattern(2, 'heiban'),
      },
      {
        id: 11,
        accentType: { code: 'nakadaka', name: '中高型' },
        pattern: [0, 1], // 2モーラでは中高型と尾高型は同じ
      },
      {
        id: 12,
        accentType: { code: 'odaka', name: '尾高型' },
        pattern: generateAccentPattern(2, 'odaka'),
        dropPosition: 2,
      },
    ],
    nationalStats: [
      { accentType: 'heiban', count: 589, percentage: 69 },
      { accentType: 'atamadaka', count: 180, percentage: 21 },
      { accentType: 'odaka', count: 60, percentage: 7 },
      { accentType: 'nakadaka', count: 27, percentage: 3 },
    ],
    prefectureStats: generateMockPrefectureStats(3),
    canVote: true,
    aliases: ['すし', '鮨', '鮓'],
  },
};

// その他の語の詳細データも追加
['4', '5', '6', '7', '8'].forEach(id => {
  const word = mockWords.find(w => w.id === parseInt(id));
  if (word) {
    mockWordDetails[id] = {
      ...word,
      accentOptions: [
        {
          id: parseInt(id) * 4 - 3,
          accentType: { code: 'atamadaka', name: '頭高型' },
          pattern: generateAccentPattern(word.moraCount, 'atamadaka'),
          dropPosition: 1,
        },
        {
          id: parseInt(id) * 4 - 2,
          accentType: { code: 'heiban', name: '平板型' },
          pattern: generateAccentPattern(word.moraCount, 'heiban'),
        },
        {
          id: parseInt(id) * 4 - 1,
          accentType: { code: 'nakadaka', name: '中高型' },
          pattern: generateAccentPattern(word.moraCount, 'nakadaka', Math.floor(word.moraCount / 2) + 1),
          dropPosition: Math.floor(word.moraCount / 2) + 1,
        },
        {
          id: parseInt(id) * 4,
          accentType: { code: 'odaka', name: '尾高型' },
          pattern: generateAccentPattern(word.moraCount, 'odaka'),
          dropPosition: word.moraCount,
        },
      ],
      nationalStats: [
        { accentType: 'heiban', count: Math.floor(Math.random() * 500) + 200, percentage: Math.random() * 40 + 30 },
        { accentType: 'atamadaka', count: Math.floor(Math.random() * 300) + 100, percentage: Math.random() * 30 + 20 },
        { accentType: 'nakadaka', count: Math.floor(Math.random() * 200) + 50, percentage: Math.random() * 20 + 10 },
        { accentType: 'odaka', count: Math.floor(Math.random() * 100) + 20, percentage: Math.random() * 15 + 5 },
      ],
      prefectureStats: generateMockPrefectureStats(parseInt(id)),
      canVote: true,
      aliases: [],
    };
  }
});

// ランキングデータのモック
export const mockRankingWords: RankingWord[] = [
  {
    id: 4,
    headword: '東京',
    reading: 'トウキョウ',
    category: 'proper_noun',
    moraCount: 4,
    moraSegments: ['ト', 'ウ', 'キョ', 'ウ'],
    totalVotes: 1567,
    prefectureCount: 47,
    rank: 1,
    changeFromLastWeek: 2,
    dominantAccent: 'atamadaka',
    dominantAccentPercentage: 48,
  },
  {
    id: 1,
    headword: '桜',
    reading: 'サクラ',
    category: 'general',
    moraCount: 3,
    moraSegments: ['サ', 'ク', 'ラ'],
    totalVotes: 1234,
    prefectureCount: 45,
    rank: 2,
    changeFromLastWeek: -1,
    dominantAccent: 'heiban',
    dominantAccentPercentage: 55,
  },
  {
    id: 2,
    headword: '富士山',
    reading: 'フジサン',
    category: 'proper_noun',
    moraCount: 4,
    moraSegments: ['フ', 'ジ', 'サ', 'ン'],
    totalVotes: 987,
    prefectureCount: 47,
    rank: 3,
    changeFromLastWeek: 0,
    dominantAccent: 'atamadaka',
    dominantAccentPercentage: 52,
  },
  {
    id: 3,
    headword: '寿司',
    reading: 'スシ',
    category: 'general',
    moraCount: 2,
    moraSegments: ['ス', 'シ'],
    totalVotes: 856,
    prefectureCount: 42,
    rank: 4,
    changeFromLastWeek: 1,
    dominantAccent: 'heiban',
    dominantAccentPercentage: 69,
  },
  {
    id: 7,
    headword: 'コンピューター',
    reading: 'コンピューター',
    category: 'technical',
    moraCount: 7,
    moraSegments: ['コ', 'ン', 'ピュ', 'ー', 'ター'],
    totalVotes: 678,
    prefectureCount: 40,
    rank: 5,
    changeFromLastWeek: 3,
    dominantAccent: 'heiban',
    dominantAccentPercentage: 62,
  },
];