/**
 * AgeGroup Value Object
 * 年代を表現する値オブジェクト
 */
export enum AgeGroupCode {
  TEENS = '10s',
  TWENTIES = '20s',
  THIRTIES = '30s',
  FORTIES = '40s',
  FIFTIES = '50s',
  SIXTIES = '60s',
  SEVENTIES_PLUS = '70s+',
}

export class AgeGroup {
  private static readonly AGE_GROUPS = new Map<string, AgeGroup>([
    [AgeGroupCode.TEENS, new AgeGroup(AgeGroupCode.TEENS, '10代')],
    [AgeGroupCode.TWENTIES, new AgeGroup(AgeGroupCode.TWENTIES, '20代')],
    [AgeGroupCode.THIRTIES, new AgeGroup(AgeGroupCode.THIRTIES, '30代')],
    [AgeGroupCode.FORTIES, new AgeGroup(AgeGroupCode.FORTIES, '40代')],
    [AgeGroupCode.FIFTIES, new AgeGroup(AgeGroupCode.FIFTIES, '50代')],
    [AgeGroupCode.SIXTIES, new AgeGroup(AgeGroupCode.SIXTIES, '60代')],
    [AgeGroupCode.SEVENTIES_PLUS, new AgeGroup(AgeGroupCode.SEVENTIES_PLUS, '70代以上')],
  ]);

  private constructor(
    private readonly code: AgeGroupCode,
    private readonly label: string,
  ) {}

  static fromCode(code: string): AgeGroup | null {
    return this.AGE_GROUPS.get(code) ?? null;
  }

  static getAll(): AgeGroup[] {
    return Array.from(this.AGE_GROUPS.values());
  }

  getCode(): AgeGroupCode {
    return this.code;
  }

  getLabel(): string {
    return this.label;
  }

  equals(other: AgeGroup): boolean {
    return this.code === other.code;
  }

  toString(): string {
    return this.code;
  }
}