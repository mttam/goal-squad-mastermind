
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { useToast } from '@/hooks/use-toast';
import { Player, Squad, MatchMode } from '@/types/fantacalcietto';

const SquadImporter = () => {
  const { players, addSquad } = useFantacalcietto();
  const { toast } = useToast();
  const [csvData, setCsvData] = useState('');

  const findPlayerByName = (name: string): Player | null => {
    const trimmedName = name.trim();
    return players.find(player => 
      player.name.toLowerCase() === trimmedName.toLowerCase()
    ) || null;
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

  const handleImport = () => {
    if (!csvData.trim()) {
      toast({
        title: "No Data Provided ❌",
        description: "Please enter CSV data to import",
        variant: "destructive",
      });
      return;
    }

    const lines = csvData.trim().split('\n');
    const importedSquads: Squad[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      if (!line.trim()) return;

      try {
        const fields = parseCSVLine(line);
        
        if (fields.length !== 4) {
          errors.push(`Line ${index + 1}: Expected 4 fields (Squad Name, Mode, Players, Created At)`);
          return;
        }

        const [squadName, mode, playersString, createdAt] = fields;

        // Validate mode
        if (!['5vs5', '6vs6', '7vs7', '8vs8'].includes(mode)) {
          errors.push(`Line ${index + 1}: Invalid mode "${mode}". Must be 5vs5, 6vs6, 7vs7, or 8vs8`);
          return;
        }

        // Parse players
        const playerNames = playersString.split(';').map(name => name.trim()).filter(name => name);
        const squadPlayers: Player[] = [];
        const missingPlayers: string[] = [];

        playerNames.forEach(playerName => {
          const player = findPlayerByName(playerName);
          if (player) {
            squadPlayers.push(player);
          } else {
            missingPlayers.push(playerName);
          }
        });

        if (missingPlayers.length > 0) {
          errors.push(`Line ${index + 1}: Players not found: ${missingPlayers.join(', ')}`);
        }

        if (squadPlayers.length === 0) {
          errors.push(`Line ${index + 1}: No valid players found for squad "${squadName}"`);
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
          errors.push(`Line ${index + 1}: Invalid date "${createdAt}", using current date`);
        }

        const squad: Squad = {
          id: `imported-squad-${Date.now()}-${index}`,
          name: squadName.trim(),
          players: squadPlayers,
          mode: mode as MatchMode,
          createdAt: parsedDate,
        };

        importedSquads.push(squad);
      } catch (error) {
        errors.push(`Line ${index + 1}: Failed to parse - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Import successful squads
    importedSquads.forEach(squad => addSquad(squad));

    // Show results
    if (importedSquads.length > 0) {
      toast({
        title: "Squads Imported Successfully! 📥",
        description: `${importedSquads.length} squad(s) imported${errors.length > 0 ? ` with ${errors.length} warning(s)` : ''}`,
      });
    }

    if (errors.length > 0 && importedSquads.length === 0) {
      toast({
        title: "Import Failed ❌",
        description: `${errors.length} error(s) occurred. Please check your data format.`,
        variant: "destructive",
      });
    }

    // Log errors to console for debugging
    if (errors.length > 0) {
      console.log('Import errors:', errors);
    }

    // Clear the input if import was successful
    if (importedSquads.length > 0) {
      setCsvData('');
    }
  };

  const exampleCSV = `"Team A - 6vs6","6vs6","Jacopo Di Donna; Ciccio Gargiullo; Mattia Ambrosiano; Francesco Castiglia; Vittorio Scarnati; Francesco Gencarelli","2025-06-20"
"Team B - 6vs6","6vs6","Nicola Di Donna; Giovanni Bonofiglio; Antonello Santopaolo; Alessandro Bruno; Vladimir Vena; Francesco Brogno","2025-06-20"`;

  return (
    <Card className="bg-white border-[#B8CFCE]">
      <CardHeader>
        <CardTitle className="text-[#333446]">Import Squads from CSV 📥</CardTitle>
        <p className="text-sm text-[#7F8CAA]">
          Import squads using CSV format: Squad Name, Mode, Players (semicolon separated), Created At
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csvData">CSV Data</Label>
          <Textarea
            id="csvData"
            placeholder={`Enter CSV data here...\n\nExample:\n${exampleCSV}`}
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
        </div>
        
        <div className="bg-[#EAEFEF] p-3 rounded-lg">
          <h4 className="font-medium text-[#333446] mb-2">Format Requirements:</h4>
          <ul className="text-sm text-[#7F8CAA] space-y-1">
            <li>• Squad Name: Any text (use quotes if contains commas)</li>
            <li>• Mode: 5vs5, 6vs6, 7vs7, or 8vs8</li>
            <li>• Players: Semicolon-separated player names</li>
            <li>• Created At: Date in YYYY-MM-DD format</li>
          </ul>
        </div>

        <Button 
          onClick={handleImport}
          className="bg-[#333446] text-white hover:bg-[#7F8CAA] w-full"
          disabled={!csvData.trim()}
        >
          Import Squads 📥
        </Button>
      </CardContent>
    </Card>
  );
};

export default SquadImporter;
