const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkDatabaseState() {
  try {
    // すべてのwordの概要を取得
    const words = await prisma.word.findMany({
      include: {
        accentOptions: {
          include: {
            accentType: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    console.log('=== All Words and Their Accent Options ===');
    words.forEach(word => {
      console.log(`\nWord ID: ${word.id} - ${word.headword} (${word.reading})`);
      if (word.accentOptions.length > 0) {
        word.accentOptions.forEach(option => {
          console.log(`  - AccentType: ${option.accentType.id} (${option.accentType.name}), Pattern: ${option.accentPattern}`);
        });
      } else {
        console.log('  - No accent options configured');
      }
    });

    // すべてのAccentTypeを取得
    const accentTypes = await prisma.accentType.findMany({
      orderBy: { id: 'asc' }
    });

    console.log('\n=== All Accent Types ===');
    accentTypes.forEach(type => {
      console.log(`ID: ${type.id}, Code: ${type.code}, Name: ${type.name}`);
    });

    // AccentOptionテーブルの全データ
    const allAccentOptions = await prisma.accentOption.count();
    console.log(`\n=== Total AccentOptions in database: ${allAccentOptions} ===`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseState();