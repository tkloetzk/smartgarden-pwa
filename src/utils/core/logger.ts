/**
 * Centralized logging utility for the SmartGarden application
 * Provides different log levels and conditional logging based on environment
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export class Logger {
  private static isDev = process.env.NODE_ENV === 'development';
  private static isTest = process.env.NODE_ENV === 'test';

  /**
   * Debug logging - only shows in development
   */
  static debug(message: string, ...args: any[]) {
    if (this.isDev && !this.isTest) {
      console.log(`🔍 ${message}`, ...args);
    }
  }

  /**
   * Info logging - shows in development and production
   */
  static info(message: string, ...args: any[]) {
    if (!this.isTest) {
      console.info(`ℹ️ ${message}`, ...args);
    }
  }

  /**
   * Warning logging - always shows except in tests
   */
  static warn(message: string, ...args: any[]) {
    if (!this.isTest) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }

  /**
   * Error logging - always shows
   */
  static error(message: string, ...args: any[]) {
    console.error(`❌ ${message}`, ...args);
  }

  /**
   * Growth stage specific logging with plant context
   */
  static growthStage(varietyName: string, message: string, ...args: any[]) {
    if (this.isDev && !this.isTest) {
      console.log(`🌱 [${varietyName}] ${message}`, ...args);
    }
  }

  /**
   * Database operation logging
   */
  static database(operation: string, message: string, ...args: any[]) {
    if (this.isDev && !this.isTest) {
      console.log(`💾 [${operation}] ${message}`, ...args);
    }
  }

  /**
   * Service operation logging
   */
  static service(serviceName: string, message: string, ...args: any[]) {
    if (this.isDev && !this.isTest) {
      console.log(`⚙️ [${serviceName}] ${message}`, ...args);
    }
  }
}