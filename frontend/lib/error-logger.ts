/**
 * Error Logging Utility
 * エラー情報漏洩対策: 環境に応じて適切なエラーログを出力
 */

/**
 * 環境に応じたエラーログの出力
 * @param context エラーが発生したコンテキスト
 * @param error エラーオブジェクト
 */
export function logError(context: string, error: unknown): void {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // 開発環境では詳細なエラー情報を出力
    console.error(`[${context}]`, error);
  } else {
    // 本番環境ではサニタイズされたメッセージのみ出力
    const safeMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${context}] Error:`, safeMessage);
  }
}
