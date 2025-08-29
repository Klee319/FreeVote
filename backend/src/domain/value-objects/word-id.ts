/**
 * WordId Value Object
 * 語IDを表現する値オブジェクト
 */
export class WordId {
  constructor(private readonly value: number) {
    if (value <= 0) {
      throw new Error('WordId must be a positive number');
    }
  }

  static generate(): WordId {
    // 実際の実装ではDBのauto-incrementを使用
    return new WordId(Math.floor(Math.random() * 1000000) + 1);
  }

  equals(other: WordId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value.toString();
  }

  getValue(): number {
    return this.value;
  }
}