const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkVotes() {
  try {
    // すべての投票を取得
    const votes = await prisma.vote.findMany({
      include: {
        word: true,
        accentType: true,
        device: true,
        prefecture: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('=== All Votes ===');
    votes.forEach(vote => {
      console.log(`\nVote ID: ${vote.id}`);
      console.log(`  Word: ${vote.word.headword} (ID: ${vote.wordId})`);
      console.log(`  AccentType: ${vote.accentType.name} (ID: ${vote.accentTypeId})`);
      console.log(`  Device: ${vote.deviceId}`);
      console.log(`  Prefecture: ${vote.prefecture ? vote.prefecture.name : 'N/A'}`);
      console.log(`  AgeGroup: ${vote.ageGroup}`);
      console.log(`  Created: ${vote.createdAt}`);
    });

    console.log(`\nTotal votes: ${votes.length}`);

    // デバイスごとの投票状況
    const deviceVotes = await prisma.vote.groupBy({
      by: ['deviceId', 'wordId'],
      _count: true
    });

    console.log('\n=== Votes by Device and Word ===');
    deviceVotes.forEach(group => {
      console.log(`Device: ${group.deviceId}, Word: ${group.wordId}, Count: ${group._count}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVotes();