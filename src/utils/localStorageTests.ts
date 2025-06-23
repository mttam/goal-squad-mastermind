/**
 * LocalStorage Testing Utilities
 * Comprehensive test suite for localStorage functionality
 */

import { LocalStorageManager, STORAGE_KEYS, DataValidators, StorageError } from './localStorage';
import { Player, Squad, Formation, Due } from '@/types/fantacalcietto';

export interface TestResult {
  name: string;
  success: boolean;
  message: string;
  duration: number;
  error?: Error;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  overallSuccess: boolean;
  totalDuration: number;
}

// Sample test data
const generateTestPlayer = (id: string = 'test-player-1'): Player => ({
  id,
  name: 'Test Player',
  position: 'MID',
  goals: 5,
  assists: 3,
  saves: 0,
  defenderVoting: 7.5
});

const generateTestSquad = (id: string = 'test-squad-1'): Squad => ({
  id,
  name: 'Test Squad',
  players: [generateTestPlayer('p1'), generateTestPlayer('p2')],
  mode: '5vs5',
  createdAt: new Date()
});

const generateTestFormation = (id: string = 'test-formation-1'): Formation => ({
  id,
  name: 'Test Formation',
  mode: '5vs5',
  teamA: [generateTestPlayer('pa1'), generateTestPlayer('pa2')],
  teamB: [generateTestPlayer('pb1'), generateTestPlayer('pb2')],
  createdAt: new Date()
});

const generateTestDue = (id: string = 'test-due-1'): Due => ({
  id,
  playerName: 'Test Player',
  amount: 10.50,
  description: 'Test payment',
  paid: false,
  date: new Date()
});

/**
 * LocalStorage Test Runner
 */
export class LocalStorageTestRunner {
  private static testKey = 'fantacalcietto-test';
  
  /**
   * Run all localStorage tests
   */
  static async runAllTests(): Promise<TestSuite[]> {
    const suites: TestSuite[] = [];
    
    // Basic functionality tests
    suites.push(await this.runBasicTests());
    
    // Data validation tests
    suites.push(await this.runValidationTests());
    
    // Error handling tests
    suites.push(await this.runErrorHandlingTests());
    
    // Performance tests
    suites.push(await this.runPerformanceTests());
    
    // Recovery tests
    suites.push(await this.runRecoveryTests());
    
    return suites;
  }

  /**
   * Basic functionality tests
   */
  private static async runBasicTests(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const startTime = Date.now();

    // Test 1: Save and load simple data
    tests.push(await this.runTest('Save and Load Simple Data', async () => {
      const testData = { test: true, value: 42 };
      const saveResult = LocalStorageManager.save(this.testKey, testData);
      if (!saveResult.success) {
        throw new Error(`Save failed: ${saveResult.error?.message}`);
      }
      
      const loadResult = LocalStorageManager.load(this.testKey);      if (!loadResult.success || !loadResult.data) {
        throw new Error(`Load failed: ${loadResult.error?.message}`);
      }
      
      const data = loadResult.data as any;
      if (data.test !== true || data.value !== 42) {
        throw new Error('Data integrity check failed');
      }
      
      return 'Simple data save/load successful';
    }));

    // Test 2: Save and load Player data
    tests.push(await this.runTest('Save and Load Player Data', async () => {
      const testPlayer = generateTestPlayer();
      const saveResult = LocalStorageManager.save(this.testKey + '-player', testPlayer, DataValidators.isPlayer);
      if (!saveResult.success) {
        throw new Error(`Save failed: ${saveResult.error?.message}`);
      }
      
      const loadResult = LocalStorageManager.load(this.testKey + '-player', DataValidators.isPlayer);
      if (!loadResult.success || !loadResult.data) {
        throw new Error(`Load failed: ${loadResult.error?.message}`);
      }
      
      if (loadResult.data.name !== testPlayer.name) {
        throw new Error('Player data integrity check failed');
      }
      
      return 'Player data save/load successful';
    }));

    // Test 3: Save and load array data
    tests.push(await this.runTest('Save and Load Array Data', async () => {
      const testPlayers = [generateTestPlayer('p1'), generateTestPlayer('p2'), generateTestPlayer('p3')];
      const saveResult = LocalStorageManager.save(this.testKey + '-array', testPlayers, DataValidators.isPlayersArray);
      if (!saveResult.success) {
        throw new Error(`Save failed: ${saveResult.error?.message}`);
      }
      
      const loadResult = LocalStorageManager.load(this.testKey + '-array', DataValidators.isPlayersArray);
      if (!loadResult.success || !loadResult.data) {
        throw new Error(`Load failed: ${loadResult.error?.message}`);
      }
      
      if (loadResult.data.length !== 3) {
        throw new Error('Array length mismatch');
      }
      
      return 'Array data save/load successful';
    }));

    // Test 4: Override existing data
    tests.push(await this.runTest('Override Existing Data', async () => {
      const initialData = { version: 1 };
      const updatedData = { version: 2 };
      
      LocalStorageManager.save(this.testKey + '-override', initialData);
      LocalStorageManager.save(this.testKey + '-override', updatedData);
        const loadResult = LocalStorageManager.load(this.testKey + '-override');
      if (!loadResult.success || !loadResult.data) {
        throw new Error('Data override failed - no data found');
      }
      
      const data = loadResult.data as any;
      if (data.version !== 2) {
        throw new Error('Data override failed - wrong version');
      }
      
      return 'Data override successful';
    }));

    // Clean up test data
    this.cleanup();

    const totalDuration = Date.now() - startTime;
    return {
      name: 'Basic Functionality Tests',
      tests,
      overallSuccess: tests.every(t => t.success),
      totalDuration
    };
  }

  /**
   * Data validation tests
   */
  private static async runValidationTests(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const startTime = Date.now();

    // Test 1: Valid player data
    tests.push(await this.runTest('Valid Player Data Validation', async () => {
      const validPlayer = generateTestPlayer();
      if (!DataValidators.isPlayer(validPlayer)) {
        throw new Error('Valid player data failed validation');
      }
      return 'Valid player data passed validation';
    }));

    // Test 2: Invalid player data
    tests.push(await this.runTest('Invalid Player Data Validation', async () => {
      const invalidPlayer = { id: 'test', name: 'Test', position: 'INVALID' };
      if (DataValidators.isPlayer(invalidPlayer)) {
        throw new Error('Invalid player data passed validation');
      }
      return 'Invalid player data correctly rejected';
    }));

    // Test 3: Valid squad data
    tests.push(await this.runTest('Valid Squad Data Validation', async () => {
      const validSquad = generateTestSquad();
      if (!DataValidators.isSquad(validSquad)) {
        throw new Error('Valid squad data failed validation');
      }
      return 'Valid squad data passed validation';
    }));

    // Test 4: Array validation
    tests.push(await this.runTest('Array Data Validation', async () => {
      const validPlayers = [generateTestPlayer('p1'), generateTestPlayer('p2')];
      const invalidArray = [generateTestPlayer('p1'), { invalid: true }];
      
      if (!DataValidators.isPlayersArray(validPlayers)) {
        throw new Error('Valid players array failed validation');
      }
      
      if (DataValidators.isPlayersArray(invalidArray)) {
        throw new Error('Invalid players array passed validation');
      }
      
      return 'Array validation working correctly';
    }));

    const totalDuration = Date.now() - startTime;
    return {
      name: 'Data Validation Tests',
      tests,
      overallSuccess: tests.every(t => t.success),
      totalDuration
    };
  }

  /**
   * Error handling tests
   */
  private static async runErrorHandlingTests(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const startTime = Date.now();

    // Test 1: Load non-existent key
    tests.push(await this.runTest('Load Non-existent Key', async () => {
      const result = LocalStorageManager.load('non-existent-key');
      if (result.success) {
        throw new Error('Loading non-existent key should fail');
      }
      
      if (!result.error) {
        throw new Error('Error object should be present');
      }
      
      return 'Non-existent key correctly handled';
    }));

    // Test 2: Save invalid JSON data
    tests.push(await this.runTest('Save Circular Reference Data', async () => {
      const circularData: any = { name: 'test' };
      circularData.self = circularData; // Create circular reference
      
      const result = LocalStorageManager.save(this.testKey + '-circular', circularData);
      if (result.success) {
        throw new Error('Saving circular reference should fail');
      }
      
      return 'Circular reference correctly handled';
    }));

    // Test 3: Corrupted data handling
    tests.push(await this.runTest('Corrupted Data Handling', async () => {
      // Manually insert corrupted data
      localStorage.setItem(this.testKey + '-corrupted', '{"invalid": json}');
      
      const result = LocalStorageManager.load(this.testKey + '-corrupted');
      if (result.success) {
        throw new Error('Loading corrupted data should fail');
      }
      
      if (result.error?.type !== StorageError.PARSE_ERROR) {
        throw new Error('Should detect parse error');
      }
      
      return 'Corrupted data correctly handled';
    }));

    // Clean up
    this.cleanup();

    const totalDuration = Date.now() - startTime;
    return {
      name: 'Error Handling Tests',
      tests,
      overallSuccess: tests.every(t => t.success),
      totalDuration
    };
  }

  /**
   * Performance tests
   */
  private static async runPerformanceTests(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const startTime = Date.now();

    // Test 1: Large data save/load
    tests.push(await this.runTest('Large Data Performance', async () => {
      const startTime = Date.now();
      
      // Generate large dataset
      const largeData = Array.from({ length: 1000 }, (_, i) => generateTestPlayer(`player-${i}`));
      
      const saveResult = LocalStorageManager.save(this.testKey + '-large', largeData, DataValidators.isPlayersArray);
      if (!saveResult.success) {
        throw new Error('Failed to save large data');
      }
      
      const loadResult = LocalStorageManager.load(this.testKey + '-large', DataValidators.isPlayersArray);
      if (!loadResult.success || !loadResult.data || loadResult.data.length !== 1000) {
        throw new Error('Failed to load large data');
      }
      
      const duration = Date.now() - startTime;
      if (duration > 5000) { // 5 seconds
        throw new Error(`Performance too slow: ${duration}ms`);
      }
      
      return `Large data processed in ${duration}ms`;
    }));

    // Test 2: Multiple operations performance
    tests.push(await this.runTest('Multiple Operations Performance', async () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        const data = generateTestPlayer(`perf-player-${i}`);
        LocalStorageManager.save(`${this.testKey}-perf-${i}`, data);
        LocalStorageManager.load(`${this.testKey}-perf-${i}`);
      }
      
      const duration = Date.now() - startTime;
      if (duration > 3000) { // 3 seconds
        throw new Error(`Performance too slow: ${duration}ms`);
      }
      
      return `100 save/load operations completed in ${duration}ms`;
    }));

    // Clean up
    this.cleanup();

    const totalDuration = Date.now() - startTime;
    return {
      name: 'Performance Tests',
      tests,
      overallSuccess: tests.every(t => t.success),
      totalDuration
    };
  }

  /**
   * Recovery tests
   */
  private static async runRecoveryTests(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const startTime = Date.now();

    // Test 1: Backup creation and recovery
    tests.push(await this.runTest('Backup Creation and Recovery', async () => {
      const originalData = generateTestPlayer('backup-test');
      
      // Save original data
      LocalStorageManager.save(this.testKey + '-backup', originalData);
      
      // Verify backup was created by saving new data
      const newData = generateTestPlayer('backup-test-updated');
      LocalStorageManager.save(this.testKey + '-backup', newData);
      
      // Check if backup exists
      const backupData = localStorage.getItem(this.testKey + '-backup_backup');
      if (!backupData) {
        throw new Error('Backup was not created');
      }
      
      return 'Backup creation successful';
    }));

    // Test 2: Legacy data migration
    tests.push(await this.runTest('Legacy Data Migration', async () => {
      const legacyData = [generateTestFormation('legacy-1'), generateTestFormation('legacy-2')];
      
      // Save in legacy format
      localStorage.setItem(STORAGE_KEYS.legacy.formations, JSON.stringify(legacyData));
      
      // Attempt migration
      const migrationResult = LocalStorageManager.migrateFromLegacy();
      
      if (migrationResult.errors.length > 0) {
        throw new Error(`Migration errors: ${migrationResult.errors.join(', ')}`);
      }
      
      if (!migrationResult.migrated.some(m => m.includes('formations'))) {
        throw new Error('Formations migration not detected');
      }
      
      return `Migration successful: ${migrationResult.migrated.join(', ')}`;
    }));

    // Clean up
    this.cleanup();

    const totalDuration = Date.now() - startTime;
    return {
      name: 'Recovery Tests',
      tests,
      overallSuccess: tests.every(t => t.success),
      totalDuration
    };
  }

  /**
   * Run a single test with error handling and timing
   */
  private static async runTest(name: string, testFn: () => Promise<string>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const message = await testFn();
      return {
        name,
        success: true,
        message,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name,
        success: false,
        message: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Clean up test data
   */
  private static cleanup(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('test') || key.includes('perf') || key.includes('backup') || key.includes('circular') || key.includes('corrupted')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  /**
   * Generate comprehensive test report
   */
  static generateReport(suites: TestSuite[]): string {
    const totalTests = suites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const passedTests = suites.reduce((sum, suite) => sum + suite.tests.filter(t => t.success).length, 0);
    const totalDuration = suites.reduce((sum, suite) => sum + suite.totalDuration, 0);
    
    let report = '# LocalStorage Test Report\n\n';
    report += `**Overall Results:** ${passedTests}/${totalTests} tests passed (${((passedTests/totalTests)*100).toFixed(1)}%)\n`;
    report += `**Total Duration:** ${totalDuration}ms\n\n`;
    
    suites.forEach(suite => {
      const suitePassed = suite.tests.filter(t => t.success).length;
      report += `## ${suite.name}\n`;
      report += `**Results:** ${suitePassed}/${suite.tests.length} tests passed\n`;
      report += `**Duration:** ${suite.totalDuration}ms\n\n`;
      
      suite.tests.forEach(test => {
        const status = test.success ? '✅' : '❌';
        report += `${status} **${test.name}** (${test.duration}ms)\n`;
        report += `   ${test.message}\n`;
        if (test.error) {
          report += `   Error: ${test.error.message}\n`;
        }
        report += '\n';
      });
    });
    
    return report;
  }
}

/**
 * Quick test runner for development
 */
export const runQuickTests = async (): Promise<{ success: boolean; report: string }> => {
  try {
    const suites = await LocalStorageTestRunner.runAllTests();
    const report = LocalStorageTestRunner.generateReport(suites);
    const success = suites.every(suite => suite.overallSuccess);
    
    return { success, report };
  } catch (error) {
    return {
      success: false,
      report: `Test runner failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
