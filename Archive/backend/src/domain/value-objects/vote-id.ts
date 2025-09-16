/**
 * VoteId Value Object
 * 投票IDを表現する値オブジェクト
 */
export class VoteId {
  constructor(private readonly value: number) {
    if (value <= 0) {
      throw new Error('VoteId must be a positive number');
    }
  }

  static generate(): VoteId {
    // 実際の実装ではDBのauto-incrementを使用
    return new VoteId(Math.floor(Math.random() * 1000000) + 1);
  }

  equals(other: VoteId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value.toString();
  }

  getValue(): number {
    return this.value;
  }
}