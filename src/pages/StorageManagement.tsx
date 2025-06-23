import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StorageDiagnostics from '@/components/StorageDiagnostics';
import { LocalStorageTestRunner, TestSuite, runQuickTests } from '@/utils/localStorageTests';
import { useToast } from '@/hooks/use-toast';

const StorageManagement = () => {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<TestSuite[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testReport, setTestReport] = useState<string>('');

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const suites = await LocalStorageTestRunner.runAllTests();
      setTestResults(suites);
      
      const report = LocalStorageTestRunner.generateReport(suites);
      setTestReport(report);
      
      const allPassed = suites.every(suite => suite.overallSuccess);
      toast({
        title: allPassed ? "All Tests Passed! ✅" : "Some Tests Failed ❌",
        description: `${suites.reduce((sum, s) => sum + s.tests.filter(t => t.success).length, 0)}/${suites.reduce((sum, s) => sum + s.tests.length, 0)} tests passed`,
        variant: allPassed ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Test Error ❌",
        description: `Failed to run tests: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleRunQuickTests = async () => {
    setIsRunningTests(true);
    try {
      const result = await runQuickTests();
      setTestReport(result.report);
      
      toast({
        title: result.success ? "Quick Tests Passed! ✅" : "Quick Tests Failed ❌",
        description: result.success ? "Basic localStorage functionality working" : "Issues detected in localStorage",
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Test Error ❌",
        description: `Failed to run quick tests: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const downloadReport = () => {
    if (!testReport) return;
    
    const blob = new Blob([testReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `localStorage-test-report-${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-[#333446]">Storage Management 🔧</h1>
        <p className="text-[#7F8CAA]">Diagnose, test, and manage localStorage functionality</p>
      </div>

      <Tabs defaultValue="diagnostics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostics" className="space-y-4">
          <StorageDiagnostics />
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card className="bg-white border-[#B8CFCE]">
            <CardHeader>
              <CardTitle className="text-[#333446]">LocalStorage Testing Suite 🧪</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handleRunQuickTests}
                  disabled={isRunningTests}
                  variant="outline"
                  className="text-[#333446] border-[#B8CFCE] hover:bg-[#EAEFEF]"
                >
                  {isRunningTests ? 'Running...' : 'Quick Test'} ⚡
                </Button>
                <Button 
                  onClick={handleRunTests}
                  disabled={isRunningTests}
                  className="bg-[#333446] text-white hover:bg-[#7F8CAA]"
                >
                  {isRunningTests ? 'Running...' : 'Full Test Suite'} 🔍
                </Button>
                {testReport && (
                  <Button 
                    onClick={downloadReport}
                    variant="outline"
                    className="text-[#333446] border-[#B8CFCE] hover:bg-[#EAEFEF]"
                  >
                    Download Report 📄
                  </Button>
                )}
              </div>

              {isRunningTests && (
                <Alert>
                  <AlertDescription>
                    🔄 Running localStorage tests... This may take a few moments.
                  </AlertDescription>
                </Alert>
              )}

              {testResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#333446]">Test Results</h3>
                  {testResults.map((suite, index) => (
                    <Card key={index} className="border-[#B8CFCE]">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-sm">
                          <span>{suite.name}</span>
                          <span className={`text-xs ${suite.overallSuccess ? 'text-green-600' : 'text-red-600'}`}>
                            {suite.tests.filter(t => t.success).length}/{suite.tests.length} passed
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {suite.tests.map((test, testIndex) => (
                            <div key={testIndex} className="flex items-center gap-2 text-sm">
                              <span className={test.success ? 'text-green-600' : 'text-red-600'}>
                                {test.success ? '✅' : '❌'}
                              </span>
                              <span className="flex-1">{test.name}</span>
                              <span className="text-xs text-gray-500">{test.duration}ms</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Total duration: {suite.totalDuration}ms
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {testReport && (
                <Card className="border-[#B8CFCE]">
                  <CardHeader>
                    <CardTitle className="text-sm">Test Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                      {testReport}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
          <Card className="bg-white border-[#B8CFCE]">
            <CardHeader>
              <CardTitle className="text-[#333446]">LocalStorage Implementation Guide 📚</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <h3>Current Implementation</h3>
                <p>
                  The Goal Squad Mastermind application uses an enhanced localStorage system with the following features:
                </p>
                
                <h4>🔧 Key Features</h4>
                <ul>
                  <li><strong>Automatic Backup:</strong> Creates backups before overwriting data</li>
                  <li><strong>Data Validation:</strong> Validates data structure before saving/loading</li>
                  <li><strong>Error Recovery:</strong> Automatic recovery from corrupted data using backups</li>
                  <li><strong>Legacy Migration:</strong> Seamless migration from old storage format</li>
                  <li><strong>Checksum Verification:</strong> Detects data corruption using checksums</li>
                  <li><strong>Quota Management:</strong> Handles storage quota exceeded errors</li>
                </ul>

                <h4>🗂️ Storage Keys</h4>
                <ul>
                  <li><code>fantacalcietto-players</code> - Player data with stats and rankings</li>
                  <li><code>fantacalcietto-squads</code> - Generated squad compositions</li>
                  <li><code>fantacalcietto-formations</code> - Match formations and setups</li>
                  <li><code>fantacalcietto-dues</code> - Payment tracking and dues</li>
                </ul>

                <h4>🔍 Error Handling</h4>
                <p>The system handles various error scenarios:</p>
                <ul>
                  <li><strong>Quota Exceeded:</strong> Automatically cleans up old backups</li>
                  <li><strong>Data Corruption:</strong> Falls back to backup data</li>
                  <li><strong>Parse Errors:</strong> Attempts legacy format parsing</li>
                  <li><strong>Validation Failures:</strong> Provides detailed error messages</li>
                </ul>

                <h4>📊 Monitoring</h4>
                <p>
                  Use the Diagnostics tab to monitor storage health, view usage statistics, 
                  and run integrity checks. The Testing tab provides comprehensive validation 
                  of localStorage functionality.
                </p>

                <h4>🔄 Data Recovery</h4>
                <p>
                  In case of data loss or corruption:
                </p>
                <ol>
                  <li>Check the Diagnostics tab for automatic recovery</li>
                  <li>Use the backup/restore functionality</li>
                  <li>Run the test suite to validate system integrity</li>
                  <li>Clear all data as a last resort (creates fresh start)</li>
                </ol>

                <h4>⚠️ Troubleshooting</h4>
                <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                  <p><strong>Common Issues:</strong></p>
                  <ul>
                    <li><strong>Storage Full:</strong> Export data and clear old entries</li>
                    <li><strong>Data Corruption:</strong> Check for browser issues or extensions</li>
                    <li><strong>Performance Issues:</strong> Large datasets may slow operations</li>
                  </ul>
                </div>

                <h4>🔧 Developer Notes</h4>
                <p>
                  The localStorage utility supports TypeScript with full type safety, 
                  comprehensive error handling, and extensive testing capabilities. 
                  All operations are logged for debugging purposes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StorageManagement;
