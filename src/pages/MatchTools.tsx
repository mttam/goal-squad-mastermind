import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { Player, Squad, Formation, Due, MatchMode } from '@/types/fantacalcietto';
import { useToast } from '@/hooks/use-toast';
import PlayerManager from '@/components/PlayerManager';

const MatchTools = () => {
  const { squads, dues, addDue, updateDue, replacePlayerInSquad } = useFantacalcietto();
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState<MatchMode>('5vs5');
  const [selectedSquadA, setSelectedSquadA] = useState('');
  const [selectedSquadB, setSelectedSquadB] = useState('');
  const [selectedFormationA, setSelectedFormationA] = useState('');
  const [selectedFormationB, setSelectedFormationB] = useState('');
  const [goalkeepingRotations, setGoalkeepingRotations] = useState<Array<{player: string, timeSlot: string, team: string}>>([]);
  
  // Due form state
  const [newDue, setNewDue] = useState({
    playerName: '',
    amount: '',
    description: '',
    rest: '',
  });

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

  const availableSquads = squads.filter(squad => squad.mode === selectedMode);

  // Get all players from selected teams
  const getAllPlayersFromSelectedTeams = () => {
    const players = [];
    
    if (selectedSquadA) {
      const teamA = squads.find(s => s.id === selectedSquadA);
      if (teamA) {
        players.push(...teamA.players.map(p => ({ ...p, team: teamA.name })));
      }
    }
    
    if (selectedSquadB) {
      const teamB = squads.find(s => s.id === selectedSquadB);
      if (teamB) {
        players.push(...teamB.players.map(p => ({ ...p, team: teamB.name })));
      }
    }
    
    return players;
  };

  const availablePlayers = getAllPlayersFromSelectedTeams();

  const generateGoalkeepingRotations = () => {
    if (!selectedSquadA && !selectedSquadB) {
      toast({
        title: "Error ❌",
        description: "Please select both teams first",
        variant: "destructive",
      });
      return;
    }

    const teamA = squads.find(s => s.id === selectedSquadA);
    const teamB = squads.find(s => s.id === selectedSquadB);
    
    if (!teamA || !teamB) {
      toast({
        title: "Error ❌",
        description: "Selected teams not found",
        variant: "destructive",
      });
      return;
    }

    const rotations = [];
    
    // Generate rotations for Team A
    const shuffledTeamA = [...teamA.players].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffledTeamA.length; i++) {
      const startMinute = i * 5;
      const endMinute = (i + 1) * 5;
      
      rotations.push({
        player: shuffledTeamA[i].name,
        timeSlot: `${startMinute}' - ${endMinute}'`,
        team: teamA.name
      });
    }
    
    // Generate rotations for Team B
    const shuffledTeamB = [...teamB.players].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffledTeamB.length; i++) {
      const startMinute = i * 5;
      const endMinute = (i + 1) * 5;
      
      rotations.push({
        player: shuffledTeamB[i].name,
        timeSlot: `${startMinute}' - ${endMinute}'`,
        team: teamB.name
      });
    }
    
    // Sort rotations by start time
    rotations.sort((a, b) => {
      const aStart = parseInt(a.timeSlot.split("'")[0]);
      const bStart = parseInt(b.timeSlot.split("'")[0]);
      return aStart - bStart;
    });
    
    setGoalkeepingRotations(rotations);
    toast({
      title: "Goalkeeper Rotations Generated! 🥅",
      description: `5-minute goalkeeper rotations created for both teams`,
    });
  };

  const handleAddDue = () => {
    if (!newDue.playerName || !newDue.amount) {
      toast({
        title: "Error ❌",
        description: "Please fill in player name and amount",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(newDue.amount);
    const rest = newDue.rest ? parseFloat(newDue.rest) : amount;

    const due: Due = {
      id: `due-${Date.now()}`,
      playerName: newDue.playerName,
      amount: amount,
      description: newDue.description || 'Match fee',
      paid: false,
      date: new Date(),
      rest: rest,
    };

    addDue(due);
    setNewDue({ playerName: '', amount: '', description: '', rest: '' });
    
    toast({
      title: "Due Added! 💰",
      description: `Added €${due.amount} due for ${due.playerName}`,
    });
  };

  const createDuesForAllPlayers = () => {
    if (availablePlayers.length === 0) {
      toast({
        title: "Error ❌",
        description: "Please select teams first",
        variant: "destructive",
      });
      return;
    }

    if (!newDue.amount) {
      toast({
        title: "Error ❌",
        description: "Please enter an amount first",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(newDue.amount);
    const rest = newDue.rest ? parseFloat(newDue.rest) : amount;
    const description = newDue.description || 'Match fee';
    let addedCount = 0;

    availablePlayers.forEach((player) => {
      // Check if player already has a due with the same description
      const existingDue = dues.find(due => 
        due.playerName === player.name && 
        due.description === description &&
        !due.paid
      );

      if (!existingDue) {
        const due: Due = {
          id: `due-${Date.now()}-${player.id}`,
          playerName: player.name,
          amount: amount,
          description: description,
          paid: false,
          date: new Date(),
          rest: rest,
        };
        addDue(due);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast({
        title: "Dues Added! 💰",
        description: `Added €${amount} dues for ${addedCount} players`,
      });
    } else {
      toast({
        title: "No Dues Added ⚠️",
        description: "All players already have unpaid dues with this description",
      });
    }
  };

  const toggleDuePaid = (dueId: string, paid: boolean) => {
    updateDue(dueId, { paid });
    toast({
      title: paid ? "Payment Recorded! ✅" : "Payment Unmarked ❌",
      description: paid ? "Due marked as paid" : "Due marked as unpaid",
    });
  };

  const updateDueRest = (dueId: string, newRest: number) => {
    updateDue(dueId, { rest: newRest });
    toast({
      title: "Rest Amount Updated! 💰",
      description: `Updated remaining amount to €${newRest.toFixed(2)}`,
    });
  };

  const updateDueActualPaid = (dueId: string, actualPaid: number) => {
    const due = dues.find(d => d.id === dueId);
    if (due) {
      const change = actualPaid - due.amount;
      updateDue(dueId, { actualPaid, change });
      
      if (change > 0) {
        toast({
          title: "Payment with Change! 💰",
          description: `€${change.toFixed(2)} change to give back`,
        });
      }
    }
  };

  // Calculate totals
  const totalAmountToPay = dues.reduce((sum, due) => sum + due.amount, 0);
  const totalPaid = dues.reduce((sum, due) => sum + (due.paid ? due.amount : 0), 0);
  const totalRest = dues.reduce((sum, due) => sum + (due.rest || due.amount), 0);
  const totalActualPaid = dues.reduce((sum, due) => sum + (due.actualPaid || 0), 0);
  const totalChange = dues.reduce((sum, due) => sum + (due.change || 0), 0);

  const getPositionEmoji = (position: string) => {
    switch (position) {
      case 'GK': return '🥅';
      case 'DEF': return '🛡️';
      case 'MID': return '⚙️';
      case 'ATT': return '⚔️';
      default: return '⚽';
    }
  };

  const handleReplacePlayerInSquad = (squadId: string, oldPlayer: Player, newPlayer: Player) => {
    replacePlayerInSquad(squadId, oldPlayer.id, newPlayer);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-[#333446]">Match Tools 🔧</h1>
        <p className="text-[#7F8CAA]">Manage formations, goal shifts, and dues</p>
      </div>

      {/* Mode Selection & Formation Builder */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="text-[#333446]">Formation Builder ⚽</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selection */}
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

          {/* Squad Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="team-a">Team A</Label>
              <Select value={selectedSquadA} onValueChange={setSelectedSquadA}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Team A" />
                </SelectTrigger>
                <SelectContent>
                  {availableSquads.map((squad) => (
                    <SelectItem key={squad.id} value={squad.id}>
                      {squad.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-b">Team B</Label>
              <Select value={selectedSquadB} onValueChange={setSelectedSquadB}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Team B" />
                </SelectTrigger>
                <SelectContent>
                  {availableSquads.map((squad) => (
                    <SelectItem key={squad.id} value={squad.id}>
                      {squad.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Formation Selection for both teams */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="formation-a">Team A Formation</Label>
              <Select value={selectedFormationA} onValueChange={setSelectedFormationA}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Formation for Team A" />
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
            <div className="space-y-2">
              <Label htmlFor="formation-b">Team B Formation</Label>
              <Select value={selectedFormationB} onValueChange={setSelectedFormationB}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Formation for Team B" />
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
          </div>

          {/* Show Selected Teams */}
          {selectedSquadA && selectedSquadB && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {[
                { squadId: selectedSquadA, formation: selectedFormationA, index: 0 },
                { squadId: selectedSquadB, formation: selectedFormationB, index: 1 }
              ].map(({ squadId, formation, index }) => {
                const squad = squads.find(s => s.id === squadId);
                if (!squad) return null;
                
                return (
                  <div key={squadId} className="space-y-2">
                    <h3 className="font-medium text-[#333446] flex items-center gap-2">
                      {index === 0 ? '🔴' : '🔵'} {squad.name}
                      {formation && (
                        <span className="text-sm text-[#7F8CAA] ml-auto">
                          Formation: {formation}
                        </span>
                      )}
                    </h3>
                    <div className="space-y-1">
                      {squad.players.map((player) => (
                        <div 
                          key={player.id}
                          className="flex items-center justify-between p-2 rounded bg-[#EAEFEF]"
                        >
                          <div className="flex items-center gap-2">
                            <span>{getPositionEmoji(player.position)}</span>
                            <span className="text-sm text-[#333446]">{player.name}</span>
                            <span className="text-xs text-[#7F8CAA] ml-auto">{player.position}</span>
                          </div>
                          <PlayerManager
                            currentPlayer={player}
                            onPlayerReplace={(newPlayer) => handleReplacePlayerInSquad(squadId, player, newPlayer)}
                            trigger={
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[#333446] border-[#B8CFCE] hover:bg-[#EAEFEF] h-6 w-6 p-0"
                              >
                                🔄
                              </Button>
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goalkeeper Rotation Generator */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="text-[#333446]">Goalkeeper Rotation Generator 🥅</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-[#7F8CAA] mb-2">
            Generate 5-minute goalkeeper rotations for all players from both teams
          </div>
          <Button 
            onClick={generateGoalkeepingRotations}
            className="bg-[#333446] text-white hover:bg-[#7F8CAA]"
          >
            Generate Goalkeeper Rotations 🎲
          </Button>
          
          {goalkeepingRotations.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-[#333446]">Goalkeeper Rotation Schedule:</h3>
              
              {/* Show rotations divided by team */}
              <div className="grid md:grid-cols-2 gap-4">
                {[selectedSquadA, selectedSquadB].map((squadId, index) => {
                  const squad = squads.find(s => s.id === squadId);
                  if (!squad) return null;
                  
                  const teamRotations = goalkeepingRotations.filter(rotation => rotation.team === squad.name);
                  
                  return (
                    <div key={squadId} className="space-y-2">
                      <h4 className="font-medium text-[#333446] flex items-center gap-2">
                        {index === 0 ? '🔴' : '🔵'} {squad.name} - Goalkeeper Schedule
                      </h4>
                      <div className="max-h-96 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-[#333446]">Time Slot</TableHead>
                              <TableHead className="text-[#333446]">Goalkeeper</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {teamRotations.map((rotation, rotIndex) => (
                              <TableRow key={rotIndex}>
                                <TableCell className="font-medium text-[#333446]">
                                  🥅 {rotation.timeSlot}
                                </TableCell>
                                <TableCell className="text-[#7F8CAA]">
                                  {rotation.player}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dues Management */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="text-[#333446]">Dues Management 💰</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enhanced Financial Summary */}
          {dues.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-[#EAEFEF] rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#333446]">€{totalAmountToPay.toFixed(2)}</div>
                <div className="text-sm text-[#7F8CAA]">Total Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">€{totalPaid.toFixed(2)}</div>
                <div className="text-sm text-[#7F8CAA]">Total Paid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">€{totalRest.toFixed(2)}</div>
                <div className="text-sm text-[#7F8CAA]">Total Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">€{totalActualPaid.toFixed(2)}</div>
                <div className="text-sm text-[#7F8CAA]">Actual Received</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">€{totalChange.toFixed(2)}</div>
                <div className="text-sm text-[#7F8CAA]">Total Change</div>
              </div>
            </div>
          )}

          {/* Add New Due */}
          <div className="grid md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="player-select">Player</Label>
              {availablePlayers.length > 0 ? (
                <Select value={newDue.playerName} onValueChange={(value) => setNewDue({...newDue, playerName: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Player" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlayers.map((player) => (
                      <SelectItem key={player.id} value={player.name}>
                        <div className="flex items-center gap-2">
                          <span>{getPositionEmoji(player.position)}</span>
                          <span>{player.name}</span>
                          <span className="text-xs text-[#7F8CAA]">({player.team})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="player-name"
                  value={newDue.playerName}
                  onChange={(e) => setNewDue({...newDue, playerName: e.target.value})}
                  placeholder="Enter player name"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (€)</Label>
              <Input
                id="amount"
                type="number"
                value={newDue.amount}
                onChange={(e) => setNewDue({...newDue, amount: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rest">Rest (€)</Label>
              <Input
                id="rest"
                type="number"
                value={newDue.rest}
                onChange={(e) => setNewDue({...newDue, rest: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newDue.description}
                onChange={(e) => setNewDue({...newDue, description: e.target.value})}
                placeholder="Match fee"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleAddDue} className="flex-1 bg-[#333446] text-white hover:bg-[#7F8CAA]">
                Add Due 💰
              </Button>
            </div>
          </div>

          {/* Auto-create dues for all players */}
          {availablePlayers.length > 0 && (
            <div className="flex justify-center">
              <Button 
                onClick={createDuesForAllPlayers}
                variant="outline"
                className="text-[#333446] border-[#B8CFCE] hover:bg-[#EAEFEF]"
              >
                Create Dues for All Players ({availablePlayers.length}) 🎯
              </Button>
            </div>
          )}

          {/* Enhanced Dues Table */}
          {dues.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#333446]">Player</TableHead>
                  <TableHead className="text-[#333446]">Amount</TableHead>
                  <TableHead className="text-[#333446]">Rest</TableHead>
                  <TableHead className="text-[#333446]">Actual Paid</TableHead>
                  <TableHead className="text-[#333446]">Change</TableHead>
                  <TableHead className="text-[#333446]">Description</TableHead>
                  <TableHead className="text-[#333446]">Status</TableHead>
                  <TableHead className="text-[#333446]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dues.map((due) => (
                  <TableRow key={due.id}>
                    <TableCell className="font-medium text-[#333446]">{due.playerName}</TableCell>
                    <TableCell>€{due.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={due.rest || due.amount}
                        onChange={(e) => updateDueRest(due.id, parseFloat(e.target.value) || 0)}
                        className="w-20 text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={due.actualPaid || ''}
                        onChange={(e) => updateDueActualPaid(due.id, parseFloat(e.target.value) || 0)}
                        className="w-20 text-sm"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        (due.change || 0) > 0 ? 'bg-orange-100 text-orange-800' : 'text-[#7F8CAA]'
                      }`}>
                        {due.change ? `€${due.change.toFixed(2)}` : '€0.00'}
                      </span>
                    </TableCell>
                    <TableCell className="text-[#7F8CAA]">{due.description}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        due.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {due.paid ? '✅ Paid' : '❌ Unpaid'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleDuePaid(due.id, !due.paid)}
                        className="text-[#333446] border-[#B8CFCE]"
                      >
                        {due.paid ? 'Mark Unpaid' : 'Mark Paid'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchTools;
