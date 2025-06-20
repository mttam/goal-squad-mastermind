
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { useToast } from '@/hooks/use-toast';
import { Player, Squad, MatchMode } from '@/types/fantacalcietto';

const SquadImporter = () => {
  const { players, addSquad } = useFantacalcietto();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const findPlayerByName = (name: string): Player | null => {
    const trimmedName = name.trim();
    return players.find(player => 
      player.name.toLowerCase() === trimmedName.toLowerCase()
    ) || null;
  };

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

  const validateSquadData = (data: any[]): Squad[] => {
    const validSquads: Squad[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    data.forEach((row, index) => {
      try {
        const squadName = row['squad name'] || row.squadname;
        const mode = row.mode;
        const playersString = row.players;
        const createdAt = row['created at'] || row.createdat;

        // Validate mode
        if (!['5vs5', '6vs6', '7vs7', '8vs8'].includes(mode)) {
          errors.push(`Row ${index + 2}: Invalid mode "${mode}". Must be 5vs5, 6vs6, 7vs7, or 8vs8`);
          return;
        }

        // Parse players
        const playerNames = playersString.split(';').map((name: string) => name.trim()).filter((name: string) => name);
        const squadPlayers: Player[] = [];
        const missingPlayers: string[] = [];

        playerNames.forEach((playerName: string) => {
          const player = findPlayerByName(playerName);
          if (player) {
            squadPlayers.push(player);
          } else {
            missingPlayers.push(playerName);
          }
        });

        if (missingPlayers.length > 0) {
          errors.push(`Row ${index + 2}: Players not found: ${missingPlayers.join(', ')}`);
          
          // Suggest similar player names
          const availablePlayerNames = players.map(p => p.name);
          warnings.push(`Available players: ${availablePlayerNames.slice(0, 10).join(', ')}${availablePlayerNames.length > 10 ? '...' : ''}`);
        }

        if (squadPlayers.length === 0) {
          errors.push(`Row ${index + 2}: No valid players found for squad "${squadName}"`);
          return;
        }

        // Parse date
        let parsedDate: Date;
        try {
          parsedDate = new Date(createdAt);
          if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date');
          }
        } catch {
          parsedDate = new Date();
          warnings.push(`Row ${index + 2}: Invalid date "${createdAt}", using current date`);
        }

        const squad: Squad = {
          id: `imported-squad-${Date.now()}-${index}`,
          name: squadName.trim(),
          players: squadPlayers,
          mode: mode as MatchMode,
          createdAt: parsedDate,
        };

        validSquads.push(squad);
      } catch (error) {
        errors.push(`Row ${index + 2}: Failed to parse - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Log errors and warnings to console for debugging
    if (errors.length > 0) {
      console.log('Import errors:', errors);
    }
    if (warnings.length > 0) {
      console.log('Import warnings:', warnings);
    }

    return validSquads;
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

      const newSquads = validateSquadData(csvData);
      
      if (newSquads.length === 0) {
        throw new Error('No valid squad data found');
      }

      // Import successful squads
      newSquads.forEach(squad => addSquad(squad));

      toast({
        title: "Squads Imported Successfully! 📥",
        description: `${newSquads.length} squad(s) imported from CSV file`,
      });

    } catch (error) {
      toast({
        title: "Import Failed ❌",
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
      'Squad Name,Mode,Players,Created At',
      '"Team A - 6vs6","6vs6","Jacopo Di Donna; Ciccio Gargiullo; Mattia Ambrosiano; Francesco Castiglia; Vittorio Scarnati; Francesco Gencarelli","2025-06-20"',
      '"Team B - 6vs6","6vs6","Nicola Di Donna; Giovanni Bonofiglio; Antonello Santopaolo; Alessandro Bruno; Vladimir Vena; Francesco Brogno","2025-06-20"',
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_squads_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sample Downloaded! 📄",
      description: "Use this template for your squad data",
    });
  };

  return (
    <Card className="bg-white border-[#B8CFCE]">
      <CardHeader>
        <CardTitle className="text-[#333446]">Import Squads from CSV 📥</CardTitle>
        <p className="text-sm text-[#7F8CAA]">
          Import squads using CSV format with header row: Squad Name, Mode, Players (semicolon separated), Created At
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-[#EAEFEF] p-3 rounded-lg">
          <h4 className="font-medium text-[#333446] mb-2">Format Requirements:</h4>
          <ul className="text-sm text-[#7F8CAA] space-y-1">
            <li>• First row should be headers: Squad Name,Mode,Players,Created At</li>
            <li>• Squad Name: Any text (use quotes if contains commas)</li>
            <li>• Mode: 5vs5, 6vs6, 7vs7, or 8vs8</li>
            <li>• Players: Semicolon-separated player names (must match existing players)</li>
            <li>• Created At: Date in YYYY-MM-DD format</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">Available Players ({players.length}):</h4>
          <div className="text-sm text-blue-700 max-h-24 overflow-y-auto">
            {players.map(player => player.name).join(', ')}
          </div>
        </div>

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
  );
};

export default SquadImporter;
