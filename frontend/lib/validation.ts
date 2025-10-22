/**
 * UUID Validation Utility
 * SSRF脆弱性対策: 外部リクエストに使用するIDを厳密に検証
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * UUID形式の検証
 * @param id 検証対象の文字列
 * @returns UUID形式として有効な場合true
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * IDのサニタイゼーション
 * @param id サニタイズ対象のID
 * @returns 検証済みのID
 * @throws {Error} 無効なUUID形式の場合
 */
export function sanitizeId(id: string): string {
  if (!isValidUUID(id)) {
    throw new Error('Invalid poll ID format');
  }
  return id;
}
