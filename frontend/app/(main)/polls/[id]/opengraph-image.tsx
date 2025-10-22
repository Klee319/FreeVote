import { ImageResponse } from 'next/og';
import { isValidUUID } from '@/lib/validation';
import { logError } from '@/lib/error-logger';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface PollOption {
  label: string;
  id?: string;
  thumbnailUrl?: string;
  pitchPattern?: number[];
  voiceSampleUrl?: string;
}

interface ShareMetadata {
  title: string;
  description: string;
  options: (string | PollOption)[];
  categories: string[];
  totalVotes: number;
  commentCount: number;
  thumbnailUrl: string | null;
  deadline: string | null;
}

// テキスト切り詰めユーティリティ関数
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  try {
    // Next.js 15では params が Promise になったため await が必要
    const { id } = await params;

    // UUID検証（SSRF脆弱性対策）
    if (!isValidUUID(id)) {
      logError('generateOGImage', new Error(`Invalid poll ID format: ${id}`));
      throw new Error('Invalid poll ID format');
    }

    // APIからデータ取得
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${apiUrl}/polls/${id}/share-metadata`, {
      next: {
        revalidate: 60,  // 1分ごとに再検証
      },
    });

    if (!response.ok) {
      const status = response.status;
      logError('generateOGImage', new Error(`Failed to fetch poll metadata: ${status}`));
      throw new Error('Failed to fetch poll metadata');
    }

    const { data } = await response.json();
    const metadata: ShareMetadata = data;

    // 背景グラデーション
    const gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

    // 締切情報の計算
    let deadlineText = '無期限';
    if (metadata.deadline) {
      const now = new Date();
      const end = new Date(metadata.deadline);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        deadlineText = '終了';
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) {
          deadlineText = `残り${days}日${hours}時間`;
        } else {
          deadlineText = `残り${hours}時間`;
        }
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: gradient,
            padding: '60px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Header Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: 'white',
                lineHeight: '1.2',
                marginBottom: '20px',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                maxHeight: '134px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {truncateText(metadata.title, 50)}
            </div>

            {/* Categories */}
            {metadata.categories && metadata.categories.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                {metadata.categories.slice(0, 3).map((category, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '20px',
                      color: 'white',
                      display: 'flex',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  >
                    {truncateText(category, 10)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options List */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              padding: '40px',
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '10px',
                display: 'flex',
              }}
            >
              投票の選択肢
            </div>

            {metadata.options.slice(0, 4).map((option, idx) => {
              const optionLabel = typeof option === 'string' ? option : option.label;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#667eea',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div
                    style={{
                      fontSize: '24px',
                      color: '#333',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      display: 'flex',
                      maxWidth: '900px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  >
                    {truncateText(optionLabel, 40)}
                  </div>
                </div>
              );
            })}

            {metadata.options.length > 4 && (
              <div
                style={{
                  fontSize: '20px',
                  color: '#666',
                  fontStyle: 'italic',
                  display: 'flex',
                }}
              >
                ...他 {metadata.options.length - 4} 件の選択肢
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '40px',
              padding: '30px 40px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '40px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    fontSize: '18px',
                    color: '#666',
                    display: 'flex',
                  }}
                >
                  総投票数
                </div>
                <div
                  style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#667eea',
                    display: 'flex',
                  }}
                >
                  {metadata.totalVotes}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    fontSize: '18px',
                    color: '#666',
                    display: 'flex',
                  }}
                >
                  コメント
                </div>
                <div
                  style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#764ba2',
                    display: 'flex',
                  }}
                >
                  {metadata.commentCount || 0}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    fontSize: '18px',
                    color: '#666',
                    display: 'flex',
                  }}
                >
                  締切
                </div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#333',
                    display: 'flex',
                  }}
                >
                  {deadlineText}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                padding: '20px 40px',
                borderRadius: '12px',
                display: 'flex',
              }}
            >
              👆 クリックして結果を見る
            </div>
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (error) {
    logError('generateOGImage', error);

    // エラー時のフォールバック画像
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              display: 'flex',
            }}
          >
            みんなの投票
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  }
}
