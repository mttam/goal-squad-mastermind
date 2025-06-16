
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { Player } from '@/types/fantacalcietto';
import { useToast } from '@/hooks/use-toast';

interface PlayerManagerProps {
  currentPlayer?: Player;
  onPlayerReplace?: (newPlayer: Player) => void;
  trigger: React.ReactNode;
}

const PlayerManager = ({ currentPlayer, onPlayerReplace, trigger }: PlayerManagerProps) => {
  const { players, addPlayer } = useFantacalcietto();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'replace' | 'add'>('replace');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    position: 'MID' as const,
    goals: 0,
    assists: 0,
    saves: 0,
    defenderVoting: 5,
  });

  const getPositionEmoji = (position: string) => {
    switch (position) {
      case 'GK': return '🥅';
      case 'DEF': return '🛡️';
      case 'MID': return '⚙️';
      case 'ATT': return '⚔️';
      default: return '⚽';
    }
  };

  const handleReplacePlayer = () => {
    if (!selectedPlayerId) {
      toast({
        title: "Error ❌",
        description: "Please select a player to replace with",
        variant: "destructive",
      });
      return;
    }

    const selectedPlayer = players.find(p => p.id === selectedPlayerId);
    if (!selectedPlayer) return;

    if (onPlayerReplace) {
      onPlayerReplace(selectedPlayer);
    }

    toast({
      title: "Player Replaced! 🔄",
      description: `${currentPlayer?.name} replaced with ${selectedPlayer.name}`,
    });

    setIsOpen(false);
    setSelectedPlayerId('');
  };

  const handleAddPlayer = () => {
    if (!newPlayer.name) {
      toast({
        title: "Error ❌",
        description: "Please enter a player name",
        variant: "destructive",
      });
      return;
    }

    const player: Player = {
      id: `player-${Date.now()}`,
      ...newPlayer,
    };

    addPlayer(player);

    if (onPlayerReplace) {
      onPlayerReplace(player);
    }

    toast({
      title: "Player Added! ✅",
      description: `${player.name} has been added to the database`,
    });

    setIsOpen(false);
    setNewPlayer({
      name: '',
      position: 'MID',
      goals: 0,
      assists: 0,
      saves: 0,
      defenderVoting: 5,
    });
  };

  // Filter out the current player from replacement options
  const availablePlayers = players.filter(p => p.id !== currentPlayer?.id);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#333446]">
            {currentPlayer ? `Manage Player: ${currentPlayer.name}` : 'Add Player'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Action Selection */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={selectedAction === 'replace' ? 'default' : 'outline'}
              onClick={() => setSelectedAction('replace')}
              className={selectedAction === 'replace' ? 'bg-[#333446] text-white' : 'text-[#333446] border-[#B8CFCE]'}
              disabled={!currentPlayer}
            >
              🔄 Replace
            </Button>
            <Button
              variant={selectedAction === 'add' ? 'default' : 'outline'}
              onClick={() => setSelectedAction('add')}
              className={selectedAction === 'add' ? 'bg-[#333446] text-white' : 'text-[#333446] border-[#B8CFCE]'}
            >
              ➕ Add New
            </Button>
          </div>

          {selectedAction === 'replace' && currentPlayer && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Replacement Player</Label>
                <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a player from database" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlayers.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        <div className="flex items-center gap-2">
                          <span>{getPositionEmoji(player.position)}</span>
                          <span>{player.name}</span>
                          <span className="text-xs text-[#7F8CAA]">({player.position})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleReplacePlayer} 
                className="w-full bg-[#333446] text-white hover:bg-[#7F8CAA]"
              >
                Replace Player 🔄
              </Button>
            </div>
          )}

          {selectedAction === 'add' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Player Name</Label>
                <Input
                  id="name"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                  placeholder="Enter player name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select value={newPlayer.position} onValueChange={(value) => setNewPlayer({...newPlayer, position: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GK">🥅 Goalkeeper</SelectItem>
                    <SelectItem value="DEF">🛡️ Defender</SelectItem>
                    <SelectItem value="MID">⚙️ Midfielder</SelectItem>
                    <SelectItem value="ATT">⚔️ Attacker</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goals">Goals</Label>
                  <Input
                    id="goals"
                    type="number"
                    value={newPlayer.goals}
                    onChange={(e) => setNewPlayer({...newPlayer, goals: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assists">Assists</Label>
                  <Input
                    id="assists"
                    type="number"
                    value={newPlayer.assists}
                    onChange={(e) => setNewPlayer({...newPlayer, assists: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="saves">Saves</Label>
                  <Input
                    id="saves"
                    type="number"
                    value={newPlayer.saves}
                    onChange={(e) => setNewPlayer({...newPlayer, saves: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defenderVoting">Defense Rating (1-10)</Label>
                  <Input
                    id="defenderVoting"
                    type="number"
                    min="1"
                    max="10"
                    value={newPlayer.defenderVoting}
                    onChange={(e) => setNewPlayer({...newPlayer, defenderVoting: parseInt(e.target.value) || 5})}
                  />
                </div>
              </div>

              <Button 
                onClick={handleAddPlayer} 
                className="w-full bg-[#333446] text-white hover:bg-[#7F8CAA]"
              >
                Add Player ✅
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerManager;
