/**
 * Prefecture Value Object
 * 都道府県を表現する値オブジェクト
 */
export class Prefecture {
  private static readonly PREFECTURES = new Map<string, Prefecture>([
    ['01', new Prefecture('01', '北海道', '北海道')],
    ['02', new Prefecture('02', '青森県', '東北')],
    ['03', new Prefecture('03', '岩手県', '東北')],
    ['04', new Prefecture('04', '宮城県', '東北')],
    ['05', new Prefecture('05', '秋田県', '東北')],
    ['06', new Prefecture('06', '山形県', '東北')],
    ['07', new Prefecture('07', '福島県', '東北')],
    ['08', new Prefecture('08', '茨城県', '関東')],
    ['09', new Prefecture('09', '栃木県', '関東')],
    ['10', new Prefecture('10', '群馬県', '関東')],
    ['11', new Prefecture('11', '埼玉県', '関東')],
    ['12', new Prefecture('12', '千葉県', '関東')],
    ['13', new Prefecture('13', '東京都', '関東')],
    ['14', new Prefecture('14', '神奈川県', '関東')],
    ['15', new Prefecture('15', '新潟県', '中部')],
    ['16', new Prefecture('16', '富山県', '中部')],
    ['17', new Prefecture('17', '石川県', '中部')],
    ['18', new Prefecture('18', '福井県', '中部')],
    ['19', new Prefecture('19', '山梨県', '中部')],
    ['20', new Prefecture('20', '長野県', '中部')],
    ['21', new Prefecture('21', '岐阜県', '中部')],
    ['22', new Prefecture('22', '静岡県', '中部')],
    ['23', new Prefecture('23', '愛知県', '中部')],
    ['24', new Prefecture('24', '三重県', '近畿')],
    ['25', new Prefecture('25', '滋賀県', '近畿')],
    ['26', new Prefecture('26', '京都府', '近畿')],
    ['27', new Prefecture('27', '大阪府', '近畿')],
    ['28', new Prefecture('28', '兵庫県', '近畿')],
    ['29', new Prefecture('29', '奈良県', '近畿')],
    ['30', new Prefecture('30', '和歌山県', '近畿')],
    ['31', new Prefecture('31', '鳥取県', '中国')],
    ['32', new Prefecture('32', '島根県', '中国')],
    ['33', new Prefecture('33', '岡山県', '中国')],
    ['34', new Prefecture('34', '広島県', '中国')],
    ['35', new Prefecture('35', '山口県', '中国')],
    ['36', new Prefecture('36', '徳島県', '四国')],
    ['37', new Prefecture('37', '香川県', '四国')],
    ['38', new Prefecture('38', '愛媛県', '四国')],
    ['39', new Prefecture('39', '高知県', '四国')],
    ['40', new Prefecture('40', '福岡県', '九州')],
    ['41', new Prefecture('41', '佐賀県', '九州')],
    ['42', new Prefecture('42', '長崎県', '九州')],
    ['43', new Prefecture('43', '熊本県', '九州')],
    ['44', new Prefecture('44', '大分県', '九州')],
    ['45', new Prefecture('45', '宮崎県', '九州')],
    ['46', new Prefecture('46', '鹿児島県', '九州')],
    ['47', new Prefecture('47', '沖縄県', '九州')],
  ]);

  private constructor(
    private readonly code: string,
    private readonly name: string,
    private readonly region: string,
  ) {}

  static fromCode(code: string): Prefecture {
    const prefecture = this.PREFECTURES.get(code);
    if (!prefecture) {
      throw new Error(`Invalid prefecture code: ${code}`);
    }
    return prefecture;
  }

  static getAll(): Prefecture[] {
    return Array.from(this.PREFECTURES.values());
  }

  static getAllCodes(): string[] {
    return Array.from(this.PREFECTURES.keys());
  }

  static getByRegion(region: string): Prefecture[] {
    return Array.from(this.PREFECTURES.values()).filter((p) => p.region === region);
  }

  getCode(): string {
    return this.code;
  }

  getName(): string {
    return this.name;
  }

  getRegion(): string {
    return this.region;
  }

  equals(other: Prefecture): boolean {
    return this.code === other.code;
  }

  toString(): string {
    return this.code;
  }
}