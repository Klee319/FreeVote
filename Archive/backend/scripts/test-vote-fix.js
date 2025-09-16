const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

// vote.service.tsの修正をシミュレート
async function testVoteFix() {
  try {
    console.log('=== Testing Vote Fix ===\n');
    
    // テストケース1: AccentOption ID 13で投票（紅葉の中高型）
    const testAccentOptionId = 13;
    const testWordId = 4; // 東京として送信されるが、実際は紅葉(5)になるはず
    
    console.log(`Test Case 1: accentTypeId=${testAccentOptionId}, wordId=${testWordId}`);
    
    // AccentOptionIDとして処理する場合の確認
    let actualAccentTypeId = testAccentOptionId;
    let wordId = testWordId;
    
    if (testAccentOptionId > 10) {
      const accentOption = await prisma.accentOption.findUnique({
        where: { id: testAccentOptionId },
        include: {
          word: true,
          accentType: true,
        },
      });
      
      if (accentOption) {
        console.log(`Found AccentOption ID ${testAccentOptionId}:`);
        console.log(`  - Word: ${accentOption.word.headword} (ID: ${accentOption.wordId})`);
        console.log(`  - AccentType: ${accentOption.accentType.name} (ID: ${accentOption.accentTypeId})`);
        
        wordId = accentOption.wordId;
        actualAccentTypeId = accentOption.accentTypeId;
        
        // wordIdの整合性チェック
        if (testWordId !== wordId) {
          console.log(`\nERROR: AccentOption(ID:${testAccentOptionId}) is for wordId:${wordId}, not wordId:${testWordId}`);
          console.log('This would trigger the error message in the fixed code.');
        }
      }
    }
    
    console.log(`\nAfter processing:`);
    console.log(`  - actualAccentTypeId: ${actualAccentTypeId}`);
    console.log(`  - wordId: ${wordId}`);
    
    // テストケース2: 正しいAccentOption IDで東京に投票
    console.log('\n--- Test Case 2: Correct AccentOption for Tokyo ---');
    const tokyoOptions = await prisma.accentOption.findMany({
      where: { wordId: 4 },
      include: { accentType: true }
    });
    
    console.log('Tokyo (wordId: 4) has these AccentOptions:');
    tokyoOptions.forEach(option => {
      console.log(`  - AccentOption ID: ${option.id}, AccentType: ${option.accentType.name}`);
    });
    
    if (tokyoOptions.length > 0) {
      console.log(`\nTo vote for Tokyo's ${tokyoOptions[0].accentType.name}, use accentTypeId: ${tokyoOptions[0].id}`);
    }
    
    // テストケース3: AccentTypeIDを直接使用（従来の方法）
    console.log('\n--- Test Case 3: Using AccentType ID directly ---');
    const smallId = 2; // 頭高型
    console.log(`Using accentTypeId=${smallId} (less than 10)`);
    console.log('This would be processed as AccentType ID directly (backward compatibility)');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testVoteFix();