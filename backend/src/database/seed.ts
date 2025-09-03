import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

const prefectures = [
  { code: '01', name: '北海道', region: '北海道' },
  { code: '02', name: '青森県', region: '東北' },
  { code: '03', name: '岩手県', region: '東北' },
  { code: '04', name: '宮城県', region: '東北' },
  { code: '05', name: '秋田県', region: '東北' },
  { code: '06', name: '山形県', region: '東北' },
  { code: '07', name: '福島県', region: '東北' },
  { code: '08', name: '茨城県', region: '関東' },
  { code: '09', name: '栃木県', region: '関東' },
  { code: '10', name: '群馬県', region: '関東' },
  { code: '11', name: '埼玉県', region: '関東' },
  { code: '12', name: '千葉県', region: '関東' },
  { code: '13', name: '東京都', region: '関東' },
  { code: '14', name: '神奈川県', region: '関東' },
  { code: '15', name: '新潟県', region: '中部' },
  { code: '16', name: '富山県', region: '中部' },
  { code: '17', name: '石川県', region: '中部' },
  { code: '18', name: '福井県', region: '中部' },
  { code: '19', name: '山梨県', region: '中部' },
  { code: '20', name: '長野県', region: '中部' },
  { code: '21', name: '岐阜県', region: '中部' },
  { code: '22', name: '静岡県', region: '中部' },
  { code: '23', name: '愛知県', region: '中部' },
  { code: '24', name: '三重県', region: '関西' },
  { code: '25', name: '滋賀県', region: '関西' },
  { code: '26', name: '京都府', region: '関西' },
  { code: '27', name: '大阪府', region: '関西' },
  { code: '28', name: '兵庫県', region: '関西' },
  { code: '29', name: '奈良県', region: '関西' },
  { code: '30', name: '和歌山県', region: '関西' },
  { code: '31', name: '鳥取県', region: '中国' },
  { code: '32', name: '島根県', region: '中国' },
  { code: '33', name: '岡山県', region: '中国' },
  { code: '34', name: '広島県', region: '中国' },
  { code: '35', name: '山口県', region: '中国' },
  { code: '36', name: '徳島県', region: '四国' },
  { code: '37', name: '香川県', region: '四国' },
  { code: '38', name: '愛媛県', region: '四国' },
  { code: '39', name: '高知県', region: '四国' },
  { code: '40', name: '福岡県', region: '九州' },
  { code: '41', name: '佐賀県', region: '九州' },
  { code: '42', name: '長崎県', region: '九州' },
  { code: '43', name: '熊本県', region: '九州' },
  { code: '44', name: '大分県', region: '九州' },
  { code: '45', name: '宮崎県', region: '九州' },
  { code: '46', name: '鹿児島県', region: '九州' },
  { code: '47', name: '沖縄県', region: '沖縄' },
];

const categories = [
  { name: '一般語', description: '日常生活でよく使われる一般的な語' },
  { name: '固有名詞', description: '地名、人名、会社名など固有の名称' },
  { name: '専門用語', description: '特定分野の専門的な語' },
  { name: 'カタカナ語', description: '外来語や外国語由来の語' },
];

// アクセント型マスターデータ
const accentTypes = [
  { code: 'heiban', name: '平板型', description: '2音目以降が平坦に高い', sortOrder: 1 },
  { code: 'atamadaka', name: '頭高型', description: '最初が高く、後は低い', sortOrder: 2 },
  { code: 'nakadaka', name: '中高型', description: '途中に高い部分がある', sortOrder: 3 },
  { code: 'odaka', name: '尾高型', description: '語末が高く、助詞で下がる', sortOrder: 4 },
];

const words = [
  {
    headword: '桜',
    reading: 'サクラ',
    categoryName: '一般語',
    moraCount: 3,
    moraSegments: 'サ|ク|ラ',
    status: 'approved',
    accentOptions: [
      { accentTypeCode: 'heiban', accentPattern: 'LHH', dropPosition: null },
      { accentTypeCode: 'atamadaka', accentPattern: 'HLL', dropPosition: 1 },
      { accentTypeCode: 'odaka', accentPattern: 'LHH', dropPosition: 3 },
    ]
  },
  {
    headword: '富士山',
    reading: 'フジサン',
    categoryName: '固有名詞',
    moraCount: 4,
    moraSegments: 'フ|ジ|サ|ン',
    status: 'approved',
    accentOptions: [
      { accentTypeCode: 'heiban', accentPattern: 'LHHH', dropPosition: null },
      { accentTypeCode: 'atamadaka', accentPattern: 'HLLL', dropPosition: 1 },
    ]
  },
  {
    headword: '寿司',
    reading: 'スシ',
    categoryName: '一般語',
    moraCount: 2,
    moraSegments: 'ス|シ',
    status: 'approved',
    accentOptions: [
      { accentTypeCode: 'heiban', accentPattern: 'LH', dropPosition: null },
      { accentTypeCode: 'atamadaka', accentPattern: 'HL', dropPosition: 1 },
      { accentTypeCode: 'odaka', accentPattern: 'LH', dropPosition: 2 },
    ]
  },
  {
    headword: '東京',
    reading: 'トウキョウ',
    categoryName: '固有名詞',
    moraCount: 4,
    moraSegments: 'ト|ウ|キョ|ウ',
    status: 'approved',
    accentOptions: [
      { accentTypeCode: 'heiban', accentPattern: 'LHHH', dropPosition: null },
      { accentTypeCode: 'atamadaka', accentPattern: 'HLLL', dropPosition: 1 },
    ]
  },
  {
    headword: '紅葉',
    reading: 'コウヨウ',
    categoryName: '一般語',
    moraCount: 4,
    moraSegments: 'コ|ウ|ヨ|ウ',
    status: 'approved',
    accentOptions: [
      { accentTypeCode: 'heiban', accentPattern: 'LHHH', dropPosition: null },
      { accentTypeCode: 'atamadaka', accentPattern: 'HLLL', dropPosition: 1 },
      { accentTypeCode: 'nakadaka', accentPattern: 'LHLL', dropPosition: 2 },
    ]
  },
  {
    headword: '雪景色',
    reading: 'ユキゲシキ',
    categoryName: '一般語',
    moraCount: 5,
    moraSegments: 'ユ|キ|ゲ|シ|キ',
    status: 'approved',
    accentOptions: [
      { accentTypeCode: 'heiban', accentPattern: 'LHHHH', dropPosition: null },
      { accentTypeCode: 'nakadaka', accentPattern: 'LHHLL', dropPosition: 3 },
    ]
  },
  {
    headword: 'コンピューター',
    reading: 'コンピューター',
    categoryName: '専門用語',
    moraCount: 7,
    moraSegments: 'コ|ン|ピ|ュ|ー|タ|ー',
    status: 'approved',
    accentOptions: [
      { accentTypeCode: 'heiban', accentPattern: 'LHHHHHH', dropPosition: null },
      { accentTypeCode: 'nakadaka', accentPattern: 'LHHHLLL', dropPosition: 4 },
    ]
  },
  {
    headword: '花見',
    reading: 'ハナミ',
    categoryName: '一般語',
    moraCount: 3,
    moraSegments: 'ハ|ナ|ミ',
    status: 'approved',
    accentOptions: [
      { accentTypeCode: 'heiban', accentPattern: 'LHH', dropPosition: null },
      { accentTypeCode: 'nakadaka', accentPattern: 'LHL', dropPosition: 2 },
    ]
  },
];

async function main() {
  console.log('Start seeding...');

  // 都道府県データを挿入
  for (const prefecture of prefectures) {
    await prisma.prefecture.upsert({
      where: { code: prefecture.code },
      update: {},
      create: prefecture,
    });
  }
  console.log('Prefectures seeded');

  // カテゴリデータを挿入
  for (const category of categories) {
    await prisma.wordCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }
  console.log('Categories seeded');

  // アクセント型データを挿入
  for (const accentType of accentTypes) {
    await prisma.accentType.upsert({
      where: { code: accentType.code },
      update: {
        name: accentType.name,
        description: accentType.description,
        sortOrder: accentType.sortOrder,
      },
      create: accentType,
    });
  }
  console.log('Accent types seeded');

  // 単語データとアクセントオプションを挿入
  for (const wordData of words) {
    const category = await prisma.wordCategory.findUnique({
      where: { name: wordData.categoryName },
    });

    if (category) {
      // 単語を作成または更新
      const word = await prisma.word.upsert({
        where: { 
          headword_reading: {
            headword: wordData.headword,
            reading: wordData.reading,
          }
        },
        update: {},
        create: {
          headword: wordData.headword,
          reading: wordData.reading,
          categoryId: category.id,
          moraCount: wordData.moraCount,
          moraSegments: wordData.moraSegments,
          status: wordData.status,
        },
      });

      // アクセントオプションを作成
      for (const optionData of wordData.accentOptions) {
        const accentType = await prisma.accentType.findUnique({
          where: { code: optionData.accentTypeCode },
        });

        if (accentType) {
          await prisma.accentOption.upsert({
            where: {
              wordId_accentTypeId: {
                wordId: word.id,
                accentTypeId: accentType.id,
              }
            },
            update: {
              accentPattern: optionData.accentPattern,
              dropPosition: optionData.dropPosition,
            },
            create: {
              wordId: word.id,
              accentTypeId: accentType.id,
              accentPattern: optionData.accentPattern,
              dropPosition: optionData.dropPosition,
            },
          });
        }
      }
    }
  }
  console.log('Words and accent options seeded');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });