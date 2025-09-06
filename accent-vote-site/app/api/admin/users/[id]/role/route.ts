import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { role } = await request.json();

    if (!['USER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: '無効なロールです' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: role.toLowerCase() }, // PrismaスキーマではroleはlowercaseなのでUSER -> user, ADMIN -> admin
    });

    return NextResponse.json({
      message: 'ユーザーロールを更新しました',
      user,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'ロールの更新に失敗しました' },
      { status: 500 }
    );
  }
}