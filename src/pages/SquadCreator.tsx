import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { generateSquad } from '@/utils/rankings';
import { MatchMode, Player } from '@/types/fantacalcietto';
import { useToast } from '@/hooks/use-toast';
import PlayerManager from '@/components/PlayerManager';

const SquadCreator = () => {
  const { players, addSquad, replacePlayerInSquad } = useFantacalcietto();
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState<MatchMode>('5vs5');
  const [selectedFormation, setSelectedFormation] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [generatedTeams, setGeneratedTeams] = useState<{ teamA: Player[], teamB: Player[] } | null>(null);

  const modes = [
    { value: '5vs5', label: '5 vs 5', icon: '⚽' },
    { value: '6vs6', label: '6 vs 6', icon: '🏃' },
    { value: '7vs7', label: '7 vs 7', icon: '🤾' },
    { value: '8vs8', label: '8 vs 8', icon: '🏈' },
  ];

  const formations = {
    '5vs5': ['4-1', '3-2', '2-3', '1-4'],
    '6vs6': ['4-2', '3-3', '2-4', '5-1'],
    '7vs7': ['4-3', '3-4', '5-2', '2-5'],
    '8vs8': ['4-4', '5-3', '3-5', '6-2'],
  };

  const handlePlayerSelection = (playerId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlayers(prev => [...prev, playerId]);
    } else {
      setSelectedPlayers(prev => prev.filter(id => id !== playerId));
    }
  };

  const handleSelectAll = () => {
    if (selectedPlayers.length === players.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(players.map(p => p.id));
    }
  };

  const handleGenerateSquads = () => {
    if (selectedPlayers.length === 0) {
      toast({
        title: "No Players Selected ❌",
        description: "Please select at least some players to generate teams",
        variant: "destructive",
      });
      return;
    }

    const playersPerTeam = {
      '5vs5': 5,
      '6vs6': 6,
      '7vs7': 7,
      '8vs8': 8,
    }[selectedMode] || 5;

    const totalRequired = playersPerTeam * 2;
    
    if (selectedPlayers.length < totalRequired) {
      toast({
        title: "Not Enough Players ❌",
        description: `You need at least ${totalRequired} players for ${selectedMode} mode (${playersPerTeam} per team)`,
        variant: "destructive",
      });
      return;
    }

    const availablePlayers = players.filter(p => selectedPlayers.includes(p.id));
    const teams = generateSquad(availablePlayers, selectedMode);
    setGeneratedTeams(teams);
    
    toast({
      title: "Squads Generated! ⚽",
      description: `Created balanced teams for ${selectedMode} mode from ${selectedPlayers.length} selected players`,
    });
  };

  const handleReplacePlayer = (teamIndex: 0 | 1, oldPlayer: Player, newPlayer: Player) => {
    if (!generatedTeams) return;
    
    const updatedTeams = { ...generatedTeams };
    if (teamIndex === 0) {
      updatedTeams.teamA = updatedTeams.teamA.map(p => p.id === oldPlayer.id ? newPlayer : p);
    } else {
      updatedTeams.teamB = updatedTeams.teamB.map(p => p.id === oldPlayer.id ? newPlayer : p);
    }
    
    setGeneratedTeams(updatedTeams);
  };

  const handleSaveSquads = () => {
    if (!generatedTeams) return;

    const formationSuffix = selectedFormation ? ` (${selectedFormation})` : '';

    // Save Team A
    addSquad({
      id: `squad-${Date.now()}-a`,
      name: `Team A - ${selectedMode}${formationSuffix}`,
      players: generatedTeams.teamA,
      mode: selectedMode,
      createdAt: new Date(),
    });

    // Save Team B
    addSquad({
      id: `squad-${Date.now()}-b`,
      name: `Team B - ${selectedMode}${formationSuffix}`,
      players: generatedTeams.teamB,
      mode: selectedMode,
      createdAt: new Date(),
    });

    toast({
      title: "Squads Saved! 💾",
      description: "Teams are now available in Match Tools",
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

  const getTeamStats = (team: Player[]) => {
    const totalGoals = team.reduce((sum, player) => sum + player.goals, 0);
    const totalAssists = team.reduce((sum, player) => sum + player.assists, 0);
    const avgDefVoting = team.reduce((sum, player) => sum + player.defenderVoting, 0) / team.length;
    
    return { totalGoals, totalAssists, avgDefVoting: avgDefVoting.toFixed(1) };
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-[#333446]">Squad Creator ⚽</h1>
        <p className="text-[#7F8CAA]">Generate balanced teams based on player rankings</p>
      </div>

      {/* Mode Selection */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="text-[#333446]">Select Match Mode & Formation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {modes.map((mode) => (
              <Button
                key={mode.value}
                variant={selectedMode === mode.value ? "default" : "outline"}
                onClick={() => setSelectedMode(mode.value as MatchMode)}
                className={`p-4 h-auto flex flex-col gap-2 ${
                  selectedMode === mode.value 
                    ? 'bg-[#333446] text-white' 
                    : 'text-[#333446] border-[#B8CFCE] hover:bg-[#EAEFEF]'
                }`}
              >
                <span className="text-2xl">{mode.icon}</span>
                <span className="text-sm font-medium">{mode.label}</span>
              </Button>
            ))}
          </div>

          {/* Formation Selection */}
          <div className="space-y-2">
            <Label htmlFor="formation">Formation (Optional)</Label>
            <Select value={selectedFormation} onValueChange={setSelectedFormation}>
              <SelectTrigger>
                <SelectValue placeholder="Select Formation" />
              </SelectTrigger>
              <SelectContent>
                {formations[selectedMode].map((formation) => (
                  <SelectItem key={formation} value={formation}>
                    ⚽ {formation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Player Selection */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-[#333446]">
            Select Available Players
            <div className="text-sm text-[#7F8CAA]">
              {selectedPlayers.length} of {players.length} selected
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Button
              onClick={handleSelectAll}
              variant="outline"
              className="text-[#333446] border-[#B8CFCE] hover:bg-[#EAEFEF]"
            >
              {selectedPlayers.length === players.length ? 'Deselect All' : 'Select All'}
            </Button>
            <div className="text-sm text-[#7F8CAA]">
              Required for {selectedMode}: {(() => {
                const playersPerTeam = { '5vs5': 5, '6vs6': 6, '7vs7': 7, '8vs8': 8 }[selectedMode] || 5;
                return playersPerTeam * 2;
              })()} players minimum
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {players.map((player) => (
              <div 
                key={player.id}
                className="flex items-center space-x-3 p-3 rounded-lg bg-[#EAEFEF] hover:bg-[#B8CFCE] transition-colors"
              >
                <Checkbox
                  checked={selectedPlayers.includes(player.id)}
                  onCheckedChange={(checked) => handlePlayerSelection(player.id, checked as boolean)}
                />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg">{getPositionEmoji(player.position)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[#333446] truncate">{player.name}</div>
                    <div className="text-sm text-[#7F8CAA]">{player.position}</div>
                  </div>
                  <div className="text-xs text-[#7F8CAA] text-right">
                    <div>⚽ {player.goals}</div>
                    <div>🎯 {player.assists}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={handleGenerateSquads}
              className="bg-[#333446] text-white hover:bg-[#7F8CAA]"
              disabled={selectedPlayers.length === 0}
            >
              Generate Squads 🎲
            </Button>
            {generatedTeams && (
              <Button 
                onClick={handleSaveSquads}
                variant="outline"
                className="text-[#333446] border-[#B8CFCE] hover:bg-[#EAEFEF]"
              >
                Save Squads 💾
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generated Teams */}
      {generatedTeams && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Team A */}
          <Card className="bg-white border-[#B8CFCE]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#333446]">
                🔴 Team A
                {selectedFormation && (
                  <span className="text-sm text-[#7F8CAA] ml-auto">
                    Formation: {selectedFormation}
                  </span>
                )}
              </CardTitle>
              <div className="text-sm text-[#7F8CAA]">
                {(() => {
                  const stats = getTeamStats(generatedTeams.teamA);
                  return `Goals: ${stats.totalGoals} | Assists: ${stats.totalAssists} | Avg Defense: ${stats.avgDefVoting}`;
                })()}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {generatedTeams.teamA.map((player, index) => (
                  <div 
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#EAEFEF]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#333446]">{index + 1}</span>
                      <span className="text-lg">{getPositionEmoji(player.position)}</span>
                      <div>
                        <div className="font-medium text-[#333446]">{player.name}</div>
                        <div className="text-sm text-[#7F8CAA]">{player.position}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm text-[#7F8CAA]">
                        <div>⚽ {player.goals}</div>
                        <div>🎯 {player.assists}</div>
                      </div>
                      <PlayerManager
                        currentPlayer={player}
                        onPlayerReplace={(newPlayer) => handleReplacePlayer(0, player, newPlayer)}
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[#333446] border-[#B8CFCE] hover:bg-[#EAEFEF]"
                          >
                            🔄
                          </Button>
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team B */}
          <Card className="bg-white border-[#B8CFCE]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#333446]">
                🔵 Team B
                {selectedFormation && (
                  <span className="text-sm text-[#7F8CAA] ml-auto">
                    Formation: {selectedFormation}
                  </span>
                )}
              </CardTitle>
              <div className="text-sm text-[#7F8CAA]">
                {(() => {
                  const stats = getTeamStats(generatedTeams.teamB);
                  return `Goals: ${stats.totalGoals} | Assists: ${stats.totalAssists} | Avg Defense: ${stats.avgDefVoting}`;
                })()}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {generatedTeams.teamB.map((player, index) => (
                  <div 
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#EAEFEF]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#333446]">{index + 1}</span>
                      <span className="text-lg">{getPositionEmoji(player.position)}</span>
                      <div>
                        <div className="font-medium text-[#333446]">{player.name}</div>
                        <div className="text-sm text-[#7F8CAA]">{player.position}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm text-[#7F8CAA]">
                        <div>⚽ {player.goals}</div>
                        <div>🎯 {player.assists}</div>
                      </div>
                      <PlayerManager
                        currentPlayer={player}
                        onPlayerReplace={(newPlayer) => handleReplacePlayer(1, player, newPlayer)}
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[#333446] border-[#B8CFCE] hover:bg-[#EAEFEF]"
                          >
                            🔄
                          </Button>
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SquadCreator;
