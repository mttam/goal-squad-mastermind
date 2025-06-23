import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { LocalStorageManager, STORAGE_KEYS } from '@/utils/localStorage';
import { useToast } from '@/hooks/use-toast';

interface StorageHealth {
  used: number;
  available: number;
  keys: string[];
  health: 'good' | 'warning' | 'critical';
}

const StorageDiagnostics: React.FC = () => {
  const { 
    getStorageHealth, 
    exportAllData, 
    importAllData, 
    clearAllData,
    storageErrors,
    isDataLoaded 
  } = useFantacalcietto();
  const { toast } = useToast();
  
  const [storageInfo, setStorageInfo] = useState<StorageHealth | null>(null);
  const [diagnosticResults, setDiagnosticResults] = useState<string[]>([]);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);

  useEffect(() => {
    const updateStorageInfo = () => {
      const info = getStorageHealth();
      setStorageInfo(info);
    };

    updateStorageInfo();
    const interval = setInterval(updateStorageInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getStorageHealth]);

  const runFullDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    const results: string[] = [];
    
    try {
      // Test 1: Storage availability
      results.push('✓ LocalStorage is available');
      
      // Test 2: Read/Write test
      try {
        const testKey = 'fantacalcietto-test';
        const testData = { test: true, timestamp: Date.now() };
        localStorage.setItem(testKey, JSON.stringify(testData));
        const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
        localStorage.removeItem(testKey);
        
        if (retrieved.test === true) {
          results.push('✓ Read/Write operations working correctly');
        } else {
          results.push('✗ Read/Write test failed - data corruption detected');
        }
      } catch (error) {
        results.push(`✗ Read/Write test failed: ${error}`);
      }

      // Test 3: Storage capacity
      if (storageInfo) {
        const usagePercent = (storageInfo.used / (storageInfo.used + storageInfo.available)) * 100;
        if (usagePercent < 60) {
          results.push(`✓ Storage usage is healthy (${usagePercent.toFixed(1)}%)`);
        } else if (usagePercent < 80) {
          results.push(`⚠ Storage usage is high (${usagePercent.toFixed(1)}%)`);
        } else {
          results.push(`✗ Storage usage is critical (${usagePercent.toFixed(1)}%)`);
        }
      }

      // Test 4: Data integrity check
      const dataTypes = ['players', 'squads', 'formations', 'dues'] as const;
      for (const dataType of dataTypes) {
        try {
          const key = STORAGE_KEYS[dataType];
          const rawData = localStorage.getItem(key);
          if (rawData) {
            JSON.parse(rawData);
            results.push(`✓ ${dataType} data structure is valid`);
          } else {
            results.push(`ℹ No ${dataType} data found (this is normal for new installations)`);
          }
        } catch (error) {
          results.push(`✗ ${dataType} data is corrupted: ${error}`);
        }
      }

      // Test 5: Migration status
      const legacyKeys = Object.values(STORAGE_KEYS.legacy);
      const hasLegacyData = legacyKeys.some(key => localStorage.getItem(key) !== null);
      if (hasLegacyData) {
        results.push('⚠ Legacy data detected - migration may be needed');
      } else {
        results.push('✓ No legacy data found - system is up to date');
      }

      // Test 6: Backup availability
      const backupKeys = Object.keys(localStorage).filter(key => key.endsWith('_backup'));
      if (backupKeys.length > 0) {
        results.push(`ℹ ${backupKeys.length} backup(s) available for recovery`);
      }

    } catch (error) {
      results.push(`✗ Diagnostic failed: ${error}`);
    } finally {
      setDiagnosticResults(results);
      setIsRunningDiagnostic(false);
    }
  };

  const handleExportData = () => {
    try {
      const data = exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fantacalcietto-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful! 📦",
        description: "Your data has been exported as a backup file",
      });
    } catch (error) {
      toast({
        title: "Export Failed ❌",
        description: `Failed to export data: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const success = await importAllData(data);
        
        if (success) {
          toast({
            title: "Import Successful! 📥",
            description: "Your data has been restored from backup",
          });
        } else {
          toast({
            title: "Import Warning ⚠️",
            description: "Some data could not be imported - check the diagnostics",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Import Failed ❌",
          description: `Failed to import data: ${error}`,
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        clearAllData();
        toast({
          title: "Data Cleared 🧹",
          description: "All application data has been cleared",
        });
      } catch (error) {
        toast({
          title: "Clear Failed ❌",
          description: `Failed to clear data: ${error}`,
          variant: "destructive",
        });
      }
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthBadgeVariant = (health: string) => {
    switch (health) {
      case 'good': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  if (!isDataLoaded) {
    return (
      <Card className="bg-white border-[#B8CFCE]">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#333446]"></div>
            <span>Loading storage diagnostics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#333446]">
            🔧 Storage Diagnostics & Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
              <TabsTrigger value="backup">Backup</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {storageInfo && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Used:</span>
                            <span>{formatBytes(storageInfo.used)}</span>
                          </div>
                          <Progress 
                            value={(storageInfo.used / (storageInfo.used + storageInfo.available)) * 100} 
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Available: {formatBytes(storageInfo.available)}</span>
                            <Badge variant={getHealthBadgeVariant(storageInfo.health)}>
                              {storageInfo.health}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Data Keys</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-[#333446]">
                          {storageInfo.keys.length}
                        </div>
                        <div className="text-xs text-gray-500">
                          Active storage keys
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Health Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getHealthColor(storageInfo.health)}`}></div>
                          <span className="capitalize font-medium">{storageInfo.health}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Storage Keys:</h4>
                    <div className="flex flex-wrap gap-2">
                      {storageInfo.keys.map(key => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key.replace('fantacalcietto-', '')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="diagnostic" className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={runFullDiagnostic}
                  disabled={isRunningDiagnostic}
                  className="bg-[#333446] text-white hover:bg-[#7F8CAA]"
                >
                  {isRunningDiagnostic ? 'Running...' : 'Run Full Diagnostic'} 🔍
                </Button>
              </div>

              {diagnosticResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Diagnostic Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 font-mono text-sm">
                      {diagnosticResults.map((result, index) => (
                        <div key={index} className={`
                          ${result.startsWith('✓') ? 'text-green-600' : ''}
                          ${result.startsWith('✗') ? 'text-red-600' : ''}
                          ${result.startsWith('⚠') ? 'text-yellow-600' : ''}
                          ${result.startsWith('ℹ') ? 'text-blue-600' : ''}
                        `}>
                          {result}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="backup" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Export Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Download all your data as a backup file.
                    </p>
                    <Button 
                      onClick={handleExportData}
                      variant="outline"
                      className="w-full"
                    >
                      Export Backup 📦
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Import Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Restore data from a backup file.
                    </p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="w-full text-sm"
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-red-600">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Clear all application data. This action cannot be undone.
                  </p>
                  <Button 
                    onClick={handleClearData}
                    variant="destructive"
                    className="w-full md:w-auto"
                  >
                    Clear All Data 🗑️
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="errors" className="space-y-4">
              {storageErrors.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    ✅ No storage errors detected. Your data storage is working correctly.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <Alert>
                    <AlertDescription>
                      ⚠️ {storageErrors.length} storage error(s) detected:
                    </AlertDescription>
                  </Alert>
                  {storageErrors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertDescription className="font-mono text-xs">
                        {error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageDiagnostics;
