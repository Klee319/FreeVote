import { PrismaClient } from '../generated/prisma';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';

// アプリケーション設定のデフォルト値
const DEFAULT_SETTINGS = {
  display: {
    itemsPerPage: 20,
    maxRecentWords: 10,
    maxRankingItems: 50,
    maxRelatedWords: 8,
    maxSearchResults: 100,
    animationDuration: 300,
    debounceDelay: 500,
  },
  chart: {
    defaultBarHeight: 24,
    maxBarWidth: 100,
    chartColors: {
      primary: '#3b82f6',
      secondary: '#10b981',
      tertiary: '#f59e0b',
      quaternary: '#ef4444',
    },
    showPercentageThreshold: 1,
  },
  map: {
    defaultZoomLevel: 1,
    minZoomLevel: 0.5,
    maxZoomLevel: 3,
    defaultSelectedPrefecture: '13',
    enableAnimation: true,
    tooltipDelay: 200,
  },
  vote: {
    minVotesToShowStats: 5,
    voteTimeout: 5000,
    enableAnonymousVoting: true,
    requireEmailVerification: false,
    maxVotesPerDay: 100,
  },
  features: {
    enableMap: true,
    enableRanking: true,
    enableBookmarks: true,
    enableExport: true,
    enableReport: true,
    enableShare: true,
    maintenanceMode: false,
  },
};

export class SettingsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * データベースから設定を取得
   */
  async getSettings() {
    try {
      // AppSettingsテーブルから設定を取得
      const settings = await this.prisma.appSettings.findMany({
        select: {
          key: true,
          value: true,
          type: true,
          updatedAt: true,
        },
      });

      // 設定をオブジェクト形式に変換
      const settingsMap: any = {};
      
      settings.forEach(setting => {
        const keys = setting.key.split('.');
        let current = settingsMap;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        // 型に応じて値を変換
        let value: any = setting.value;
        
        switch (setting.type) {
          case 'number':
            value = parseFloat(setting.value);
            break;
          case 'boolean':
            value = setting.value === 'true' || setting.value === '1';
            break;
          case 'json':
            try {
              value = JSON.parse(setting.value);
            } catch (e) {
              logger.error(`Failed to parse JSON setting: ${setting.key}`, e);
              value = setting.value;
            }
            break;
        }
        
        current[keys[keys.length - 1]] = value;
      });

      // デフォルト設定とマージ
      const mergedSettings = this.mergeSettings(DEFAULT_SETTINGS, settingsMap);
      
      // 最終更新日時を追加
      const lastUpdated = settings.reduce((latest, setting) => {
        const settingDate = new Date(setting.updatedAt);
        return settingDate > latest ? settingDate : latest;
      }, new Date(0));
      
      return {
        ...mergedSettings,
        lastUpdated: lastUpdated.toISOString(),
      };
    } catch (error) {
      logger.error('Error fetching settings:', error);
      
      // エラー時はデフォルト設定を返す
      return {
        ...DEFAULT_SETTINGS,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * 設定を更新
   */
  async updateSetting(key: string, value: any, type: string = 'string') {
    try {
      const stringValue = type === 'json' ? JSON.stringify(value) : String(value);
      
      await this.prisma.appSettings.upsert({
        where: { key },
        update: {
          value: stringValue,
          type,
        },
        create: {
          key,
          value: stringValue,
          type,
          description: `Auto-generated setting for ${key}`,
        },
      });
      
      return { success: true, message: 'Setting updated successfully' };
    } catch (error) {
      logger.error('Error updating setting:', error);
      throw error;
    }
  }

  /**
   * 複数の設定を一括更新
   */
  async updateSettings(settings: Record<string, any>) {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const [key, value] of Object.entries(settings)) {
          const type = typeof value === 'object' ? 'json' : typeof value;
          const stringValue = type === 'json' ? JSON.stringify(value) : String(value);
          
          await tx.appSettings.upsert({
            where: { key },
            update: {
              value: stringValue,
              type,
            },
            create: {
              key,
              value: stringValue,
              type,
              description: `Auto-generated setting for ${key}`,
            },
          });
        }
      });
      
      return { success: true, message: 'Settings updated successfully' };
    } catch (error) {
      logger.error('Error updating multiple settings:', error);
      throw error;
    }
  }

  /**
   * デフォルト設定とカスタム設定をマージ
   */
  mergeSettings(defaults: any, custom: any): any {
    const result = { ...defaults };
    
    for (const key in custom) {
      if (custom.hasOwnProperty(key)) {
        if (typeof custom[key] === 'object' && !Array.isArray(custom[key]) && custom[key] !== null) {
          result[key] = this.mergeSettings(defaults[key] || {}, custom[key]);
        } else {
          result[key] = custom[key];
        }
      }
    }
    
    return result;
  }

  /**
   * 設定をリセット（デフォルトに戻す）
   */
  async resetSettings() {
    try {
      // すべての設定を削除
      await this.prisma.appSettings.deleteMany({});
      
      return {
        ...DEFAULT_SETTINGS,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error resetting settings:', error);
      throw error;
    }
  }

  /**
   * 特定の設定値を取得（ヘルパーメソッド）
   */
  async getSettingValue<T = any>(key: string, defaultValue: T): Promise<T> {
    try {
      const setting = await this.prisma.appSettings.findUnique({
        where: { key },
      });

      if (!setting) {
        return defaultValue;
      }

      // 型に応じて値を変換
      let value: any = setting.value;
      
      switch (setting.type) {
        case 'number':
          value = parseFloat(setting.value);
          break;
        case 'boolean':
          value = setting.value === 'true' || setting.value === '1';
          break;
        case 'json':
          try {
            value = JSON.parse(setting.value);
          } catch (e) {
            logger.error(`Failed to parse JSON setting: ${key}`, e);
            return defaultValue;
          }
          break;
      }
      
      return value as T;
    } catch (error) {
      logger.error(`Error getting setting ${key}:`, error);
      return defaultValue;
    }
  }
}

// シングルトンインスタンスをエクスポート
const settingsService = new SettingsService(getPrismaClient());
export { settingsService };