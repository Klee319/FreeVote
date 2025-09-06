import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // フィルター条件を構築
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role && role !== 'ALL') {
      where.role = role;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    // ユーザー数を取得
    const totalItems = await prisma.user.count({ where });

    // ユーザー一覧を取得
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            votes: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // データを整形
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.displayName,
      role: user.role === 'admin' ? 'ADMIN' : 'USER',
      status: 'ACTIVE', // Prismaスキーマにstatusフィールドがないため固定値
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.updatedAt.toISOString(), // updatedAtを代替として使用
      voteCount: user._count.votes,
    }));

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      itemsPerPage: limit,
    };

    return NextResponse.json({
      users: formattedUsers,
      pagination,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'ユーザー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}