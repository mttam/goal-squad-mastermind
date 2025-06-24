
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { useToast } from '@/hooks/use-toast';
import { Player } from '@/types/fantacalcietto';

const DataExtractor = () => {
  const { formations, setPlayers, players } = useFantacalcietto();
  const { toast } = useToast();
  const [selectedFormationId, setSelectedFormationId] = useState<string>('');
  const [extractedPlayers, setExtractedPlayers] = useState<Player[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const handleFormationSelect = (formationId: string) => {
    setSelectedFormationId(formationId);
    const formation = formations.find(f => f.id === formationId);
    
    if (formation) {
      const teamAPlayers = formation.teamA.map(player => ({
        ...player,
        goals: player.goals || 0,
        assists: player.assists || 0,
        saves: player.saves || 0,
        defenderVoting: player.defenderVoting || 1,
        squad: 'Team A'
      }));
      
      const teamBPlayers = formation.teamB.map(player => ({
        ...player,
        goals: player.goals || 0,
        assists: player.assists || 0,
        saves: player.saves || 0,
        defenderVoting: player.defenderVoting || 1,
        squad: 'Team B'
      }));
      
      const allPlayers = [...teamAPlayers, ...teamBPlayers];
      setExtractedPlayers(allPlayers);
      setIsEditing(true);
    }
  };

  const updatePlayerStat = (playerId: string, field: keyof Player, value: string | number) => {
    setExtractedPlayers(prev => prev.map(player => 
      player.id === playerId 
        ? { ...player, [field]: typeof value === 'string' ? parseFloat(value) || 0 : value }
        : player
    ));
  };
  const downloadCSV = () => {
    if (extractedPlayers.length === 0) {
      toast({
        title: "No Data to Download ❌",
        description: "Please select a formation first",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Name', 'Squad', 'Position', 'Goals', 'Assists', 'Saves', 'DefenderVoting'];
    const csvContent = [
      headers.join(','),
      ...extractedPlayers.map(player => [
        `"${player.name}"`,
        `"${player.squad}"`,
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
    link.setAttribute('download', 'extracted_players_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Complete! 📥",
      description: "Player data exported successfully",
    });
  };

  const saveToDatabase = () => {
    if (extractedPlayers.length === 0) {
      toast({
        title: "No Data to Save ❌",
        description: "Please select a formation first",
        variant: "destructive",
      });
      return;
    }

    const updatedPlayers = [...players];
    let addedCount = 0;
    let updatedCount = 0;

    extractedPlayers.forEach(newPlayer => {
      const existingIndex = updatedPlayers.findIndex(p => p.name === newPlayer.name);
      if (existingIndex >= 0) {
        updatedPlayers[existingIndex] = { ...updatedPlayers[existingIndex], ...newPlayer };
        updatedCount++;
      } else {
        updatedPlayers.push({
          ...newPlayer,
          id: `extracted-${Date.now()}-${Math.random()}`,
        });
        addedCount++;
      }
    });

    setPlayers(updatedPlayers);

    toast({
      title: "Data Saved Successfully! ✅",
      description: `Added ${addedCount} new players, updated ${updatedCount} existing players`,
    });
  };

  const getPositionEmoji = (position: string) => {
    switch (position) {
      case 'GK': return '🥅';
      case 'DEF': return '🛡️';
      case 'MID': return '⚙️';
      case 'ATT': return '⚔️';
      default: return '⚽';
    }
  };

  return (
    <Card className="bg-white border-[#B8CFCE]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#333446]">
          📊 Extract & Edit Formation Data
        </CardTitle>
        <p className="text-sm text-[#7F8CAA]">
          Extract player data from existing formations, edit statistics manually, and export or save to database
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formation Selection */}
        <div className="space-y-2">
          <Label htmlFor="formation-select">Select Formation</Label>
          <Select value={selectedFormationId} onValueChange={handleFormationSelect}>
            <SelectTrigger className="border-[#B8CFCE]">
              <SelectValue placeholder="Choose a formation to extract data from" />
            </SelectTrigger>
            <SelectContent>
              {formations.length === 0 ? (
                <SelectItem value="none" disabled>
                  No formations available
                </SelectItem>
              ) : (
                formations.map((formation) => (
                  <SelectItem key={formation.id} value={formation.id}>
                    {formation.name} - {formation.mode} ({formation.teamA.length + formation.teamB.length} players)
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>        {/* Manual Data Editing */}
        {isEditing && extractedPlayers.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-medium text-[#333446]">Edit Player Statistics</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={downloadCSV}
                  variant="outline"
                  className="text-[#333446] border-[#B8CFCE] hover:bg-[#EAEFEF] w-full sm:w-auto"
                >
                  Download CSV 📄
                </Button>
                <Button 
                  onClick={saveToDatabase}
                  className="bg-[#333446] text-white hover:bg-[#7F8CAA] w-full sm:w-auto"
                >
                  Save to Database 💾
                </Button>
              </div>
            </div>

            {/* Team A Players */}
            {extractedPlayers.filter(p => p.squad === 'Team A').length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-[#333446] flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                  Team A Players ({extractedPlayers.filter(p => p.squad === 'Team A').length})
                </h4>
                
                {/* Desktop Table */}
                <div className="hidden md:block border border-[#B8CFCE] rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[#333446]">Player</TableHead>
                        <TableHead className="text-[#333446]">Position</TableHead>
                        <TableHead className="text-[#333446]">Goals</TableHead>
                        <TableHead className="text-[#333446]">Assists</TableHead>
                        <TableHead className="text-[#333446]">Saves</TableHead>
                        <TableHead className="text-[#333446]">Defender Voting</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedPlayers.filter(p => p.squad === 'Team A').map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span>{getPositionEmoji(player.position)}</span>
                              {player.name}
                            </div>
                          </TableCell>
                          <TableCell>{player.position}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={player.goals}
                              onChange={(e) => updatePlayerStat(player.id, 'goals', e.target.value)}
                              className="w-20 h-8 text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={player.assists}
                              onChange={(e) => updatePlayerStat(player.id, 'assists', e.target.value)}
                              className="w-20 h-8 text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={player.saves}
                              onChange={(e) => updatePlayerStat(player.id, 'saves', e.target.value)}
                              className="w-20 h-8 text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={player.defenderVoting}
                              onChange={(e) => updatePlayerStat(player.id, 'defenderVoting', e.target.value)}
                              className="w-20 h-8 text-center"
                              max="10"
                              step="0.1"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {extractedPlayers.filter(p => p.squad === 'Team A').map((player) => (
                    <div key={player.id} className="bg-white border border-[#B8CFCE] rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{getPositionEmoji(player.position)}</span>
                        <div>
                          <div className="font-medium text-[#333446]">{player.name}</div>
                          <div className="text-sm text-[#7F8CAA]">{player.position}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-[#7F8CAA]">Goals</Label>
                          <Input
                            type="number"
                            value={player.goals}
                            onChange={(e) => updatePlayerStat(player.id, 'goals', e.target.value)}
                            className="h-8 text-center mt-1"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-[#7F8CAA]">Assists</Label>
                          <Input
                            type="number"
                            value={player.assists}
                            onChange={(e) => updatePlayerStat(player.id, 'assists', e.target.value)}
                            className="h-8 text-center mt-1"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-[#7F8CAA]">Saves</Label>
                          <Input
                            type="number"
                            value={player.saves}
                            onChange={(e) => updatePlayerStat(player.id, 'saves', e.target.value)}
                            className="h-8 text-center mt-1"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-[#7F8CAA]">Voting</Label>
                          <Input
                            type="number"
                            value={player.defenderVoting}
                            onChange={(e) => updatePlayerStat(player.id, 'defenderVoting', e.target.value)}
                            className="h-8 text-center mt-1"
                            min="1"
                            max="10"
                            step="0.1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team B Players */}
            {extractedPlayers.filter(p => p.squad === 'Team B').length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-[#333446] flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                  Team B Players ({extractedPlayers.filter(p => p.squad === 'Team B').length})
                </h4>
                
                {/* Desktop Table */}
                <div className="hidden md:block border border-[#B8CFCE] rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[#333446]">Player</TableHead>
                        <TableHead className="text-[#333446]">Position</TableHead>
                        <TableHead className="text-[#333446]">Goals</TableHead>
                        <TableHead className="text-[#333446]">Assists</TableHead>
                        <TableHead className="text-[#333446]">Saves</TableHead>
                        <TableHead className="text-[#333446]">Defender Voting</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedPlayers.filter(p => p.squad === 'Team B').map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span>{getPositionEmoji(player.position)}</span>
                              {player.name}
                            </div>
                          </TableCell>
                          <TableCell>{player.position}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={player.goals}
                              onChange={(e) => updatePlayerStat(player.id, 'goals', e.target.value)}
                              className="w-20 h-8 text-center"
                              min="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={player.assists}
                              onChange={(e) => updatePlayerStat(player.id, 'assists', e.target.value)}
                              className="w-20 h-8 text-center"
                              min="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={player.saves}
                              onChange={(e) => updatePlayerStat(player.id, 'saves', e.target.value)}
                              className="w-20 h-8 text-center"
                              min="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={player.defenderVoting}
                              onChange={(e) => updatePlayerStat(player.id, 'defenderVoting', e.target.value)}
                              className="w-20 h-8 text-center"
                              min="1"
                              max="10"
                              step="0.1"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {extractedPlayers.filter(p => p.squad === 'Team B').map((player) => (
                    <div key={player.id} className="bg-white border border-[#B8CFCE] rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{getPositionEmoji(player.position)}</span>
                        <div>
                          <div className="font-medium text-[#333446]">{player.name}</div>
                          <div className="text-sm text-[#7F8CAA]">{player.position}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-[#7F8CAA]">Goals</Label>
                          <Input
                            type="number"
                            value={player.goals}
                            onChange={(e) => updatePlayerStat(player.id, 'goals', e.target.value)}
                            className="h-8 text-center mt-1"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-[#7F8CAA]">Assists</Label>
                          <Input
                            type="number"
                            value={player.assists}
                            onChange={(e) => updatePlayerStat(player.id, 'assists', e.target.value)}
                            className="h-8 text-center mt-1"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-[#7F8CAA]">Saves</Label>
                          <Input
                            type="number"
                            value={player.saves}
                            onChange={(e) => updatePlayerStat(player.id, 'saves', e.target.value)}
                            className="h-8 text-center mt-1"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-[#7F8CAA]">Voting</Label>
                          <Input
                            type="number"
                            value={player.defenderVoting}
                            onChange={(e) => updatePlayerStat(player.id, 'defenderVoting', e.target.value)}
                            className="h-8 text-center mt-1"
                            min="1"
                            max="10"
                            step="0.1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}            <div className="bg-[#EAEFEF] p-3 rounded-lg">
              <h4 className="font-medium text-[#333446] mb-2">Quick Stats Summary:</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                <div className="text-center">
                  <div className="font-bold text-[#333446]">{extractedPlayers.length}</div>
                  <div className="text-[#7F8CAA]">Total Players</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-[#333446]">
                    {extractedPlayers.reduce((sum, p) => sum + p.goals, 0)}
                  </div>
                  <div className="text-[#7F8CAA]">Total Goals</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-[#333446]">
                    {extractedPlayers.reduce((sum, p) => sum + p.assists, 0)}
                  </div>
                  <div className="text-[#7F8CAA]">Total Assists</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-[#333446]">
                    {extractedPlayers.reduce((sum, p) => sum + p.saves, 0)}
                  </div>
                  <div className="text-[#7F8CAA]">Total Saves</div>
                </div>
              </div>
              
              {/* Team-specific stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border-l-4 border-blue-600">
                  <h5 className="font-medium text-[#333446] mb-2 flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    Team A Stats
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-blue-600">
                        {extractedPlayers.filter(p => p.squad === 'Team A').reduce((sum, p) => sum + p.goals, 0)}
                      </div>
                      <div className="text-[#7F8CAA]">Goals</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-600">
                        {extractedPlayers.filter(p => p.squad === 'Team A').reduce((sum, p) => sum + p.assists, 0)}
                      </div>
                      <div className="text-[#7F8CAA]">Assists</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-600">
                        {extractedPlayers.filter(p => p.squad === 'Team A').reduce((sum, p) => sum + p.saves, 0)}
                      </div>
                      <div className="text-[#7F8CAA]">Saves</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-600">
                        {extractedPlayers.filter(p => p.squad === 'Team A').length}
                      </div>
                      <div className="text-[#7F8CAA]">Players</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded border-l-4 border-red-600">
                  <h5 className="font-medium text-[#333446] mb-2 flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    Team B Stats
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-red-600">
                        {extractedPlayers.filter(p => p.squad === 'Team B').reduce((sum, p) => sum + p.goals, 0)}
                      </div>
                      <div className="text-[#7F8CAA]">Goals</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-red-600">
                        {extractedPlayers.filter(p => p.squad === 'Team B').reduce((sum, p) => sum + p.assists, 0)}
                      </div>
                      <div className="text-[#7F8CAA]">Assists</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-red-600">
                        {extractedPlayers.filter(p => p.squad === 'Team B').reduce((sum, p) => sum + p.saves, 0)}
                      </div>
                      <div className="text-[#7F8CAA]">Saves</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-red-600">
                        {extractedPlayers.filter(p => p.squad === 'Team B').length}
                      </div>
                      <div className="text-[#7F8CAA]">Players</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {formations.length === 0 && (
          <div className="text-center py-8 text-[#7F8CAA]">
            <p>No formations available. Create formations in Match Tools first.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataExtractor;
