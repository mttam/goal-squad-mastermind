/**
 * localStorage Utility with Advanced Error Handling and Data Validation
 * Provides robust localStorage operations with recovery mechanisms
 */

export interface StorageConfig {
  version: string;
  timestamp: number;
  checksum?: string;
}

export interface StorageData<T> {
  data: T;
  config: StorageConfig;
}

// Storage keys used throughout the application
export const STORAGE_KEYS = {
  players: 'fantacalcietto-players',
  squads: 'fantacalcietto-squads', 
  formations: 'fantacalcietto-formations',
  dues: 'fantacalcietto-dues',
  goalkeepers: 'fantacalcietto-goalkeepers',
  // Legacy keys for migration
  legacy: {
    formations: 'fantacalcietto_formations',
    dues: 'fantacalcietto_dues',
    goalkeepers: 'fantacalcietto_goalkeepers'
  }
} as const;

export enum StorageError {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CORRUPTION_ERROR = 'CORRUPTION_ERROR',
  ACCESS_DENIED = 'ACCESS_DENIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: {
    type: StorageError;
    message: string;
    originalError?: Error;
  };
  recovered?: boolean;
}

// Simple checksum calculation for data integrity
function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// Validate data structure based on expected schema
function validateData<T>(data: any, validator?: (data: any) => data is T): boolean {
  if (!data) return false;
  
  // Basic validation - check if it's an object/array
  if (typeof data !== 'object') return false;
  
  // Custom validator if provided
  if (validator) {
    return validator(data);
  }
  
  return true;
}

/**
 * Enhanced localStorage operations with error handling and recovery
 */
export class LocalStorageManager {
  private static readonly VERSION = '1.0.0';
  private static readonly MAX_RETRIES = 3;
  private static readonly BACKUP_SUFFIX = '_backup';

  /**
   * Save data to localStorage with metadata and error handling
   */
  static save<T>(key: string, data: T, validator?: (data: any) => data is T): StorageResult<T> {
    try {
      const serializedData = JSON.stringify(data);
      const config: StorageConfig = {
        version: this.VERSION,
        timestamp: Date.now(),
        checksum: calculateChecksum(serializedData)
      };

      const storageData: StorageData<T> = {
        data,
        config
      };

      const finalData = JSON.stringify(storageData);
      
      // Check available space before saving
      const estimatedSize = new Blob([finalData]).size;
      if (estimatedSize > 5 * 1024 * 1024) { // 5MB warning
        console.warn(`Large data being saved to localStorage: ${(estimatedSize / 1024 / 1024).toFixed(2)}MB`);
      }

      // Create backup of existing data before overwriting
      this.createBackup(key);
      
      localStorage.setItem(key, finalData);
      
      return {
        success: true,
        data
      };

    } catch (error) {
      const storageError = this.categorizeError(error);
      
      // Attempt recovery strategies
      const recoveryResult = this.attemptRecovery(key, data, storageError);
      if (recoveryResult.success) {
        return recoveryResult;
      }

      return {
        success: false,
        error: {
          type: storageError,
          message: this.getErrorMessage(storageError, error),
          originalError: error instanceof Error ? error : new Error(String(error))
        }
      };
    }
  }

  /**
   * Load data from localStorage with validation and recovery
   */
  static load<T>(key: string, validator?: (data: any) => data is T): StorageResult<T> {
    try {
      const rawData = localStorage.getItem(key);
      
      if (!rawData) {
        // Try to load from backup
        const backupResult = this.loadFromBackup<T>(key, validator);
        if (backupResult.success) {
          return { ...backupResult, recovered: true };
        }
        
        return {
          success: false,
          error: {
            type: StorageError.UNKNOWN_ERROR,
            message: 'No data found in localStorage'
          }
        };
      }

      // Parse the storage wrapper
      let storageData: StorageData<T>;
      try {
        storageData = JSON.parse(rawData);
      } catch (parseError) {
        // Try legacy format (direct data without wrapper)
        const legacyResult = this.parseLegacyData<T>(rawData, validator);
        if (legacyResult.success) {
          // Migrate to new format
          this.save(key, legacyResult.data!, validator);
          return legacyResult;
        }
        throw parseError;
      }

      // Validate storage wrapper structure
      if (!storageData.data || !storageData.config) {
        throw new Error('Invalid storage data structure');
      }

      // Verify data integrity
      const dataString = JSON.stringify(storageData.data);
      const expectedChecksum = storageData.config.checksum;
      if (expectedChecksum && calculateChecksum(dataString) !== expectedChecksum) {
        console.warn('Data integrity check failed, attempting recovery...');
        const backupResult = this.loadFromBackup<T>(key, validator);
        if (backupResult.success) {
          return { ...backupResult, recovered: true };
        }
        throw new Error('Data corruption detected');
      }

      // Validate data content
      if (!validateData(storageData.data, validator)) {
        throw new Error('Data validation failed');
      }

      return {
        success: true,
        data: storageData.data
      };

    } catch (error) {
      const storageError = this.categorizeError(error);
      
      // Try backup recovery
      const backupResult = this.loadFromBackup<T>(key, validator);
      if (backupResult.success) {
        return { ...backupResult, recovered: true };
      }

      return {
        success: false,
        error: {
          type: storageError,
          message: this.getErrorMessage(storageError, error),
          originalError: error instanceof Error ? error : new Error(String(error))
        }
      };
    }
  }

  /**
   * Parse legacy data format for backward compatibility
   */
  private static parseLegacyData<T>(rawData: string, validator?: (data: any) => data is T): StorageResult<T> {
    try {
      const legacyData = JSON.parse(rawData);
      
      if (!validateData(legacyData, validator)) {
        throw new Error('Legacy data validation failed');
      }

      return {
        success: true,
        data: legacyData
      };
    } catch {
      return {
        success: false,
        error: {
          type: StorageError.PARSE_ERROR,
          message: 'Failed to parse legacy data format'
        }
      };
    }
  }

  /**
   * Create backup of existing data
   */
  private static createBackup(key: string): void {
    try {
      const existingData = localStorage.getItem(key);
      if (existingData) {
        localStorage.setItem(key + this.BACKUP_SUFFIX, existingData);
      }
    } catch (error) {
      console.warn('Failed to create backup for key:', key, error);
    }
  }

  /**
   * Load data from backup
   */
  private static loadFromBackup<T>(key: string, validator?: (data: any) => data is T): StorageResult<T> {
    try {
      const backupKey = key + this.BACKUP_SUFFIX;
      const backupData = localStorage.getItem(backupKey);
      
      if (!backupData) {
        return {
          success: false,
          error: {
            type: StorageError.UNKNOWN_ERROR,
            message: 'No backup data available'
          }
        };
      }

      // Parse backup data
      const parsedBackup = JSON.parse(backupData);
      
      // If backup is in new format
      if (parsedBackup.data && parsedBackup.config) {
        if (validateData(parsedBackup.data, validator)) {
          return {
            success: true,
            data: parsedBackup.data
          };
        }
      }
      
      // If backup is in legacy format
      if (validateData(parsedBackup, validator)) {
        return {
          success: true,
          data: parsedBackup
        };
      }

      return {
        success: false,
        error: {
          type: StorageError.VALIDATION_ERROR,
          message: 'Backup data validation failed'
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: {
          type: StorageError.PARSE_ERROR,
          message: 'Failed to parse backup data'
        }
      };
    }
  }

  /**
   * Attempt various recovery strategies
   */
  private static attemptRecovery<T>(key: string, data: T, errorType: StorageError): StorageResult<T> {
    switch (errorType) {
      case StorageError.QUOTA_EXCEEDED:
        return this.handleQuotaExceeded(key, data);
      
      case StorageError.ACCESS_DENIED:
        // Try after a small delay
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(this.save(key, data));
          }, 100);
        }) as any; // Type assertion for synchronous API
        
      default:
        return {
          success: false,
          error: {
            type: errorType,
            message: 'Recovery failed'
          }
        };
    }
  }

  /**
   * Handle quota exceeded errors
   */
  private static handleQuotaExceeded<T>(key: string, data: T): StorageResult<T> {
    try {
      // Try to clear old backups first
      this.clearOldBackups();
      
      // Try saving again
      return this.save(key, data);
      
    } catch (error) {
      return {
        success: false,
        error: {
          type: StorageError.QUOTA_EXCEEDED,
          message: 'Storage quota exceeded and cleanup failed'
        }
      };
    }
  }

  /**
   * Clear old backup data to free up space
   */
  private static clearOldBackups(): void {
    try {
      const keys = Object.keys(localStorage);
      const backupKeys = keys.filter(key => key.endsWith(this.BACKUP_SUFFIX));
      
      // Remove oldest backups first
      backupKeys.forEach(backupKey => {
        try {
          localStorage.removeItem(backupKey);
        } catch (error) {
          console.warn('Failed to remove backup:', backupKey, error);
        }
      });
    } catch (error) {
      console.warn('Failed to clear old backups:', error);
    }
  }

  /**
   * Categorize errors for better handling
   */
  private static categorizeError(error: any): StorageError {
    if (!error) return StorageError.UNKNOWN_ERROR;
    
    const message = error.message || error.toString();
    
    if (message.includes('QuotaExceededError') || message.includes('quota')) {
      return StorageError.QUOTA_EXCEEDED;
    }
    
    if (message.includes('SecurityError') || message.includes('access')) {
      return StorageError.ACCESS_DENIED;
    }
    
    if (message.includes('JSON') || message.includes('parse')) {
      return StorageError.PARSE_ERROR;
    }
    
    if (message.includes('validation') || message.includes('corrupt')) {
      return StorageError.VALIDATION_ERROR;
    }
    
    return StorageError.UNKNOWN_ERROR;
  }

  /**
   * Get user-friendly error messages
   */
  private static getErrorMessage(errorType: StorageError, originalError: any): string {
    const messages = {
      [StorageError.QUOTA_EXCEEDED]: 'Storage space is full. Please clear some data or export your information.',
      [StorageError.PARSE_ERROR]: 'Data format is corrupted. Attempting to recover from backup.',
      [StorageError.VALIDATION_ERROR]: 'Data structure is invalid. This may indicate corruption.',
      [StorageError.CORRUPTION_ERROR]: 'Data corruption detected. Recovering from backup.',
      [StorageError.ACCESS_DENIED]: 'Access to storage is denied. This may be due to browser security settings.',
      [StorageError.UNKNOWN_ERROR]: 'An unexpected error occurred while accessing storage.'
    };
    
    return messages[errorType] || 'Unknown storage error occurred.';
  }

  /**
   * Get storage statistics and health info
   */
  static getStorageInfo(): {
    used: number;
    available: number;
    keys: string[];
    health: 'good' | 'warning' | 'critical';
  } {
    try {
      let used = 0;
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        used += (localStorage.getItem(key) || '').length;
      });
      
      // Estimate available space (localStorage limit is typically 5-10MB)
      const estimated_limit = 5 * 1024 * 1024; // 5MB
      const available = Math.max(0, estimated_limit - used);
      
      let health: 'good' | 'warning' | 'critical' = 'good';
      if (used > estimated_limit * 0.8) health = 'critical';
      else if (used > estimated_limit * 0.6) health = 'warning';
      
      return {
        used,
        available,
        keys: keys.filter(key => key.startsWith('fantacalcietto')),
        health
      };
      
    } catch (error) {
      return {
        used: 0,
        available: 0,
        keys: [],
        health: 'critical'
      };
    }
  }

  /**
   * Migrate data from legacy keys to new format
   */
  static migrateFromLegacy(): { migrated: string[], errors: string[] } {
    const migrated: string[] = [];
    const errors: string[] = [];
    
    const migrations = [
      { from: STORAGE_KEYS.legacy.formations, to: STORAGE_KEYS.formations },
      { from: STORAGE_KEYS.legacy.dues, to: STORAGE_KEYS.dues },
      { from: STORAGE_KEYS.legacy.goalkeepers, to: STORAGE_KEYS.goalkeepers }
    ];
    
    migrations.forEach(({ from, to }) => {
      try {
        const legacyData = localStorage.getItem(from);
        if (legacyData) {
          // Parse and re-save in new format
          const parsedData = JSON.parse(legacyData);
          const result = this.save(to, parsedData);
          
          if (result.success) {
            localStorage.removeItem(from); // Remove legacy key
            migrated.push(`${from} → ${to}`);
          } else {
            errors.push(`Failed to migrate ${from}: ${result.error?.message}`);
          }
        }
      } catch (error) {
        errors.push(`Error migrating ${from}: ${error}`);
      }
    });
    
    return { migrated, errors };
  }

  /**
   * Clear all application data
   */
  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      if (typeof key === 'string') {
        localStorage.removeItem(key);
        localStorage.removeItem(key + this.BACKUP_SUFFIX);
      } else {
        Object.values(key).forEach(legacyKey => {
          localStorage.removeItem(legacyKey);
          localStorage.removeItem(legacyKey + this.BACKUP_SUFFIX);
        });
      }
    });
  }
}

// Type guards for data validation
export const DataValidators = {
  isPlayer: (data: any): data is any => {
    return data && 
           typeof data.id === 'string' &&
           typeof data.name === 'string' &&
           ['GK', 'DEF', 'MID', 'ATT'].includes(data.position) &&
           typeof data.goals === 'number' &&
           typeof data.assists === 'number' &&
           typeof data.saves === 'number' &&
           typeof data.defenderVoting === 'number';
  },
  
  isPlayersArray: (data: any): data is any[] => {
    return Array.isArray(data) && data.every(DataValidators.isPlayer);
  },
  
  isSquad: (data: any): data is any => {
    return data &&
           typeof data.id === 'string' &&
           typeof data.name === 'string' &&
           Array.isArray(data.players) &&
           ['5vs5', '6vs6', '7vs7', '8vs8'].includes(data.mode) &&
           data.createdAt;
  },
  
  isSquadsArray: (data: any): data is any[] => {
    return Array.isArray(data) && data.every(DataValidators.isSquad);
  },
  
  isFormation: (data: any): data is any => {
    return data &&
           typeof data.id === 'string' &&
           typeof data.name === 'string' &&
           ['5vs5', '6vs6', '7vs7', '8vs8'].includes(data.mode) &&
           Array.isArray(data.teamA) &&
           Array.isArray(data.teamB) &&
           data.createdAt;
  },
  
  isFormationsArray: (data: any): data is any[] => {
    return Array.isArray(data) && data.every(DataValidators.isFormation);
  },
  
  isDue: (data: any): data is any => {
    return data &&
           typeof data.id === 'string' &&
           typeof data.playerName === 'string' &&
           typeof data.amount === 'number' &&
           typeof data.description === 'string' &&
           typeof data.paid === 'boolean' &&
           data.date;
  },
  
  isDuesArray: (data: any): data is any[] => {
    return Array.isArray(data) && data.every(DataValidators.isDue);
  }
};
