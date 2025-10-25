import { z } from 'zod';

// 共通のバリデーションスキーマ
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
});

export const uuidSchema = z.string().uuid();

export const prefectureSchema = z.enum([
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]);

export const ageGroupSchema = z.enum([
  '10代', '20代', '30代', '40代', '50代', '60代', '70代以上'
]);

export const genderSchema = z.enum(['男性', '女性', 'その他']);

// ユーザー登録のバリデーション
export const userRegistrationSchema = z.object({
  username: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(100).optional(),
  ageGroup: ageGroupSchema,
  prefecture: prefectureSchema,
  gender: genderSchema,
  provider: z.enum(['twitter', 'instagram', 'tiktok']).optional(),
  providerId: z.string().optional(),
});

// ログインのバリデーション
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// 投票作成のバリデーション
export const createPollSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  isAccentMode: z.boolean().default(false),
  wordId: z.number().optional(),
  options: z.array(z.object({
    label: z.string().min(1).max(100),
    thumbnailUrl: z.string().url().optional(),
    pitchPattern: z.array(z.number()).optional(),
    voiceSampleUrl: z.string().url().optional(),
  })).min(2).max(4),
  deadline: z.string().datetime().optional(),
  shareMessage: z.string().max(500).optional(),
  shareHashtags: z.string().max(200).optional(),
  thumbnailUrl: z.string().url().optional(),
  categories: z.array(z.string()).default([]),
});

// 投票のバリデーション
export const voteSchema = z.object({
  option: z.number().min(0).max(3),
  prefecture: prefectureSchema,
  ageGroup: ageGroupSchema,
  gender: genderSchema,
  userToken: z.string().optional(),
});

// 投票提案のバリデーション
export const voteRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  options: z.array(z.object({
    label: z.string().min(1).max(100),
  })).min(2).max(4),
  categories: z.array(z.string()).default([]),
});

// 投票提案(PollSuggestion)のバリデーション
export const pollSuggestionCreateSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().max(500).optional(),
  options: z.array(z.object({
    label: z.string().min(1).max(50),
    description: z.string().max(200).optional()
  })).min(2).max(10),
  categories: z.array(z.string()).min(1).max(3)
});

// 投票提案ステータス更新のバリデーション
export const pollSuggestionUpdateSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().max(500).optional(),
  adminComment: z.string().max(500).optional()
});

// 投票提案一覧取得のバリデーション
export const pollSuggestionQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  status: z.enum(['pending', 'approved', 'rejected', 'all']).optional(),
  search: z.string().optional()
});

// シェア記録のバリデーション
export const shareTrackSchema = z.object({
  platform: z.enum(['twitter', 'instagram', 'tiktok', 'line', 'copy'])
});

// シェアランキング取得のバリデーション
export const shareRankingQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'all']).default('week'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0')
});

// ユーザープロフィール更新のバリデーション
export const updateProfileSchema = z.object({
  username: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  showInShareRanking: z.boolean().optional(),
  showVoteHistory: z.boolean().optional(),
  twitterId: z.string().max(100).optional(),
  instagramId: z.string().max(100).optional(),
  tiktokId: z.string().max(100).optional()
});

// ユーザーステータス更新のバリデーション（年1回制限対象）
export const updateStatusSchema = z.object({
  ageGroup: ageGroupSchema.optional(),
  prefecture: prefectureSchema.optional(),
  gender: genderSchema.optional()
}).refine(data => {
  // 少なくとも1つのフィールドが指定されている必要がある
  return Object.values(data).some(value => value !== undefined);
}, {
  message: "少なくとも1つのフィールドを指定してください"
});

// SNS連携のバリデーション
export const linkSnsSchema = z.object({
  platform: z.enum(['twitter', 'instagram', 'tiktok']),
  providerId: z.string().min(1).max(200),
  handle: z.string().min(1).max(100)
});

// SNS連携解除のバリデーション
export const unlinkSnsSchema = z.object({
  platform: z.enum(['twitter', 'instagram', 'tiktok'])
});

// 投票履歴取得のバリデーション
export const voteHistoryQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  category: z.string().optional()
});

// ファイルアップロードのバリデーション
export const fileUploadSchema = z.object({
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().max(5 * 1024 * 1024) // 5MB以下
});

// バリデーションエラーのフォーマット
export function formatZodError(error: z.ZodError): string {
  const messages = error.errors.map(err => {
    const field = err.path.join('.');
    return `${field}: ${err.message}`;
  });
  return messages.join(', ');
}