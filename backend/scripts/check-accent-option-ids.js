const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkAccentOptionIds() {
  try {
    // すべてのAccentOptionを取得
    const accentOptions = await prisma.accentOption.findMany({
      include: {
        word: true,
        accentType: true
      },
      orderBy: { id: 'asc' }
    });

    console.log('=== All AccentOption IDs ===');
    accentOptions.forEach(option => {
      console.log(`ID: ${option.id}, Word: ${option.word.headword}, AccentType: ${option.accentType.name} (ID: ${option.accentTypeId})`);
    });

    // ID: 13が存在するか確認
    const option13 = accentOptions.find(opt => opt.id === 13);
    if (option13) {
      console.log('\n=== AccentOption with ID 13 ===');
      console.log(`Word: ${option13.word.headword} (ID: ${option13.wordId})`);
      console.log(`AccentType: ${option13.accentType.name} (ID: ${option13.accentTypeId})`);
      console.log(`Pattern: ${option13.accentPattern}`);
    } else {
      console.log('\n=== AccentOption with ID 13 does not exist ===');
    }

    // wordId: 4のAccentOptionsを確認
    console.log('\n=== AccentOptions for wordId: 4 (東京) ===');
    const word4Options = accentOptions.filter(opt => opt.wordId === 4);
    word4Options.forEach(option => {
      console.log(`AccentOption ID: ${option.id}, AccentType: ${option.accentType.name} (AccentTypeID: ${option.accentTypeId})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAccentOptionIds();