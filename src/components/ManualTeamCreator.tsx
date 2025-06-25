
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Player, MatchMode } from '@/types/fantacalcietto';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { useToast } from '@/hooks/use-toast';

interface ManualTeamCreatorProps {
  selectedPlayers: Player[];
  selectedMode: MatchMode;
  selectedFormation?: string;
}

const ManualTeamCreator = ({ selectedPlayers, selectedMode, selectedFormation }: ManualTeamCreatorProps) => {
  const { addSquad } = useFantacalcietto();
  const { toast } = useToast();
  const [teamAName, setTeamAName] = useState(`Team A - ${selectedMode}`);
  const [teamBName, setTeamBName] = useState(`Team B - ${selectedMode}`);
  const [teamA, setTeamA] = useState<Player[]>([]);
  const [teamB, setTeamB] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>(selectedPlayers);

  const handleDragStart = (e: React.DragEvent, player: Player, source: 'available' | 'teamA' | 'teamB') => {
    e.dataTransfer.setData('player', JSON.stringify(player));
    e.dataTransfer.setData('source', source);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent, target: 'available' | 'teamA' | 'teamB') => {
    e.preventDefault();
    const playerData = e.dataTransfer.getData('player');
    const source = e.dataTransfer.getData('source') as 'available' | 'teamA' | 'teamB';
    
    if (!playerData || source === target) return;
    
    const player: Player = JSON.parse(playerData);
    
    // Remove from source
    if (source === 'available') {
      setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
    } else if (source === 'teamA') {
      setTeamA(prev => prev.filter(p => p.id !== player.id));
    } else if (source === 'teamB') {
      setTeamB(prev => prev.filter(p => p.id !== player.id));
    }
    
    // Add to target
    if (target === 'available') {
      setAvailablePlayers(prev => [...prev, player]);
    } else if (target === 'teamA') {
      setTeamA(prev => [...prev, player]);
    } else if (target === 'teamB') {
      setTeamB(prev => [...prev, player]);
    }
  };

  const handlePlayerClick = (player: Player, targetTeam: 'teamA' | 'teamB') => {
    // Remove from available players
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
    
    // Add to target team
    if (targetTeam === 'teamA') {
      setTeamA(prev => [...prev, player]);
      toast({
        title: "Player Added! 🔴",
        description: `${player.name} added to Team A`,
      });
    } else {
      setTeamB(prev => [...prev, player]);
      toast({
        title: "Player Added! 🔵",
        description: `${player.name} added to Team B`,
      });
    }
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
  const handleSaveTeams = () => {
    if (teamA.length === 0 && teamB.length === 0) {
      toast({
        title: "No Teams Created ❌",
        description: "Please add players to at least one team",
        variant: "destructive",
      });
      return;
    }

    const formationSuffix = selectedFormation ? ` (${selectedFormation})` : '';

    if (teamA.length > 0) {
      addSquad({
        id: `manual-squad-${Date.now()}-a`,
        name: `${teamAName}${formationSuffix}`,
        players: teamA,
        mode: selectedMode,
        createdAt: new Date(),
      });
    }

    if (teamB.length > 0) {
      addSquad({
        id: `manual-squad-${Date.now()}-b`,
        name: `${teamBName}${formationSuffix}`,
        players: teamB,
        mode: selectedMode,
        createdAt: new Date(),
      });
    }

    toast({
      title: "Manual Teams Saved! 💾",
      description: `${teamA.length > 0 && teamB.length > 0 ? 'Both teams' : 'Team'} saved successfully`,
    });

    // Reset
    setTeamA([]);
    setTeamB([]);
    setAvailablePlayers(selectedPlayers);
  };  interface PlayerCardProps {
    player: Player;
    source: 'available' | 'teamA' | 'teamB';
    onAddToTeam?: (player: Player, team: 'teamA' | 'teamB') => void;
  }

  const PlayerCard = ({ player, source, onAddToTeam }: PlayerCardProps) => {
    const isAvailable = source === 'available';
    
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, player, source)}
        className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#B8CFCE] cursor-move hover:bg-[#EAEFEF] transition-colors"
      >
        <span className="text-lg">{getPositionEmoji(player.position)}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[#333446] truncate text-sm">{player.name}</div>
          <div className="text-xs text-[#7F8CAA]">{player.position}</div>
        </div>
        
        {/* Add click buttons for available players */}
        {isAvailable && onAddToTeam && (
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToTeam(player, 'teamA');
              }}
              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              title="Add to Team A"
            >
              🔴 A
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToTeam(player, 'teamB');
              }}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              title="Add to Team B"
            >
              🔵 B
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Available Players */}        <Card className="bg-white border-[#B8CFCE]">
          <CardHeader>
            <CardTitle className="text-[#333446] text-center">Available Players</CardTitle>
            <p className="text-sm text-[#7F8CAA] text-center">{availablePlayers.length} players</p>
            <p className="text-xs text-[#7F8CAA] text-center italic">
              💡 Drag players or click 🔴A/🔵B buttons to assign to teams
            </p>
          </CardHeader>
          <CardContent>
            <div
              className="space-y-2 min-h-[300px] p-3 border-2 border-dashed border-[#B8CFCE] rounded-lg"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'available')}            >
              {availablePlayers.map((player) => (
                <PlayerCard 
                  key={player.id} 
                  player={player} 
                  source="available" 
                  onAddToTeam={handlePlayerClick}
                />
              ))}
              {availablePlayers.length === 0 && (
                <div className="text-center text-[#7F8CAA] py-8">
                  All players assigned to teams
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team A */}
        <Card className="bg-white border-[#B8CFCE]">
          <CardHeader>
            <div className="space-y-2">
              <Label htmlFor="teamAName">Team A Name</Label>
              <Input
                id="teamAName"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                className="text-sm"
              />
              <p className="text-sm text-[#7F8CAA] text-center">{teamA.length} players</p>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="space-y-2 min-h-[300px] p-3 border-2 border-dashed border-red-300 rounded-lg bg-red-50"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'teamA')}
            >
              {teamA.map((player) => (
                <PlayerCard key={player.id} player={player} source="teamA" />
              ))}
              {teamA.length === 0 && (
                <div className="text-center text-[#7F8CAA] py-8">
                  🔴 Drop players here for Team A
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team B */}
        <Card className="bg-white border-[#B8CFCE]">
          <CardHeader>
            <div className="space-y-2">
              <Label htmlFor="teamBName">Team B Name</Label>
              <Input
                id="teamBName"
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                className="text-sm"
              />
              <p className="text-sm text-[#7F8CAA] text-center">{teamB.length} players</p>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="space-y-2 min-h-[300px] p-3 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'teamB')}
            >
              {teamB.map((player) => (
                <PlayerCard key={player.id} player={player} source="teamB" />
              ))}
              {teamB.length === 0 && (
                <div className="text-center text-[#7F8CAA] py-8">
                  🔵 Drop players here for Team B
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={handleSaveTeams}
          className="bg-[#333446] text-white hover:bg-[#7F8CAA]"
          disabled={teamA.length === 0 && teamB.length === 0}
        >
          Save Manual Teams 💾
        </Button>
      </div>
    </div>
  );
};

export default ManualTeamCreator;
