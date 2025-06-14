
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { Player } from '@/types/fantacalcietto';
import { useToast } from '@/hooks/use-toast';

const Upload = () => {
  const { setPlayers, players } = useFantacalcietto();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return data;
  };

  const validatePlayerData = (data: any[]): Player[] => {
    const validPlayers: Player[] = [];
    const validPositions = ['GK', 'DEF', 'MID', 'ATT'];

    data.forEach((row, index) => {
      try {
        const name = row.name || row.playername;
        const position = (row.position || '').toUpperCase();
        const goals = parseInt(row.goals || '0');
        const assists = parseInt(row.assists || '0');
        const saves = parseInt(row.saves || '0');
        const defenderVoting = parseFloat(row.defendervoting || row.defenderrating || '1');

        if (!name || !validPositions.includes(position)) {
          throw new Error(`Invalid data at row ${index + 2}`);
        }

        validPlayers.push({
          id: `upload-${Date.now()}-${index}`,
          name,
          position: position as 'GK' | 'DEF' | 'MID' | 'ATT',
          goals: isNaN(goals) ? 0 : goals,
          assists: isNaN(assists) ? 0 : assists,
          saves: isNaN(saves) ? 0 : saves,
          defenderVoting: isNaN(defenderVoting) ? 1 : Math.max(1, Math.min(10, defenderVoting)),
        });
      } catch (error) {
        console.warn(`Skipping invalid row ${index + 2}:`, error);
      }
    });

    return validPlayers;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type ❌",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const text = await file.text();
      const csvData = parseCSV(text);
      
      if (csvData.length === 0) {
        throw new Error('No valid data found in CSV');
      }

      const newPlayers = validatePlayerData(csvData);
      
      if (newPlayers.length === 0) {
        throw new Error('No valid player data found');
      }

      // Merge with existing players (update existing or add new)
      const updatedPlayers = [...players];
      let addedCount = 0;
      let updatedCount = 0;

      newPlayers.forEach(newPlayer => {
        const existingIndex = updatedPlayers.findIndex(p => p.name === newPlayer.name);
        if (existingIndex >= 0) {
          updatedPlayers[existingIndex] = { ...updatedPlayers[existingIndex], ...newPlayer };
          updatedCount++;
        } else {
          updatedPlayers.push(newPlayer);
          addedCount++;
        }
      });

      setPlayers(updatedPlayers);

      toast({
        title: "Upload Successful! ✅",
        description: `Added ${addedCount} new players, updated ${updatedCount} existing players`,
      });

    } catch (error) {
      toast({
        title: "Upload Failed ❌",
        description: error instanceof Error ? error.message : "Failed to process CSV file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      'Name,Position,Goals,Assists,Saves,DefenderVoting',
      'Mario Rossi,ATT,15,8,2,7',
      'Luca Bianchi,MID,10,12,5,6',
      'Marco Ferrari,DEF,3,6,15,9',
      'Giuseppe Romano,GK,0,2,45,5',
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_players_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sample Downloaded! 📄",
      description: "Use this template for your player data",
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-[#333446]">Upload Data 📤</h1>
        <p className="text-[#7F8CAA]">Import player data and update rankings from CSV files</p>
      </div>

      {/* Upload Instructions */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#333446]">
            📋 Upload Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-[#333446]">Required CSV Format:</h3>
              <ul className="space-y-1 text-sm text-[#7F8CAA]">
                <li>• <strong>Name:</strong> Player full name</li>
                <li>• <strong>Position:</strong> GK, DEF, MID, or ATT</li>
                <li>• <strong>Goals:</strong> Number of goals scored</li>
                <li>• <strong>Assists:</strong> Number of assists</li>
                <li>• <strong>Saves:</strong> Number of saves/rescues</li>
                <li>• <strong>DefenderVoting:</strong> Rating from 1-10</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-[#333446]">Upload Rules:</h3>
              <ul className="space-y-1 text-sm text-[#7F8CAA]">
                <li>• CSV files only (.csv extension)</li>
                <li>• First row must contain headers</li>
                <li>• Existing players will be updated</li>
                <li>• New players will be added</li>
                <li>• Invalid rows will be skipped</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={downloadSampleCSV}
              variant="outline"
              className="text-[#333446] border-[#B8CFCE] hover:bg-[#EAEFEF]"
            >
              Download Sample CSV 📄
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#333446]">
            📤 Upload Player Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="border-[#B8CFCE]"
            />
          </div>
          
          {isUploading && (
            <div className="flex items-center gap-2 text-[#7F8CAA]">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#333446]"></div>
              <span>Processing CSV file...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Data Summary */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="text-[#333446]">Current Database 📊</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-[#EAEFEF]">
              <div className="text-2xl font-bold text-[#333446]">{players.length}</div>
              <div className="text-sm text-[#7F8CAA]">Total Players</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-[#EAEFEF]">
              <div className="text-2xl font-bold text-[#333446]">
                {players.filter(p => p.position === 'GK').length}
              </div>
              <div className="text-sm text-[#7F8CAA]">Goalkeepers</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-[#EAEFEF]">
              <div className="text-2xl font-bold text-[#333446]">
                {players.filter(p => p.position === 'DEF').length}
              </div>
              <div className="text-sm text-[#7F8CAA]">Defenders</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-[#EAEFEF]">
              <div className="text-2xl font-bold text-[#333446]">
                {players.filter(p => ['MID', 'ATT'].includes(p.position)).length}
              </div>
              <div className="text-sm text-[#7F8CAA]">Mid/Attackers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Current Top Players */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="text-[#333446]">Top Players Preview 🌟</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium text-[#333446] mb-2">🥅 Top Scorers</h3>
              <div className="space-y-1">
                {players
                  .sort((a, b) => b.goals - a.goals)
                  .slice(0, 3)
                  .map((player, index) => (
                    <div key={player.id} className="flex justify-between text-sm">
                      <span className="text-[#7F8CAA]">
                        {index + 1}. {player.name}
                      </span>
                      <span className="text-[#333446] font-medium">{player.goals}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-[#333446] mb-2">🎯 Top Assisters</h3>
              <div className="space-y-1">
                {players
                  .sort((a, b) => b.assists - a.assists)
                  .slice(0, 3)
                  .map((player, index) => (
                    <div key={player.id} className="flex justify-between text-sm">
                      <span className="text-[#7F8CAA]">
                        {index + 1}. {player.name}
                      </span>
                      <span className="text-[#333446] font-medium">{player.assists}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-[#333446] mb-2">🛡️ Top Defenders</h3>
              <div className="space-y-1">
                {players
                  .filter(p => p.position === 'DEF')
                  .sort((a, b) => b.defenderVoting - a.defenderVoting)
                  .slice(0, 3)
                  .map((player, index) => (
                    <div key={player.id} className="flex justify-between text-sm">
                      <span className="text-[#7F8CAA]">
                        {index + 1}. {player.name}
                      </span>
                      <span className="text-[#333446] font-medium">{player.defenderVoting}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;
