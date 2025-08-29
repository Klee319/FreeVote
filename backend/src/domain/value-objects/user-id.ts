/**
 * UserId Value Object
 * ユーザーIDを表現する値オブジェクト（UUID形式）
 */
export class UserId {
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor(private readonly value: string) {
    if (!UserId.UUID_REGEX.test(value)) {
      throw new Error('UserId must be a valid UUID');
    }
  }

  static fromString(uuid: string): UserId {
    return new UserId(uuid);
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  getValue(): string {
    return this.value;
  }
}