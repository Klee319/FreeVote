import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { isValidUUID } from '@/lib/validation';

export const runtime = 'edge';

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
  deadline: Date | null;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pollId = searchParams.get('pollId');

    if (!pollId || !isValidUUID(pollId)) {
      return new Response('Invalid poll ID', { status: 400 });
    }

    // APIからデータ取得
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${apiUrl}/polls/${pollId}/share-metadata`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch poll metadata');
    }

    const { data } = await response.json();
    const metadata: ShareMetadata = data;

    // 白黒ベースのモダンな配色
    const bgGradient = 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)';
    const textPrimary = '#1a1a1a';
    const textSecondary = '#666666';
    const accentBlack = '#000000';
    const lightGray = '#f8f9fa';
    const borderColor = '#e0e0e0';

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
            background: bgGradient,
            padding: '0',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
          }}
        >
          {/* Header Section - Stylish Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '45px 70px 45px 90px',
              position: 'relative',
              borderBottom: `1px solid ${borderColor}`,
            }}
          >
            {/* Accent Line */}
            <div
              style={{
                position: 'absolute',
                left: '0',
                top: '45px',
                width: '8px',
                height: '75px',
                background: accentBlack,
                display: 'flex',
              }}
            />

            <div
              style={{
                fontSize: '54px',
                fontWeight: '900',
                color: textPrimary,
                lineHeight: '1.2',
                marginBottom: '20px',
                letterSpacing: '-0.03em',
                maxHeight: '130px',
                overflow: 'hidden',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                display: 'flex',
                textShadow: '2px 2px 0px rgba(0,0,0,0.05)',
              }}
            >
              {truncateText(metadata.title, 42)}
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
                      backgroundColor: accentBlack,
                      padding: '6px 18px',
                      borderRadius: '4px',
                      fontSize: '16px',
                      color: 'white',
                      display: 'flex',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontWeight: '700',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {truncateText(category, 12)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              backgroundColor: 'white',
              padding: '40px 70px',
              minHeight: '220px',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: textPrimary,
                marginBottom: '6px',
                display: 'flex',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '-0.01em',
              }}
            >
              投票の選択肢
            </div>

            {metadata.options.slice(0, 3).map((option, idx) => {
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
                      background: accentBlack,
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
                      fontSize: '22px',
                      color: textPrimary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      display: 'flex',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontWeight: '500',
                    }}
                  >
                    {truncateText(optionLabel, 48)}
                  </div>
                </div>
              );
            })}

            {metadata.options.length > 3 && (
              <div
                style={{
                  fontSize: '17px',
                  color: textSecondary,
                  display: 'flex',
                  marginTop: '4px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                ...他 {metadata.options.length - 3} 件の選択肢
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '42px 70px 48px 70px',
              backgroundColor: 'white',
              borderTop: `1px solid ${borderColor}`,
            }}
          >
            <div style={{ display: 'flex', gap: '50px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: '100px' }}>
                <div style={{
                  fontSize: '15px',
                  color: textSecondary,
                  display: 'flex',
                  marginBottom: '6px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: '500',
                }}>
                  総投票数
                </div>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  color: textPrimary,
                  display: 'flex',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}>
                  {metadata.totalVotes}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', minWidth: '100px' }}>
                <div style={{
                  fontSize: '15px',
                  color: textSecondary,
                  display: 'flex',
                  marginBottom: '6px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: '500',
                }}>
                  コメント
                </div>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  color: textPrimary,
                  display: 'flex',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}>
                  {metadata.commentCount || 0}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', minWidth: '160px' }}>
                <div style={{
                  fontSize: '15px',
                  color: textSecondary,
                  display: 'flex',
                  marginBottom: '6px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: '500',
                }}>
                  締切
                </div>
                <div style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: textPrimary,
                  display: 'flex',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  whiteSpace: 'nowrap',
                }}>
                  {deadlineText}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'white',
                background: accentBlack,
                padding: '16px 44px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              👆 投票する
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG Image generation error:', error);

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
        width: 1200,
        height: 630,
      }
    );
  }
}
