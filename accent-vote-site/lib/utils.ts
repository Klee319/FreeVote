import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 都道府県コードから名前を取得
export const PREFECTURE_NAMES: Record<string, string> = {
  '01': '北海道',
  '02': '青森県',
  '03': '岩手県',
  '04': '宮城県',
  '05': '秋田県',
  '06': '山形県',
  '07': '福島県',
  '08': '茨城県',
  '09': '栃木県',
  '10': '群馬県',
  '11': '埼玉県',
  '12': '千葉県',
  '13': '東京都',
  '14': '神奈川県',
  '15': '新潟県',
  '16': '富山県',
  '17': '石川県',
  '18': '福井県',
  '19': '山梨県',
  '20': '長野県',
  '21': '岐阜県',
  '22': '静岡県',
  '23': '愛知県',
  '24': '三重県',
  '25': '滋賀県',
  '26': '京都府',
  '27': '大阪府',
  '28': '兵庫県',
  '29': '奈良県',
  '30': '和歌山県',
  '31': '鳥取県',
  '32': '島根県',
  '33': '岡山県',
  '34': '広島県',
  '35': '山口県',
  '36': '徳島県',
  '37': '香川県',
  '38': '愛媛県',
  '39': '高知県',
  '40': '福岡県',
  '41': '佐賀県',
  '42': '長崎県',
  '43': '熊本県',
  '44': '大分県',
  '45': '宮崎県',
  '46': '鹿児島県',
  '47': '沖縄県',
};

export function getPrefectureName(code: string): string {
  return PREFECTURE_NAMES[code] || '不明';
}

// アクセント型の日本語名
export const ACCENT_TYPE_NAMES: Record<string, string> = {
  atamadaka: '頭高型',
  heiban: '平板型',
  nakadaka: '中高型',
  odaka: '尾高型',
};

export function getAccentTypeName(type: string): string {
  return ACCENT_TYPE_NAMES[type] || type;
}

// アクセント型の色
export const ACCENT_TYPE_COLORS: Record<string, string> = {
  atamadaka: '#ef4444',
  heiban: '#3b82f6',
  nakadaka: '#10b981',
  odaka: '#f59e0b',
};

export function getAccentTypeColor(type: string): string {
  return ACCENT_TYPE_COLORS[type] || '#6b7280';
}

// デバイスIDの生成
export function generateDeviceId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 15);
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
  const hash = btoa(userAgent).substring(0, 10);
  
  return `${timestamp}-${random}-${hash}`;
}

// localStorage操作のラッパー（SSR対応）
export const storage = {
  get: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  set: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

// 日付フォーマット
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// 数値フォーマット（カンマ区切り）
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ja-JP').format(num);
}