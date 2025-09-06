import { NextRequest, NextResponse } from 'next/server';

// ダミーデータ生成
function generateDummyLogs(count: number = 20) {
  const eventTypes = ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'SUSPICIOUS_ACTIVITY', 'IP_BLOCKED', 'RATE_LIMIT_EXCEEDED'];
  const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const logs = [];

  for (let i = 0; i < count; i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    let severity = 'LOW';
    
    // イベントタイプに応じた重要度を設定
    if (eventType === 'SUSPICIOUS_ACTIVITY' || eventType === 'IP_BLOCKED') {
      severity = 'HIGH';
    } else if (eventType === 'LOGIN_FAILURE') {
      severity = 'MEDIUM';
    } else if (eventType === 'RATE_LIMIT_EXCEEDED') {
      severity = 'CRITICAL';
    }

    logs.push({
      id: `log-${i + 1}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      eventType,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      userId: Math.random() > 0.5 ? `user-${Math.floor(Math.random() * 100)}` : undefined,
      userEmail: Math.random() > 0.5 ? `user${Math.floor(Math.random() * 100)}@example.com` : undefined,
      details: `${eventType.replace(/_/g, ' ').toLowerCase()} detected from IP address`,
      severity,
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get('eventType');
    const severity = searchParams.get('severity');

    let logs = generateDummyLogs(50);

    // フィルタリング
    if (eventType && eventType !== 'ALL') {
      logs = logs.filter(log => log.eventType === eventType);
    }

    if (severity && severity !== 'ALL') {
      logs = logs.filter(log => log.severity === severity);
    }

    return NextResponse.json({ logs: logs.slice(0, 20) });
  } catch (error) {
    console.error('Error fetching security logs:', error);
    return NextResponse.json(
      { error: 'セキュリティログの取得に失敗しました' },
      { status: 500 }
    );
  }
}