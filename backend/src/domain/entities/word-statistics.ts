import { WordId, AccentType, Prefecture } from '../value-objects';
import { Vote } from './vote';

/**
 * アクセント型ごとの統計情報
 */
export class AccentStat {
  constructor(
    private readonly _count: number,
    private readonly _percentage: number,
  ) {
    if (_count < 0) {
      throw new Error('Count must be non-negative');
    }
    if (_percentage < 0 || _percentage > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
  }

  get count(): number {
    return this._count;
  }

  get percentage(): number {
    return this._percentage;
  }

  toJSON(): Record<string, unknown> {
    return {
      count: this._count,
      percentage: this._percentage,
    };
  }
}

/**
 * 都道府県ごとの統計情報
 */
export class PrefectureStat {
  constructor(
    private readonly _prefecture: Prefecture,
    private readonly _totalVotes: number,
    private readonly _accentDistribution: Map<AccentType, AccentStat>,
    private readonly _dominantAccent: AccentType,
  ) {}

  get prefecture(): Prefecture {
    return this._prefecture;
  }

  get totalVotes(): number {
    return this._totalVotes;
  }

  get accentDistribution(): Map<AccentType, AccentStat> {
    return new Map(this._accentDistribution);
  }

  get dominantAccent(): AccentType {
    return this._dominantAccent;
  }

  toJSON(): Record<string, unknown> {
    const distribution: Record<string, unknown> = {};
    this._accentDistribution.forEach((stat, accentType) => {
      distribution[accentType.getCode()] = stat.toJSON();
    });

    return {
      prefecture: this._prefecture.getCode(),
      totalVotes: this._totalVotes,
      accentDistribution: distribution,
      dominantAccent: this._dominantAccent.getCode(),
    };
  }
}

/**
 * WordStatistics Entity
 * 語の統計情報を表現するドメインエンティティ
 */
export class WordStatistics {
  private constructor(
    private readonly _wordId: WordId,
    private readonly _nationalStats: Map<AccentType, AccentStat>,
    private readonly _prefectureStats: Map<Prefecture, PrefectureStat>,
    private readonly _totalVotes: number,
    private readonly _lastUpdatedAt: Date,
  ) {}

  /**
   * 投票データから統計を作成
   */
  static create(wordId: WordId, votes: Vote[]): WordStatistics {
    const nationalStats = this.calculateNationalStats(votes);
    const prefectureStats = this.calculatePrefectureStats(votes);
    const totalVotes = votes.length;

    return new WordStatistics(
      wordId,
      nationalStats,
      prefectureStats,
      totalVotes,
      new Date(),
    );
  }

  /**
   * 全国統計を計算
   */
  private static calculateNationalStats(votes: Vote[]): Map<AccentType, AccentStat> {
    const stats = new Map<AccentType, AccentStat>();
    const totalVotes = votes.length;

    if (totalVotes === 0) {
      return stats;
    }

    // アクセント型ごとに投票数をカウント
    const accentCounts = new Map<string, number>();
    for (const vote of votes) {
      const accentCode = vote.accentType.getCode();
      accentCounts.set(accentCode, (accentCounts.get(accentCode) ?? 0) + 1);
    }

    // パーセンテージを計算
    AccentType.getAllTypes().forEach((accentType) => {
      const count = accentCounts.get(accentType.getCode()) ?? 0;
      const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
      stats.set(accentType, new AccentStat(count, percentage));
    });

    return stats;
  }

  /**
   * 都道府県別統計を計算
   */
  private static calculatePrefectureStats(votes: Vote[]): Map<Prefecture, PrefectureStat> {
    const stats = new Map<Prefecture, PrefectureStat>();

    // 都道府県ごとに投票をグルーピング
    const prefectureVotes = new Map<string, Vote[]>();
    for (const vote of votes) {
      const prefCode = vote.prefecture.getCode();
      const current = prefectureVotes.get(prefCode) ?? [];
      current.push(vote);
      prefectureVotes.set(prefCode, current);
    }

    // 各都道府県の統計を計算
    prefectureVotes.forEach((votes, prefCode) => {
      const prefecture = Prefecture.fromCode(prefCode);
      const accentStats = this.calculateNationalStats(votes);
      const totalVotes = votes.length;
      const dominantAccent = this.getDominantAccent(accentStats);

      stats.set(
        prefecture,
        new PrefectureStat(prefecture, totalVotes, accentStats, dominantAccent),
      );
    });

    return stats;
  }

  /**
   * 最も投票数の多いアクセント型を取得
   */
  private static getDominantAccent(accentStats: Map<AccentType, AccentStat>): AccentType {
    let maxCount = 0;
    let dominantAccent = AccentType.HEIBAN; // デフォルト

    accentStats.forEach((stat, accentType) => {
      if (stat.count > maxCount) {
        maxCount = stat.count;
        dominantAccent = accentType;
      }
    });

    return dominantAccent;
  }

  /**
   * 新しい投票を追加して統計を更新
   */
  addVote(vote: Vote): WordStatistics {
    // イミュータブルな更新のため、新しいインスタンスを返す
    // 実際の実装では、既存の投票データも必要
    throw new Error('Method not implemented - requires vote history');
  }

  /**
   * 特定都道府県の優勢アクセント型を取得
   */
  getDominantAccentForPrefecture(prefecture: Prefecture): AccentType | null {
    const stat = this._prefectureStats.get(prefecture);
    return stat?.dominantAccent ?? null;
  }

  /**
   * 特定都道府県の統計を取得
   */
  getPrefectureStat(prefecture: Prefecture): PrefectureStat | null {
    return this._prefectureStats.get(prefecture) ?? null;
  }

  /**
   * 都道府県のデータが十分かを判定
   */
  hasEnoughDataForPrefecture(prefecture: Prefecture, minVotes: number = 10): boolean {
    const stat = this._prefectureStats.get(prefecture);
    return (stat?.totalVotes ?? 0) >= minVotes;
  }

  /**
   * アクティブな都道府県数を取得
   */
  getActivePrefectureCount(): number {
    return this._prefectureStats.size;
  }

  /**
   * 地図表示用のデータを生成
   */
  getMapData(): {
    prefectureColors: Record<string, string>;
    legend: Array<{ accentType: string; color: string; prefectureCount: number }>;
  } {
    const colors: Record<string, string> = {
      atamadaka: '#FF6B6B',
      heiban: '#4ECDC4',
      nakadaka: '#45B7D1',
      odaka: '#FFA07A',
    };

    const prefectureColors: Record<string, string> = {};
    const accentCounts = new Map<string, number>();

    this._prefectureStats.forEach((stat, prefecture) => {
      const dominantCode = stat.dominantAccent.getCode();
      prefectureColors[prefecture.getCode()] = colors[dominantCode] ?? '#CCCCCC';
      accentCounts.set(dominantCode, (accentCounts.get(dominantCode) ?? 0) + 1);
    });

    const legend = AccentType.getAllTypes().map((accentType) => ({
      accentType: accentType.getName(),
      color: colors[accentType.getCode()] ?? '#CCCCCC',
      prefectureCount: accentCounts.get(accentType.getCode()) ?? 0,
    }));

    return { prefectureColors, legend };
  }

  // Getters
  get wordId(): WordId {
    return this._wordId;
  }

  get nationalStats(): Map<AccentType, AccentStat> {
    return new Map(this._nationalStats);
  }

  get prefectureStats(): Map<Prefecture, PrefectureStat> {
    return new Map(this._prefectureStats);
  }

  get totalVotes(): number {
    return this._totalVotes;
  }

  get lastUpdatedAt(): Date {
    return new Date(this._lastUpdatedAt);
  }

  /**
   * プレーンオブジェクトに変換（API レスポンス用）
   */
  toJSON(): Record<string, unknown> {
    const nationalStats: Record<string, unknown> = {};
    this._nationalStats.forEach((stat, accentType) => {
      nationalStats[accentType.getCode()] = stat.toJSON();
    });

    const prefectureStats: Record<string, unknown> = {};
    this._prefectureStats.forEach((stat, prefecture) => {
      prefectureStats[prefecture.getCode()] = stat.toJSON();
    });

    return {
      wordId: this._wordId.getValue(),
      totalVotes: this._totalVotes,
      nationalStats,
      prefectureStats,
      mapData: this.getMapData(),
      lastUpdatedAt: this._lastUpdatedAt.toISOString(),
    };
  }
}