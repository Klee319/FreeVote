import { VoteId, WordId, DeviceId, AccentType, Prefecture, AgeGroup } from '../value-objects';

export interface CreateVoteProps {
  wordId: WordId;
  accentType: AccentType;
  deviceId: DeviceId;
  prefecture: Prefecture;
  ageGroup?: AgeGroup | null;
}

/**
 * Vote Entity
 * 投票を表現するドメインエンティティ
 */
export class Vote {
  private static readonly UNDO_TIME_LIMIT_MS = 5 * 1000; // 5秒
  private static readonly VOTE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24時間

  private constructor(
    private readonly _id: VoteId,
    private readonly _wordId: WordId,
    private readonly _accentType: AccentType,
    private readonly _deviceId: DeviceId,
    private readonly _prefecture: Prefecture,
    private readonly _ageGroup: AgeGroup | null,
    private readonly _votedAt: Date,
  ) {}

  /**
   * 新規投票を作成
   */
  static create(props: CreateVoteProps): Vote {
    return new Vote(
      VoteId.generate(),
      props.wordId,
      props.accentType,
      props.deviceId,
      props.prefecture,
      props.ageGroup ?? null,
      new Date(),
    );
  }

  /**
   * 既存データから復元
   */
  static fromData(data: {
    id: number;
    wordId: number;
    accentType: string;
    deviceId: string;
    prefecture: string;
    ageGroup?: string | null;
    votedAt: Date;
  }): Vote {
    return new Vote(
      new VoteId(data.id),
      new WordId(data.wordId),
      AccentType.fromCode(data.accentType),
      DeviceId.fromHash(data.deviceId),
      Prefecture.fromCode(data.prefecture),
      data.ageGroup ? AgeGroup.fromCode(data.ageGroup) : null,
      data.votedAt,
    );
  }

  /**
   * この投票が指定デバイスによって取り消し可能かを判定
   * @param deviceId デバイスID
   * @param currentTime 現在時刻
   * @returns 取り消し可能な場合true
   */
  canBeUndoneBy(deviceId: DeviceId, currentTime: Date): boolean {
    const timeDiff = currentTime.getTime() - this._votedAt.getTime();
    return this._deviceId.equals(deviceId) && timeDiff <= Vote.UNDO_TIME_LIMIT_MS;
  }

  /**
   * この投票が24時間以内かを判定
   * @param currentTime 現在時刻
   * @returns 24時間以内の場合true
   */
  isWithin24Hours(currentTime: Date): boolean {
    const timeDiff = currentTime.getTime() - this._votedAt.getTime();
    return timeDiff < Vote.VOTE_COOLDOWN_MS;
  }

  /**
   * 同じデバイス・語への投票かを判定
   * @param deviceId デバイスID
   * @param wordId 語ID
   * @returns 同じ場合true
   */
  isSameVote(deviceId: DeviceId, wordId: WordId): boolean {
    return this._deviceId.equals(deviceId) && this._wordId.equals(wordId);
  }

  /**
   * アンドゥ期限を取得
   * @returns アンドゥ期限の日時
   */
  getUndoDeadline(): Date {
    return new Date(this._votedAt.getTime() + Vote.UNDO_TIME_LIMIT_MS);
  }

  /**
   * 再投票可能時刻を取得
   * @returns 再投票可能になる日時
   */
  getRevoteAvailableAt(): Date {
    return new Date(this._votedAt.getTime() + Vote.VOTE_COOLDOWN_MS);
  }

  // Getters
  get id(): VoteId {
    return this._id;
  }

  get wordId(): WordId {
    return this._wordId;
  }

  get accentType(): AccentType {
    return this._accentType;
  }

  get deviceId(): DeviceId {
    return this._deviceId;
  }

  get prefecture(): Prefecture {
    return this._prefecture;
  }

  get ageGroup(): AgeGroup | null {
    return this._ageGroup;
  }

  get votedAt(): Date {
    return new Date(this._votedAt);
  }

  /**
   * プレーンオブジェクトに変換（永続化用）
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this._id.getValue(),
      wordId: this._wordId.getValue(),
      accentType: this._accentType.getCode(),
      deviceId: this._deviceId.getValue(),
      prefecture: this._prefecture.getCode(),
      ageGroup: this._ageGroup?.getCode() ?? null,
      votedAt: this._votedAt.toISOString(),
    };
  }
}