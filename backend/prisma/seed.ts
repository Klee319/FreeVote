// モックデータ生成スクリプト(現在は使用していません)
/*
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 シードデータの作成を開始します...');

  // 既存データをクリア
  await prisma.pollVote.deleteMany();
  await prisma.userReferral.deleteMany();
  await prisma.userVoteRequest.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appSettings.deleteMany();

  console.log('✅ 既存データをクリアしました');

  // 管理者ユーザー作成
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: adminPassword,
      ageGroup: '30代',
      prefecture: '東京都',
      gender: 'その他',
      isAdmin: true,
    },
  });

  console.log('✅ 管理者ユーザーを作成しました');

  // テストユーザー作成
  const testUsers = [];
  const prefectures = ['東京都', '大阪府', '愛知県', '福岡県', '北海道'];
  const ageGroups = ['20代', '30代', '40代'];
  const genders = ['男性', '女性'];

  for (let i = 1; i <= 5; i++) {
    const password = await bcrypt.hash(`user${i}123`, 10);
    const user = await prisma.user.create({
      data: {
        username: `user${i}`,
        email: `user${i}@example.com`,
        passwordHash: password,
        ageGroup: ageGroups[i % ageGroups.length],
        prefecture: prefectures[i % prefectures.length],
        gender: genders[i % genders.length],
        referralCount: Math.floor(Math.random() * 10),
      },
    });
    testUsers.push(user);
  }

  console.log('✅ テストユーザーを作成しました');

  // サンプル投票データ作成
  const polls = [
    {
      title: '好きな季節は?',
      description: '日本の四季の中で、あなたが一番好きな季節を教えてください。',
      options: [
        { label: '春', thumbnailUrl: 'https://example.com/spring.jpg' },
        { label: '夏', thumbnailUrl: 'https://example.com/summer.jpg' },
        { label: '秋', thumbnailUrl: 'https://example.com/autumn.jpg' },
        { label: '冬', thumbnailUrl: 'https://example.com/winter.jpg' },
      ],
      categories: ['生活', 'アンケート'],
      shareMessage: '私の好きな季節は#OPTION#です!みんなも投票しよう!',
      shareHashtags: '季節,投票,みんなの投票',
    },
    {
      title: '朝食派?夕食派?',
      description: '一日の中で最も重要だと思う食事はどれですか?',
      options: [
        { label: '朝食', thumbnailUrl: 'https://example.com/breakfast.jpg' },
        { label: '昼食', thumbnailUrl: 'https://example.com/lunch.jpg' },
        { label: '夕食', thumbnailUrl: 'https://example.com/dinner.jpg' },
      ],
      categories: ['生活', '食事'],
      shareMessage: '私は#OPTION#派!あなたは?',
      shareHashtags: '食事,ライフスタイル',
    },
    {
      title: '犬派?猫派?',
      description: 'ペットとして飼うならどちら?',
      options: [
        { label: '犬派', thumbnailUrl: 'https://example.com/dog.jpg' },
        { label: '猫派', thumbnailUrl: 'https://example.com/cat.jpg' },
        { label: 'どちらも好き', thumbnailUrl: 'https://example.com/both.jpg' },
      ],
      categories: ['ペット', 'アンケート'],
      shareMessage: '私は#OPTION#です!',
      shareHashtags: 'ペット,犬猫,投票',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日後
    },
    {
      title: 'リモートワーク vs オフィス勤務',
      description: '働き方として理想的なのは?',
      options: [
        { label: 'フルリモート', thumbnailUrl: 'https://example.com/remote.jpg' },
        { label: 'ハイブリッド(週2-3日出社)', thumbnailUrl: 'https://example.com/hybrid.jpg' },
        { label: 'フルオフィス勤務', thumbnailUrl: 'https://example.com/office.jpg' },
      ],
      categories: ['仕事', 'ライフスタイル'],
      shareMessage: '理想の働き方は#OPTION#!',
      shareHashtags: 'リモートワーク,働き方改革',
    },
    {
      title: '最も使うSNSは?',
      description: '日常的に最もよく使うSNSを教えてください。',
      options: [
        { label: 'X (Twitter)', thumbnailUrl: 'https://example.com/twitter.jpg' },
        { label: 'Instagram', thumbnailUrl: 'https://example.com/instagram.jpg' },
        { label: 'TikTok', thumbnailUrl: 'https://example.com/tiktok.jpg' },
        { label: 'その他', thumbnailUrl: 'https://example.com/other.jpg' },
      ],
      categories: ['テクノロジー', 'SNS'],
      shareMessage: '私が最も使うSNSは#OPTION#!',
      shareHashtags: 'SNS,ソーシャルメディア',
    },
    {
      title: '2024年ベストアニメ【終了】',
      description: '2024年に放送されたアニメで最も良かった作品は?',
      options: [
        { label: 'フリーレン', thumbnailUrl: 'https://example.com/frieren.jpg' },
        { label: '薬屋のひとりごと', thumbnailUrl: 'https://example.com/kusuriya.jpg' },
        { label: 'ダンジョン飯', thumbnailUrl: 'https://example.com/dungeon.jpg' },
        { label: 'その他', thumbnailUrl: 'https://example.com/other-anime.jpg' },
      ],
      categories: ['エンタメ', 'アニメ'],
      shareMessage: '2024年のベストアニメは#OPTION#!',
      shareHashtags: 'アニメ,2024年',
      deadline: new Date('2024-12-31T23:59:59'), // 過去の日付
    },
    {
      title: '年末年始の過ごし方【終了】',
      description: '2024年の年末年始はどう過ごしましたか?',
      options: [
        { label: '実家に帰省', thumbnailUrl: 'https://example.com/home.jpg' },
        { label: '旅行', thumbnailUrl: 'https://example.com/travel.jpg' },
        { label: '家でゆっくり', thumbnailUrl: 'https://example.com/relax.jpg' },
        { label: '仕事・勉強', thumbnailUrl: 'https://example.com/work.jpg' },
      ],
      categories: ['生活', 'イベント'],
      shareMessage: '年末年始は#OPTION#で過ごしました!',
      shareHashtags: '年末年始,正月',
      deadline: new Date('2025-01-07T23:59:59'), // 過去の日付
    },
  ];

  const createdPolls = [];
  for (const pollData of polls) {
    const poll = await prisma.poll.create({
      data: {
        title: pollData.title,
        description: pollData.description,
        options: JSON.stringify(pollData.options),
        categories: JSON.stringify(pollData.categories),
        shareMessage: pollData.shareMessage,
        shareHashtags: pollData.shareHashtags,
        deadline: pollData.deadline,
        createdBy: adminUser.id,
        viewCount: Math.floor(Math.random() * 1000),
      },
    });
    createdPolls.push(poll);
  }

  console.log('✅ サンプル投票を作成しました');

  // サンプル投票データ作成
  const allPrefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  for (const poll of createdPolls) {
    const optionsCount = (poll.options as any[]).length;

    // 各投票にランダムな数の投票を作成
    const voteCount = Math.floor(Math.random() * 50) + 20;

    for (let i = 0; i < voteCount; i++) {
      const isRegisteredUser = Math.random() > 0.5 && testUsers.length > 0;
      const user = isRegisteredUser ? testUsers[Math.floor(Math.random() * testUsers.length)] : null;

      await prisma.pollVote.create({
        data: {
          pollId: poll.id,
          option: Math.floor(Math.random() * optionsCount),
          prefecture: allPrefectures[Math.floor(Math.random() * allPrefectures.length)],
          ageGroup: user?.ageGroup || ageGroups[Math.floor(Math.random() * ageGroups.length)],
          gender: user?.gender || genders[Math.floor(Math.random() * genders.length)],
          userId: user?.id,
          userToken: uuidv4(),
        },
      });
    }
  }

  console.log('✅ サンプル投票データを作成しました');

  // ユーザー提案データ作成
  const requests = [
    {
      title: '最も好きなプログラミング言語',
      description: '開発者の皆さん、最も好きなプログラミング言語を投票で決めましょう!',
      options: [
        { label: 'JavaScript/TypeScript' },
        { label: 'Python' },
        { label: 'Java' },
        { label: 'Go' },
      ],
      categories: ['テクノロジー', 'プログラミング'],
      likeCount: 15,
      status: 'pending',
      userId: testUsers[0]?.id,
    },
    {
      title: '好きなコーヒーの飲み方',
      description: 'コーヒーはどのように飲むのが好きですか?',
      options: [
        { label: 'ブラック' },
        { label: 'ミルク入り' },
        { label: '砂糖入り' },
        { label: 'カフェラテ' },
      ],
      categories: ['飲み物', 'ライフスタイル'],
      likeCount: 8,
      status: 'pending',
      userId: testUsers[1]?.id,
    },
  ];

  for (const requestData of requests) {
    await prisma.userVoteRequest.create({
      data: {
        title: requestData.title,
        description: requestData.description,
        options: JSON.stringify(requestData.options),
        categories: JSON.stringify(requestData.categories),
        likeCount: requestData.likeCount,
        status: requestData.status,
        userId: requestData.userId,
      },
    });
  }

  console.log('✅ ユーザー提案データを作成しました');

  // アプリ設定データ作成
  const settings = [
    {
      key: 'site_name',
      value: JSON.stringify('みんなの投票'),
      description: 'サイト名',
    },
    {
      key: 'trending_threshold',
      value: JSON.stringify(100),
      description: 'トレンディング表示の閾値(閲覧数)',
    },
    {
      key: 'share_message_threshold',
      value: JSON.stringify(5),
      description: 'シェアメッセージの接戦判定閾値(%)',
    },
    {
      key: 'max_poll_options',
      value: JSON.stringify(4),
      description: '投票の最大選択肢数',
    },
  ];

  for (const setting of settings) {
    await prisma.appSettings.create({
      data: setting,
    });
  }

  console.log('✅ アプリ設定データを作成しました');

  console.log('\n🎉 シードデータの作成が完了しました!');
  console.log('\n📝 テストアカウント:');
  console.log('   管理者: admin@example.com / admin123');
  console.log('   ユーザー1: user1@example.com / user1123');
  console.log('   ユーザー2: user2@example.com / user2123');
  console.log('   ...');
}

main()
  .catch((e) => {
    console.error('❌ シードデータの作成に失敗しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
*/
