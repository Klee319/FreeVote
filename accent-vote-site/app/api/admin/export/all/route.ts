import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // すべてのデータを取得
    const [words, polls, votes, users] = await Promise.all([
      prisma.word.findMany({
        include: {
          _count: {
            select: {
              votes: true,
            },
          },
        },
      }),
      prisma.poll.findMany({
        include: {
          options: true,
          _count: {
            select: {
              pollVotes: true,
            },
          },
        },
      }),
      prisma.vote.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          word: {
            select: {
              id: true,
              word: true,
              reading: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              votes: true,
            },
          },
        },
      }),
    ]);

    // 完全バックアップデータを構築
    const backupData = {
      metadata: {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        counts: {
          words: words.length,
          polls: polls.length,
          votes: votes.length,
          users: users.length,
        },
      },
      data: {
        words: words.map(word => ({
          id: word.id,
          word: word.word,
          reading: word.reading,
          description: word.description,
          accentType: word.accentType,
          voteCount: word._count.votes,
          createdAt: word.createdAt.toISOString(),
          updatedAt: word.updatedAt.toISOString(),
        })),
        polls: polls.map(poll => ({
          id: poll.id,
          title: poll.title,
          description: poll.description,
          startDate: poll.startDate?.toISOString(),
          endDate: poll.endDate?.toISOString(),
          isActive: poll.isActive,
          options: poll.options.map(opt => ({
            id: opt.id,
            text: opt.text,
            voteCount: opt.voteCount,
          })),
          totalVotes: poll._count.pollVotes,
          createdAt: poll.createdAt.toISOString(),
          updatedAt: poll.updatedAt.toISOString(),
        })),
        votes: votes.map(vote => ({
          id: vote.id,
          userId: vote.userId,
          userEmail: vote.user?.email,
          userName: vote.user?.name,
          wordId: vote.wordId,
          word: vote.word.word,
          reading: vote.word.reading,
          selectedAccent: vote.selectedAccent,
          prefecture: vote.prefecture,
          age: vote.age,
          createdAt: vote.createdAt.toISOString(),
        })),
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'USER',
          status: user.status || 'ACTIVE',
          voteCount: user._count.votes,
          createdAt: user.createdAt.toISOString(),
        })),
      },
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup_${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'バックアップの作成に失敗しました' },
      { status: 500 }
    );
  }
}