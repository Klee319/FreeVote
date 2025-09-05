import { Request, Response } from 'express';
import { settingsService } from '../services/settings.service';

export const settingsController = {
  /**
   * アプリケーション設定を取得
   */
  async getSettings(req: Request, res: Response) {
    try {
      const settings = await settingsService.getSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error in getSettings:', error);
      res.status(500).json({ 
        error: 'Failed to fetch settings',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  },

  /**
   * 特定の設定を更新
   */
  async updateSetting(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const { value, type = 'string' } = req.body;

      if (!key || value === undefined) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Both key and value are required' 
        });
      }

      const result = await settingsService.updateSetting(key, value, type);
      res.json(result);
    } catch (error) {
      console.error('Error in updateSetting:', error);
      res.status(500).json({ 
        error: 'Failed to update setting',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  },

  /**
   * 複数の設定を一括更新
   */
  async updateSettings(req: Request, res: Response) {
    try {
      const settings = req.body;

      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ 
          error: 'Invalid settings data',
          message: 'Settings must be a valid object' 
        });
      }

      const result = await settingsService.updateSettings(settings);
      res.json(result);
    } catch (error) {
      console.error('Error in updateSettings:', error);
      res.status(500).json({ 
        error: 'Failed to update settings',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  },

  /**
   * 設定をデフォルトにリセット
   */
  async resetSettings(req: Request, res: Response) {
    try {
      const settings = await settingsService.resetSettings();
      res.json({
        success: true,
        message: 'Settings reset to default',
        settings
      });
    } catch (error) {
      console.error('Error in resetSettings:', error);
      res.status(500).json({ 
        error: 'Failed to reset settings',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  },
};