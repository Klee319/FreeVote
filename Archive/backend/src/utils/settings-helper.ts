/**
 * 設定値取得用ヘルパー関数
 * アプリケーション全体で設定値を簡単に取得するためのユーティリティ
 */

import { settingsService } from '../services/settings.service';
import { logger } from './logger';

/**
 * ページネーション設定の取得
 */
export async function getPaginationSettings() {
  try {
    const [defaultPageSize, maxPageSize] = await Promise.all([
      settingsService.getSettingValue('pagination.defaultPageSize', 20),
      settingsService.getSettingValue('pagination.maxPageSize', 100)
    ]);
    
    return {
      defaultPageSize,
      maxPageSize
    };
  } catch (error) {
    logger.error('ページネーション設定の取得に失敗:', error);
    return {
      defaultPageSize: 20,
      maxPageSize: 100
    };
  }
}

/**
 * グラフ設定の取得
 */
export async function getChartSettings() {
  try {
    const [maxDataPoints, defaultColors, animationDuration] = await Promise.all([
      settingsService.getSettingValue('chart.maxDataPoints', 50),
      settingsService.getSettingValue('chart.defaultColors', ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']),
      settingsService.getSettingValue('chart.animationDuration', 300)
    ]);
    
    return {
      maxDataPoints,
      defaultColors,
      animationDuration
    };
  } catch (error) {
    logger.error('グラフ設定の取得に失敗:', error);
    return {
      maxDataPoints: 50,
      defaultColors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      animationDuration: 300
    };
  }
}

/**
 * 投票設定の取得
 */
export async function getVoteSettings() {
  try {
    const [allowAnonymous, requireLocation, maxVotesPerDay] = await Promise.all([
      settingsService.getSettingValue('vote.allowAnonymous', true),
      settingsService.getSettingValue('vote.requireLocation', false),
      settingsService.getSettingValue('vote.maxVotesPerDay', 100)
    ]);
    
    return {
      allowAnonymous,
      requireLocation,
      maxVotesPerDay
    };
  } catch (error) {
    logger.error('投票設定の取得に失敗:', error);
    return {
      allowAnonymous: true,
      requireLocation: false,
      maxVotesPerDay: 100
    };
  }
}

/**
 * ランキング設定の取得
 */
export async function getRankingSettings() {
  try {
    const [defaultLimit, cacheTime] = await Promise.all([
      settingsService.getSettingValue('ranking.defaultLimit', 10),
      settingsService.getSettingValue('ranking.cacheTime', 300)
    ]);
    
    return {
      defaultLimit,
      cacheTime
    };
  } catch (error) {
    logger.error('ランキング設定の取得に失敗:', error);
    return {
      defaultLimit: 10,
      cacheTime: 300
    };
  }
}

/**
 * 統計設定の取得
 */
export async function getStatsSettings() {
  try {
    const [minVotesForDisplay, percentagePrecision] = await Promise.all([
      settingsService.getSettingValue('stats.minVotesForDisplay', 5),
      settingsService.getSettingValue('stats.percentagePrecision', 1)
    ]);
    
    return {
      minVotesForDisplay,
      percentagePrecision
    };
  } catch (error) {
    logger.error('統計設定の取得に失敗:', error);
    return {
      minVotesForDisplay: 5,
      percentagePrecision: 1
    };
  }
}

/**
 * 地図設定の取得
 */
export async function getMapSettings() {
  try {
    const [defaultZoom, centerLatitude, centerLongitude] = await Promise.all([
      settingsService.getSettingValue('map.defaultZoom', 5),
      settingsService.getSettingValue('map.centerLatitude', 36.2048),
      settingsService.getSettingValue('map.centerLongitude', 138.2529)
    ]);
    
    return {
      defaultZoom,
      centerLatitude,
      centerLongitude
    };
  } catch (error) {
    logger.error('地図設定の取得に失敗:', error);
    return {
      defaultZoom: 5,
      centerLatitude: 36.2048,
      centerLongitude: 138.2529
    };
  }
}

/**
 * システム設定の取得
 */
export async function getSystemSettings() {
  try {
    const [maintenanceMode, debugMode, logLevel] = await Promise.all([
      settingsService.getSettingValue('system.maintenanceMode', false),
      settingsService.getSettingValue('system.debugMode', false),
      settingsService.getSettingValue('system.logLevel', 'info')
    ]);
    
    return {
      maintenanceMode,
      debugMode,
      logLevel
    };
  } catch (error) {
    logger.error('システム設定の取得に失敗:', error);
    return {
      maintenanceMode: false,
      debugMode: false,
      logLevel: 'info'
    };
  }
}

/**
 * API設定の取得
 */
export async function getApiSettings() {
  try {
    const [requestTimeout, sessionTimeout] = await Promise.all([
      settingsService.getSettingValue('api.requestTimeout', 30000),
      settingsService.getSettingValue('session.timeout', 86400000)
    ]);
    
    return {
      requestTimeout,
      sessionTimeout
    };
  } catch (error) {
    logger.error('API設定の取得に失敗:', error);
    return {
      requestTimeout: 30000,
      sessionTimeout: 86400000
    };
  }
}