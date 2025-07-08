/**
 * Standardized error handling utilities for the SmartGarden application
 * Provides consistent error handling patterns across services and components
 */

import { Logger } from './logger';

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface ServiceError {
  message: string;
  code?: string;
  context?: string;
  originalError?: unknown;
}

/**
 * Centralized error handling class for services
 */
export class ServiceErrorHandler {
  /**
   * Execute a service operation with standardized error handling
   */
  static async execute<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<ServiceResult<T>> {
    try {
      const data = await operation();
      return { data, error: null, success: true };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      Logger.error(`Service error in ${context}`, { error: errorMessage, originalError: error });
      return { data: null, error: errorMessage, success: false };
    }
  }

  /**
   * Execute a service operation that returns a default value on error
   */
  static async executeWithDefault<T>(
    operation: () => Promise<T>,
    defaultValue: T,
    context: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      Logger.error(`Service error in ${context}, returning default`, { 
        error: errorMessage, 
        defaultValue,
        originalError: error 
      });
      return defaultValue;
    }
  }

  /**
   * Execute a synchronous operation with error handling
   */
  static executeSync<T>(
    operation: () => T,
    context: string
  ): ServiceResult<T> {
    try {
      const data = operation();
      return { data, error: null, success: true };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      Logger.error(`Sync operation error in ${context}`, { error: errorMessage, originalError: error });
      return { data: null, error: errorMessage, success: false };
    }
  }

  /**
   * Extract a user-friendly error message from various error types
   */
  private static extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
    }
    
    return 'An unknown error occurred';
  }

  /**
   * Create a standardized service error
   */
  static createError(
    message: string, 
    code?: string, 
    context?: string, 
    originalError?: unknown
  ): ServiceError {
    return {
      message,
      code,
      context,
      originalError,
    };
  }

  /**
   * Handle Firebase-specific errors with better error messages
   */
  static handleFirebaseError(error: unknown, context: string): string {
    const errorMessage = this.extractErrorMessage(error);
    
    // Map common Firebase errors to user-friendly messages
    const firebaseErrorMap: Record<string, string> = {
      'permission-denied': 'You do not have permission to perform this action',
      'not-found': 'The requested resource was not found',
      'already-exists': 'This resource already exists',
      'resource-exhausted': 'Service is temporarily unavailable',
      'unauthenticated': 'Please sign in to continue',
      'unavailable': 'Service is temporarily unavailable',
    };

    for (const [code, message] of Object.entries(firebaseErrorMap)) {
      if (errorMessage.includes(code)) {
        Logger.error(`Firebase error in ${context}`, { code, originalError: error });
        return message;
      }
    }

    Logger.error(`Firebase error in ${context}`, { error: errorMessage, originalError: error });
    return errorMessage;
  }
}

/**
 * Decorator function for automatic error handling in service methods
 */
export function withErrorHandling(context: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const fullContext = `${target.constructor.name}.${propertyName}`;
      return ServiceErrorHandler.execute(
        () => method.apply(this, args),
        context || fullContext
      );
    };
  };
}