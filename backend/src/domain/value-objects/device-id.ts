import { createHash } from 'crypto';

/**
 * DeviceId Value Object
 * デバイスIDを表現する値オブジェクト
 * ブラウザフィンガープリントから生成される一意の識別子
 */
export class DeviceId {
  constructor(private readonly value: string) {
    if (!value || value.length < 10) {
      throw new Error('DeviceId must be at least 10 characters');
    }
  }

  /**
   * ブラウザフィンガープリントからデバイスIDを生成
   */
  static generate(fingerprint: {
    userAgent: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    platform?: string;
  }): DeviceId {
    const data = JSON.stringify(fingerprint);
    const hash = createHash('sha256').update(data).digest('hex');
    return new DeviceId(hash);
  }

  /**
   * ハッシュ化されたフィンガープリントから復元
   */
  static fromHash(hash: string): DeviceId {
    return new DeviceId(hash);
  }

  equals(other: DeviceId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  getValue(): string {
    return this.value;
  }
}