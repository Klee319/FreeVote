import { WordId, UserId } from '../value-objects';
import { MoraAnalyzer } from '../services/mora-analyzer';

export enum WordStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum WordCategory {
  GENERAL = 'general',
  TECHNICAL = 'technical',
  DIALECT = 'dialect',
  PROPER_NOUN = 'proper_noun',
}

export interface CreateWordProps {
  headword: string;
  reading: string;
  category: WordCategory;
  aliases?: string[];
}

/**
 * Word Entity
 * 語を表現するドメインエンティティ
 */
export class Word {
  private constructor(
    private readonly _id: WordId,
    private _headword: string,
    private _reading: string,
    private _category: WordCategory,
    private _moraCount: number,
    private _moraSegments: string[],
    private _status: WordStatus,
    private _aliases: string[],
    private _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  /**
   * 新規語を作成
   */
  static create(props: CreateWordProps): Word {
    // 読みのバリデーション
    if (!props.reading || props.reading.length === 0) {
      throw new Error('Reading is required');
    }

    // 見出し語のバリデーション
    if (!props.headword || props.headword.length === 0) {
      throw new Error('Headword is required');
    }

    if (props.headword.length > 100) {
      throw new Error('Headword must be 100 characters or less');
    }

    if (props.reading.length > 200) {
      throw new Error('Reading must be 200 characters or less');
    }

    // モーラ分析
    const moraSegments = MoraAnalyzer.splitIntoMora(props.reading);
    const moraCount = moraSegments.length;

    return new Word(
      WordId.generate(),
      props.headword,
      props.reading,
      props.category,
      moraCount,
      moraSegments,
      WordStatus.PENDING,
      props.aliases ?? [],
      new Date(),
      new Date(),
    );
  }

  /**
   * 既存データから復元
   */
  static fromData(data: {
    id: number;
    headword: string;
    reading: string;
    category: WordCategory;
    moraCount: number;
    moraSegments: string[];
    status: WordStatus;
    aliases: string[];
    createdAt: Date;
    updatedAt: Date;
  }): Word {
    return new Word(
      new WordId(data.id),
      data.headword,
      data.reading,
      data.category,
      data.moraCount,
      data.moraSegments,
      data.status,
      data.aliases,
      data.createdAt,
      data.updatedAt,
    );
  }

  /**
   * 語を承認
   */
  approve(approvedBy: UserId): void {
    if (this._status !== WordStatus.PENDING) {
      throw new Error('Only pending words can be approved');
    }
    this._status = WordStatus.APPROVED;
    this._updatedAt = new Date();
  }

  /**
   * 語を却下
   */
  reject(rejectedBy: UserId, reason: string): void {
    if (this._status !== WordStatus.PENDING) {
      throw new Error('Only pending words can be rejected');
    }
    this._status = WordStatus.REJECTED;
    this._updatedAt = new Date();
  }

  /**
   * 別表記を追加
   */
  addAlias(alias: string): void {
    if (alias && !this._aliases.includes(alias)) {
      this._aliases.push(alias);
      this._updatedAt = new Date();
    }
  }

  /**
   * 別表記を削除
   */
  removeAlias(alias: string): void {
    const index = this._aliases.indexOf(alias);
    if (index > -1) {
      this._aliases.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  // Getters
  get id(): WordId {
    return this._id;
  }

  get headword(): string {
    return this._headword;
  }

  get reading(): string {
    return this._reading;
  }

  get category(): WordCategory {
    return this._category;
  }

  get moraCount(): number {
    return this._moraCount;
  }

  get moraSegments(): string[] {
    return [...this._moraSegments];
  }

  get status(): WordStatus {
    return this._status;
  }

  get aliases(): string[] {
    return [...this._aliases];
  }

  get isApproved(): boolean {
    return this._status === WordStatus.APPROVED;
  }

  get isPending(): boolean {
    return this._status === WordStatus.PENDING;
  }

  get isRejected(): boolean {
    return this._status === WordStatus.REJECTED;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  /**
   * プレーンオブジェクトに変換（永続化用）
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this._id.getValue(),
      headword: this._headword,
      reading: this._reading,
      category: this._category,
      moraCount: this._moraCount,
      moraSegments: this._moraSegments,
      status: this._status,
      aliases: this._aliases,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }
}