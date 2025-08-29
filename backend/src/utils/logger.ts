import winston from 'winston';
import path from 'path';

/**
 * ログレベルの定義
 */
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * ログレベルごとの色設定
 */
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// カスタムフォーマットの作成
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// 開発環境用のフォーマット
const devFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  }),
);

// 環境変数からログレベルを取得
const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// トランスポートの設定
const transports: winston.transport[] = [];

// コンソール出力
if (process.env.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? customFormat : devFormat,
    }),
  );
}

// 本番環境ではファイル出力も追加
if (process.env.NODE_ENV === 'production') {
  // エラーログ
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );

  // 全てのログ
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );
}

// Winstonロガーのインスタンスを作成
export const logger = winston.createLogger({
  level,
  levels: logLevels,
  format: customFormat,
  transports,
  exitOnError: false,
});

// カラー設定を追加
winston.addColors(logColors);

// HTTPリクエストログ用のストリーム
export const httpLogStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};