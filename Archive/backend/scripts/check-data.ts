import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function checkData() {
  try {
    // アクセント型のデータ確認
    const accentTypes = await prisma.accentType.findMany();
    console.log('AccentTypes count:', accentTypes.length);
    console.log('AccentTypes:', JSON.stringify(accentTypes, null, 2));
    
    // 単語データの確認
    const words = await prisma.word.findMany();
    console.log('\nWords count:', words.length);
    
    // アクセントオプションの確認
    const accentOptions = await prisma.accentOption.findMany();
    console.log('\nAccentOptions count:', accentOptions.length);
    
    // 最初の5つのアクセントオプション詳細
    const firstOptions = await prisma.accentOption.findMany({
      take: 5,
      include: {
        word: true,
        accentType: true,
      }
    });
    console.log('\nFirst 5 AccentOptions:', JSON.stringify(firstOptions, null, 2));
    
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();