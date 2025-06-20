
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { useToast } from '@/hooks/use-toast';
import { Player, Formation } from '@/types/fantacalcietto';

const DataExtractor = () => {
  const { formations, players, addPlayer } = useFantacalcietto();
  const { toast } = useToast();
  const [selectedFormation, setSelectedFormation] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);

  const extractPlayersFromFormation = (formation: Formation): Player[] => {
    const allFormationPlayers = [...formation.teamA, ...formation.teamB];
    
    // Get existing player data or create new player entries
    return allFormationPlayers.map(formationPlayer => {
      const existingPlayer = players.find(p => p.name === formationPlayer.name);
      
      if (existingPlayer) {
        // Return existing player with current stats
        return existingPlayer;
      } else {
        // Create new player entry with formation data
        return {
          id: `extracted-${Date.now()}-${Math.random()}`,
          name: formationPlayer.name,
          position: formationPlayer.position,
          goals: formationPlayer.goals || 0,
          assists: formationPlayer.assists || 0,
          saves: formationPlayer.saves || 0,
          defenderVoting: formationPlayer.defenderVoting || 0,
        };
      }
    });
  };

  const downloadPlayersCSV = (playersData: Player[]) => {
    const headers = ['Name', 'Position', 'Goals', 'Assists', 'Saves', 'DefenderVoting'];
    const csvContent = [
      headers.join(','),
      ...playersData.map(player => [
        `"${player.name}"`,
        player.position,
        player.goals,
        player.assists,
        player.saves,
        player.defenderVoting,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `players_from_${selectedFormation.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExtractAndDownload = () => {
    if (!selectedFormation) {
      toast({
        title: "No Formation Selected ⚠️",
        description: "Please select a formation to extract data from",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);

    try {
      const formation = formations.find(f => f.id === selectedFormation);
      if (!formation) {
        throw new Error('Formation not found');
      }

      const extractedPlayers = extractPlayersFromFormation(formation);
      
      // Download the CSV
      downloadPlayersCSV(extractedPlayers);

      toast({
        title: "Data Extracted Successfully! 📥",
        description: `Player data from "${formation.name}" has been downloaded as CSV`,
      });

    } catch (error) {
      toast({
        title: "Extraction Failed ❌",
        description: error instanceof Error ? error.message : "Failed to extract player data",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractAndSave = () => {
    if (!selectedFormation) {
      toast({
        title: "No Formation Selected ⚠️",
        description: "Please select a formation to extract data from",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);

    try {
      const formation = formations.find(f => f.id === selectedFormation);
      if (!formation) {
        throw new Error('Formation not found');
      }

      const extractedPlayers = extractPlayersFromFormation(formation);
      
      // Add new players to the system (skip existing ones)
      let newPlayersCount = 0;
      extractedPlayers.forEach(player => {
        const existingPlayer = players.find(p => p.name === player.name);
        if (!existingPlayer) {
          addPlayer(player);
          newPlayersCount++;
        }
      });

      toast({
        title: "Data Extracted Successfully! 💾",
        description: `${newPlayersCount} new players added from "${formation.name}"`,
      });

    } catch (error) {
      toast({
        title: "Extraction Failed ❌",
        description: error instanceof Error ? error.message : "Failed to extract player data",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Card className="bg-white border-[#B8CFCE]">
      <CardHeader>
        <CardTitle className="text-[#333446]">Extract Data from Match Formations 📊</CardTitle>
        <p className="text-sm text-[#7F8CAA]">
          Extract player statistics from existing match formations and save them as player data
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-[#EAEFEF] p-3 rounded-lg">
          <h4 className="font-medium text-[#333446] mb-2">How it works:</h4>
          <ul className="text-sm text-[#7F8CAA] space-y-1">
            <li>• Select a formation from your Match Tools</li>
            <li>• Extract player statistics (goals, assists, saves, defender voting)</li>
            <li>• Download as CSV in the same format as Player Data</li>
            <li>• Or save directly to your player database</li>
          </ul>
        </div>

        {formations.length === 0 ? (
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-yellow-800 text-sm">
              No formations available. Create formations in Match Tools first.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#333446]">Select Formation</label>
              <Select value={selectedFormation} onValueChange={setSelectedFormation}>
                <SelectTrigger className="border-[#B8CFCE]">
                  <SelectValue placeholder="Choose a formation to extract data from" />
                </SelectTrigger>
                <SelectContent>
                  {formations.map((formation) => (
                    <SelectItem key={formation.id} value={formation.id}>
                      {formation.name} ({formation.mode}) - {formation.teamA.length + formation.teamB.length} players
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedFormation && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Selected Formation Info:</h4>
                {(() => {
                  const formation = formations.find(f => f.id === selectedFormation);
                  if (!formation) return null;
                  
                  return (
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Name:</strong> {formation.name}</p>
                      <p><strong>Mode:</strong> {formation.mode}</p>
                      <p><strong>Total Players:</strong> {formation.teamA.length + formation.teamB.length}</p>
                      <p><strong>Created:</strong> {formation.createdAt.toLocaleDateString()}</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {isExtracting && (
              <div className="flex items-center gap-2 text-[#7F8CAA]">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#333446]"></div>
                <span>Extracting player data...</span>
              </div>
            )}

            <div className="flex gap-4">
              <Button 
                onClick={handleExtractAndDownload}
                disabled={!selectedFormation || isExtracting}
                className="bg-[#333446] text-white hover:bg-[#7F8CAA]"
              >
                Extract & Download CSV 📥
              </Button>
              <Button 
                onClick={handleExtractAndSave}
                disabled={!selectedFormation || isExtracting}
                variant="outline"
                className="text-[#333446] border-[#B8CFCE] hover:bg-[#EAEFEF]"
              >
                Extract & Save to Database 💾
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DataExtractor;
