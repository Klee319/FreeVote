/**
 * AccentType Value Object
 * アクセント型を表現する値オブジェクト
 */
export enum AccentTypeCode {
  ATAMADAKA = 'atamadaka',
  HEIBAN = 'heiban',
  NAKADAKA = 'nakadaka',
  ODAKA = 'odaka',
}

export class AccentType {
  private constructor(
    private readonly code: AccentTypeCode,
    private readonly name: string,
    private readonly description: string,
  ) {}

  static readonly ATAMADAKA = new AccentType(
    AccentTypeCode.ATAMADAKA,
    '頭高型',
    '第1モーラが高く、第2モーラ以降が低い',
  );

  static readonly HEIBAN = new AccentType(
    AccentTypeCode.HEIBAN,
    '平板型',
    '第1モーラが低く、第2モーラ以降が高く平坦',
  );

  static readonly NAKADAKA = new AccentType(
    AccentTypeCode.NAKADAKA,
    '中高型',
    '語の中間で高→低に下がる',
  );

  static readonly ODAKA = new AccentType(
    AccentTypeCode.ODAKA,
    '尾高型',
    '語末モーラが高く、助詞で下がる',
  );

  static fromCode(code: string): AccentType {
    switch (code) {
      case AccentTypeCode.ATAMADAKA:
        return AccentType.ATAMADAKA;
      case AccentTypeCode.HEIBAN:
        return AccentType.HEIBAN;
      case AccentTypeCode.NAKADAKA:
        return AccentType.NAKADAKA;
      case AccentTypeCode.ODAKA:
        return AccentType.ODAKA;
      default:
        throw new Error(`Invalid accent type code: ${code}`);
    }
  }

  static getAllTypes(): AccentType[] {
    return [AccentType.ATAMADAKA, AccentType.HEIBAN, AccentType.NAKADAKA, AccentType.ODAKA];
  }

  getCode(): AccentTypeCode {
    return this.code;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  equals(other: AccentType): boolean {
    return this.code === other.code;
  }

  toString(): string {
    return this.code;
  }
}