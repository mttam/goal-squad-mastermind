
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { generateSquad } from '@/utils/rankings';
import { MatchMode, Player } from '@/types/fantacalcietto';
import { useToast } from '@/hooks/use-toast';

const SquadCreator = () => {
  const { players, addSquad } = useFantacalcietto();
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState<MatchMode>('5vs5');
  const [generatedTeams, setGeneratedTeams] = useState<{ teamA: Player[], teamB: Player[] } | null>(null);

  const modes = [
    { value: '5vs5', label: '5 vs 5', icon: '⚽' },
    { value: '6vs6', label: '6 vs 6', icon: '🏃' },
    { value: '7vs7', label: '7 vs 7', icon: '🤾' },
    { value: '8vs8', label: '8 vs 8', icon: '🏈' },
  ];

  const handleGenerateSquads = () => {
    const teams = generateSquad(players, selectedMode);
    setGeneratedTeams(teams);
    
    toast({
      title: "Squads Generated! ⚽",
      description: `Created balanced teams for ${selectedMode} mode`,
    });
  };

  const handleSaveSquads = () => {
    if (!generatedTeams) return;

    // Save Team A
    addSquad({
      id: `squad-${Date.now()}-a`,
      name: `Team A - ${selectedMode}`,
      players: generatedTeams.teamA,
      mode: selectedMode,
      createdAt: new Date(),
    });

    // Save Team B
    addSquad({
      id: `squad-${Date.now()}-b`,
      name: `Team B - ${selectedMode}`,
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
          <CardTitle className="text-[#333446]">Select Match Mode</CardTitle>
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
          
          <div className="flex gap-4">
            <Button 
              onClick={handleGenerateSquads}
              className="bg-[#333446] text-white hover:bg-[#7F8CAA]"
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
                    <div className="text-right text-sm text-[#7F8CAA]">
                      <div>⚽ {player.goals}</div>
                      <div>🎯 {player.assists}</div>
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
                    <div className="text-right text-sm text-[#7F8CAA]">
                      <div>⚽ {player.goals}</div>
                      <div>🎯 {player.assists}</div>
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
