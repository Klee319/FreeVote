// 日本地図の都道府県データ（ECharts用）
// 実際のGeoJSONデータは外部から読み込む必要がありますが、
// ここでは都道府県のマッピングデータを定義します

export interface Prefecture {
  code: number;
  name: string;
  nameEn: string;
  region: string;
}

export const prefectures: Prefecture[] = [
  { code: 1, name: '北海道', nameEn: 'Hokkaido', region: '北海道' },
  { code: 2, name: '青森県', nameEn: 'Aomori', region: '東北' },
  { code: 3, name: '岩手県', nameEn: 'Iwate', region: '東北' },
  { code: 4, name: '宮城県', nameEn: 'Miyagi', region: '東北' },
  { code: 5, name: '秋田県', nameEn: 'Akita', region: '東北' },
  { code: 6, name: '山形県', nameEn: 'Yamagata', region: '東北' },
  { code: 7, name: '福島県', nameEn: 'Fukushima', region: '東北' },
  { code: 8, name: '茨城県', nameEn: 'Ibaraki', region: '関東' },
  { code: 9, name: '栃木県', nameEn: 'Tochigi', region: '関東' },
  { code: 10, name: '群馬県', nameEn: 'Gunma', region: '関東' },
  { code: 11, name: '埼玉県', nameEn: 'Saitama', region: '関東' },
  { code: 12, name: '千葉県', nameEn: 'Chiba', region: '関東' },
  { code: 13, name: '東京都', nameEn: 'Tokyo', region: '関東' },
  { code: 14, name: '神奈川県', nameEn: 'Kanagawa', region: '関東' },
  { code: 15, name: '新潟県', nameEn: 'Niigata', region: '中部' },
  { code: 16, name: '富山県', nameEn: 'Toyama', region: '中部' },
  { code: 17, name: '石川県', nameEn: 'Ishikawa', region: '中部' },
  { code: 18, name: '福井県', nameEn: 'Fukui', region: '中部' },
  { code: 19, name: '山梨県', nameEn: 'Yamanashi', region: '中部' },
  { code: 20, name: '長野県', nameEn: 'Nagano', region: '中部' },
  { code: 21, name: '岐阜県', nameEn: 'Gifu', region: '中部' },
  { code: 22, name: '静岡県', nameEn: 'Shizuoka', region: '中部' },
  { code: 23, name: '愛知県', nameEn: 'Aichi', region: '中部' },
  { code: 24, name: '三重県', nameEn: 'Mie', region: '近畿' },
  { code: 25, name: '滋賀県', nameEn: 'Shiga', region: '近畿' },
  { code: 26, name: '京都府', nameEn: 'Kyoto', region: '近畿' },
  { code: 27, name: '大阪府', nameEn: 'Osaka', region: '近畿' },
  { code: 28, name: '兵庫県', nameEn: 'Hyogo', region: '近畿' },
  { code: 29, name: '奈良県', nameEn: 'Nara', region: '近畿' },
  { code: 30, name: '和歌山県', nameEn: 'Wakayama', region: '近畿' },
  { code: 31, name: '鳥取県', nameEn: 'Tottori', region: '中国' },
  { code: 32, name: '島根県', nameEn: 'Shimane', region: '中国' },
  { code: 33, name: '岡山県', nameEn: 'Okayama', region: '中国' },
  { code: 34, name: '広島県', nameEn: 'Hiroshima', region: '中国' },
  { code: 35, name: '山口県', nameEn: 'Yamaguchi', region: '中国' },
  { code: 36, name: '徳島県', nameEn: 'Tokushima', region: '四国' },
  { code: 37, name: '香川県', nameEn: 'Kagawa', region: '四国' },
  { code: 38, name: '愛媛県', nameEn: 'Ehime', region: '四国' },
  { code: 39, name: '高知県', nameEn: 'Kochi', region: '四国' },
  { code: 40, name: '福岡県', nameEn: 'Fukuoka', region: '九州' },
  { code: 41, name: '佐賀県', nameEn: 'Saga', region: '九州' },
  { code: 42, name: '長崎県', nameEn: 'Nagasaki', region: '九州' },
  { code: 43, name: '熊本県', nameEn: 'Kumamoto', region: '九州' },
  { code: 44, name: '大分県', nameEn: 'Oita', region: '九州' },
  { code: 45, name: '宮崎県', nameEn: 'Miyazaki', region: '九州' },
  { code: 46, name: '鹿児島県', nameEn: 'Kagoshima', region: '九州' },
  { code: 47, name: '沖縄県', nameEn: 'Okinawa', region: '九州' },
];

// アクセントタイプの色定義（仕様書準拠）
export const accentColors = {
  '頭高型': '#FF6B6B',  // 赤系
  '平板型': '#4ECDC4',  // 青系  
  '中高型': '#45B7D1',  // 緑系
  '尾高型': '#FFA07A',  // 黄系
  'データ不足': '#E0E0E0', // グレー系
};

// 都道府県の座標データ（簡易版）
export const prefectureCoordinates = {
  '北海道': [141.35, 43.07],
  '青森県': [140.74, 40.82],
  '岩手県': [141.15, 39.70],
  '宮城県': [140.87, 38.27],
  '秋田県': [140.10, 39.72],
  '山形県': [140.36, 38.24],
  '福島県': [140.47, 37.75],
  '茨城県': [140.45, 36.34],
  '栃木県': [139.88, 36.57],
  '群馬県': [139.06, 36.39],
  '埼玉県': [139.65, 35.86],
  '千葉県': [140.12, 35.61],
  '東京都': [139.69, 35.69],
  '神奈川県': [139.64, 35.45],
  '新潟県': [139.02, 37.90],
  '富山県': [137.21, 36.70],
  '石川県': [136.63, 36.59],
  '福井県': [136.22, 36.07],
  '山梨県': [138.57, 35.66],
  '長野県': [138.18, 36.65],
  '岐阜県': [136.72, 35.39],
  '静岡県': [138.38, 34.98],
  '愛知県': [136.91, 35.18],
  '三重県': [136.51, 34.73],
  '滋賀県': [135.87, 35.00],
  '京都府': [135.76, 35.02],
  '大阪府': [135.52, 34.69],
  '兵庫県': [135.18, 35.04],
  '奈良県': [135.83, 34.57],
  '和歌山県': [135.17, 34.23],
  '鳥取県': [134.24, 35.50],
  '島根県': [132.89, 35.47],
  '岡山県': [133.93, 34.66],
  '広島県': [132.46, 34.40],
  '山口県': [131.47, 34.19],
  '徳島県': [134.56, 34.07],
  '香川県': [134.04, 34.34],
  '愛媛県': [132.77, 33.84],
  '高知県': [133.53, 33.56],
  '福岡県': [130.42, 33.61],
  '佐賀県': [130.30, 33.25],
  '長崎県': [129.87, 32.75],
  '熊本県': [130.74, 32.79],
  '大分県': [131.61, 33.24],
  '宮崎県': [131.42, 31.91],
  '鹿児島県': [130.56, 31.56],
  '沖縄県': [127.68, 26.21],
};