import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { useToast } from '@/hooks/use-toast';
import { Player } from '@/types/fantacalcietto';
import { useState, useRef } from 'react';
import DataExtractor from '@/components/DataExtractor';

const Upload = () => {
  const { addPlayer, players } = useFantacalcietto();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [playerData, setPlayerData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
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

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result.map(field => field.replace(/^"|"$/g, ''));
  };

  const validatePlayerData = (data: any[]): Player[] => {
    const validPlayers: Player[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      try {
        const name = row.name;
        const position = row.position?.toUpperCase();
        const goals = parseInt(row.goals) || 0;
        const assists = parseInt(row.assists) || 0;
        const saves = parseInt(row.saves) || 0;
        const defenderVoting = parseFloat(row.defendervoting) || 0;

        if (!name || !position) {
          errors.push(`Row ${index + 2}: Missing name or position`);
          return;
        }

        if (!['GK', 'DEF', 'MID', 'ATT'].includes(position)) {
          errors.push(`Row ${index + 2}: Invalid position "${position}". Must be GK, DEF, MID, or ATT`);
          return;
        }

        if (defenderVoting < 0 || defenderVoting > 10) {
          errors.push(`Row ${index + 2}: Defender voting must be between 0 and 10`);
          return;
        }

        const existingPlayer = players.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (existingPlayer) {
          errors.push(`Row ${index + 2}: Player "${name}" already exists`);
          return;
        }

        const player: Player = {
          id: `player-${Date.now()}-${index}`,
          name: name.trim(),
          position: position as 'GK' | 'DEF' | 'MID' | 'ATT',
          goals,
          assists,
          saves,
          defenderVoting,
        };

        validPlayers.push(player);
      } catch (error) {
        errors.push(`Row ${index + 2}: Failed to parse - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    if (errors.length > 0) {
      console.log('Validation errors:', errors);
    }

    return validPlayers;
  };

  const handleSubmit = () => {
    if (!playerData.trim()) {
      toast({
        title: "No Data Provided ⚠️",
        description: "Please enter player data in CSV format",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const csvData = parseCSV(playerData);
      
      if (csvData.length === 0) {
        throw new Error('No valid data found in CSV');
      }

      const newPlayers = validatePlayerData(csvData);
      
      if (newPlayers.length === 0) {
        throw new Error('No valid player data found');
      }

      newPlayers.forEach(player => addPlayer(player));

      toast({
        title: "Players Added Successfully! 🎉",
        description: `${newPlayers.length} player(s) added to the database`,
      });

      setPlayerData('');
    } catch (error) {
      toast({
        title: "Upload Failed ❌",
        description: error instanceof Error ? error.message : "Failed to process player data",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
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

      newPlayers.forEach(player => addPlayer(player));

      toast({
        title: "Players Uploaded Successfully! 📁",
        description: `${newPlayers.length} player(s) added from CSV file`,
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
      'Jacopo Di Donna,DEF,2,3,0,7.5',
      'Ciccio Gargiullo,MID,5,8,0,6.0',
      'Mattia Ambrosiano,ATT,12,4,0,0',
      'Francesco Castiglia,GK,0,0,15,8.0',
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
        <h1 className="text-3xl font-bold text-[#333446]">Upload Player Data 📤</h1>
        <p className="text-[#7F8CAA]">Add new players to your FantaCalcetto database</p>
      </div>

      {/* Data Extractor Section */}
      <DataExtractor />

      {/* Upload Player Data Section */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="text-[#333446]">Upload Player Data 📁</CardTitle>
          <p className="text-sm text-[#7F8CAA]">
            Upload players using CSV format with header row: Name, Position, Goals, Assists, Saves, DefenderVoting
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-[#EAEFEF] p-3 rounded-lg">
            <h4 className="font-medium text-[#333446] mb-2">Format Requirements:</h4>
            <ul className="text-sm text-[#7F8CAA] space-y-1">
              <li>• First row should be headers: Name,Position,Goals,Assists,Saves,DefenderVoting</li>
              <li>• Position: GK (Goalkeeper), DEF (Defender), MID (Midfielder), ATT (Attacker)</li>
              <li>• Goals, Assists, Saves: Numbers (0 or positive)</li>
              <li>• DefenderVoting: Number between 0 and 10 (can include decimals)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
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

          <div className="text-center text-[#7F8CAA]">or</div>

          <div className="space-y-2">
            <Label htmlFor="player-data">Paste CSV Data</Label>
            <Textarea
              id="player-data"
              placeholder="Name,Position,Goals,Assists,Saves,DefenderVoting&#10;Jacopo Di Donna,DEF,2,3,0,7.5&#10;Ciccio Gargiullo,MID,5,8,0,6.0"
              value={playerData}
              onChange={(e) => setPlayerData(e.target.value)}
              rows={8}
              className="border-[#B8CFCE] font-mono text-sm"
              disabled={isUploading}
            />
          </div>
          
          {isUploading && (
            <div className="flex items-center gap-2 text-[#7F8CAA]">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#333446]"></div>
              <span>Processing player data...</span>
            </div>
          )}

          <div className="flex gap-4">
            <Button 
              onClick={handleSubmit}
              disabled={isUploading || !playerData.trim()}
              className="bg-[#333446] text-white hover:bg-[#7F8CAA]"
            >
              Upload Players 📤
            </Button>
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
    </div>
  );
};

export default Upload;
