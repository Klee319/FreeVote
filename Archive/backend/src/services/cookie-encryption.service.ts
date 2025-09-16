import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { config } from '../config/env';

/**
 * Cookie暗号化サービス
 * AES-256-GCM暗号化を使用してCookieデータを安全に保護
 */
export class CookieEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey: Buffer;

  constructor() {
    // 環境変数から暗号化キーを取得（32バイト必須）
    const env = config.validate();
    const key = env.COOKIE_SECRET_KEY;
    if (!key || key.length < 32) {
      throw new Error('COOKIE_SECRET_KEY must be at least 32 characters long');
    }
    // キーを32バイトに正規化
    this.secretKey = Buffer.from(key.substring(0, 32));
  }

  /**
   * データを暗号化
   * @param data 暗号化するオブジェクト
   * @returns 暗号化された文字列（IV:AuthTag:EncryptedData形式）
   */
  async encrypt(data: object): Promise<string> {
    try {
      // 初期化ベクトル生成（16バイト）
      const iv = randomBytes(16);
      
      // 暗号化器を作成
      const cipher = createCipheriv(this.algorithm, this.secretKey, iv);
      
      // AAD（Additional Authenticated Data）を設定
      cipher.setAAD(Buffer.from('accent-vote-cookie', 'utf8'));
      
      // データをJSON文字列に変換して暗号化
      const jsonString = JSON.stringify(data);
      const encrypted = Buffer.concat([
        cipher.update(jsonString, 'utf8'),
        cipher.final()
      ]);
      
      // 認証タグを取得
      const authTag = cipher.getAuthTag();
      
      // IV + AuthTag + EncryptedData の形式で結合
      return [
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted.toString('hex')
      ].join(':');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * 暗号化されたデータを復号化
   * @param encryptedData 暗号化された文字列
   * @returns 復号化されたオブジェクト
   */
  async decrypt(encryptedData: string): Promise<object> {
    try {
      // 暗号化データを分割
      const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
      
      if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted data format');
      }

      // Hexからバッファに変換
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const encryptedBuffer = Buffer.from(encrypted, 'hex');
      
      // 復号化器を作成
      const decipher = createDecipheriv(this.algorithm, this.secretKey, iv);
      
      // AADを設定
      decipher.setAAD(Buffer.from('accent-vote-cookie', 'utf8'));
      
      // 認証タグを設定
      decipher.setAuthTag(authTag);
      
      // 復号化
      const decrypted = Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final()
      ]);
      
      // JSONをパース
      return JSON.parse(decrypted.toString('utf8'));
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * タイミング攻撃対策付き文字列比較
   * @param a 比較文字列1
   * @param b 比較文字列2
   * @returns 文字列が一致するかどうか
   */
  safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}