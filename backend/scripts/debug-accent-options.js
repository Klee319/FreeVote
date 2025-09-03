const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function debugAccentOptions() {
  try {
    // wordId: 4の情報を取得
    const word = await prisma.word.findUnique({
      where: { id: 4 },
      include: {
        accentOptions: {
          include: {
            accentType: true
          }
        }
      }
    });

    console.log('=== Word ID: 4 ===');
    if (word) {
      console.log(`Headword: ${word.headword}`);
      console.log(`Reading: ${word.reading}`);
      console.log(`Mora Count: ${word.moraCount}`);
      console.log(`Available Accent Options:`);
      
      if (word.accentOptions.length > 0) {
        word.accentOptions.forEach(option => {
          console.log(`  - AccentType ID: ${option.accentTypeId}, Name: ${option.accentType.name}, Pattern: ${option.accentPattern}`);
        });
      } else {
        console.log('  No accent options found');
      }
    } else {
      console.log('Word not found');
    }

    // AccentType ID: 13の情報を取得
    const accentType = await prisma.accentType.findUnique({
      where: { id: 13 }
    });

    console.log('\n=== AccentType ID: 13 ===');
    if (accentType) {
      console.log(`Code: ${accentType.code}`);
      console.log(`Name: ${accentType.name}`);
      console.log(`Description: ${accentType.description}`);
    } else {
      console.log('AccentType not found');
    }

    // wordId: 4とaccentTypeId: 13の関係を確認
    const specificOption = await prisma.accentOption.findFirst({
      where: {
        wordId: 4,
        accentTypeId: 13
      }
    });

    console.log('\n=== Relationship Check ===');
    if (specificOption) {
      console.log('AccentOption exists for wordId: 4 and accentTypeId: 13');
      console.log(`Pattern: ${specificOption.accentPattern}`);
    } else {
      console.log('NO AccentOption found for wordId: 4 and accentTypeId: 13');
      console.log('This is why the error occurs!');
    }

    // vote.service.tsのクエリをシミュレート
    console.log('\n=== Simulating vote.service.ts query ===');
    const simulatedQuery = await prisma.word.findUnique({
      where: { id: 4 },
      include: {
        accentOptions: {
          where: { accentTypeId: 13 }
        }
      }
    });

    if (simulatedQuery) {
      console.log(`Word found: ${simulatedQuery.headword}`);
      console.log(`AccentOptions matching accentTypeId 13: ${simulatedQuery.accentOptions.length}`);
      if (simulatedQuery.accentOptions.length === 0) {
        console.log('ERROR: This would trigger the "指定されたアクセント型は選択できません" error');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAccentOptions();