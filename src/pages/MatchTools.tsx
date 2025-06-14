
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { MatchMode, Due } from '@/types/fantacalcietto';
import { useToast } from '@/hooks/use-toast';

const MatchTools = () => {
  const { squads, dues, addDue, updateDue } = useFantacalcietto();
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState<MatchMode>('5vs5');
  const [selectedSquadA, setSelectedSquadA] = useState('');
  const [selectedSquadB, setSelectedSquadB] = useState('');
  const [goalShifts, setGoalShifts] = useState<string[]>([]);
  
  // Due form state
  const [newDue, setNewDue] = useState({
    playerName: '',
    amount: '',
    description: '',
  });

  const modes = [
    { value: '5vs5', label: '5 vs 5', icon: '⚽' },
    { value: '6vs6', label: '6 vs 6', icon: '🏃' },
    { value: '7vs7', label: '7 vs 7', icon: '🤾' },
    { value: '8vs8', label: '8 vs 8', icon: '🏈' },
  ];

  const availableSquads = squads.filter(squad => squad.mode === selectedMode);

  const generateGoalShifts = () => {
    const shifts = ['First Half', 'Second Half', 'Extra Time'];
    const randomShifts = [];
    
    for (let i = 0; i < 6; i++) {
      const randomShift = shifts[Math.floor(Math.random() * shifts.length)];
      const minute = Math.floor(Math.random() * 45) + 1;
      randomShifts.push(`${randomShift} - ${minute}'`);
    }
    
    setGoalShifts(randomShifts);
    toast({
      title: "Goal Shifts Generated! ⚽",
      description: "Random goal timing shifts created",
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

    const due: Due = {
      id: `due-${Date.now()}`,
      playerName: newDue.playerName,
      amount: parseFloat(newDue.amount),
      description: newDue.description || 'Match fee',
      paid: false,
      date: new Date(),
    };

    addDue(due);
    setNewDue({ playerName: '', amount: '', description: '' });
    
    toast({
      title: "Due Added! 💰",
      description: `Added €${due.amount} due for ${due.playerName}`,
    });
  };

  const toggleDuePaid = (dueId: string, paid: boolean) => {
    updateDue(dueId, { paid });
    toast({
      title: paid ? "Payment Recorded! ✅" : "Payment Unmarked ❌",
      description: paid ? "Due marked as paid" : "Due marked as unpaid",
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

          {/* Show Selected Teams */}
          {selectedSquadA && selectedSquadB && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {[selectedSquadA, selectedSquadB].map((squadId, index) => {
                const squad = squads.find(s => s.id === squadId);
                if (!squad) return null;
                
                return (
                  <div key={squadId} className="space-y-2">
                    <h3 className="font-medium text-[#333446] flex items-center gap-2">
                      {index === 0 ? '🔴' : '🔵'} {squad.name}
                    </h3>
                    <div className="space-y-1">
                      {squad.players.map((player) => (
                        <div 
                          key={player.id}
                          className="flex items-center gap-2 p-2 rounded bg-[#EAEFEF]"
                        >
                          <span>{getPositionEmoji(player.position)}</span>
                          <span className="text-sm text-[#333446]">{player.name}</span>
                          <span className="text-xs text-[#7F8CAA] ml-auto">{player.position}</span>
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

      {/* Goal Shifts Generator */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="text-[#333446]">Goal Shifts Generator ⏰</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={generateGoalShifts}
            className="bg-[#333446] text-white hover:bg-[#7F8CAA]"
          >
            Generate Random Goal Shifts 🎲
          </Button>
          
          {goalShifts.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {goalShifts.map((shift, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg bg-[#EAEFEF] text-center text-[#333446] font-medium"
                >
                  ⚽ {shift}
                </div>
              ))}
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
          {/* Add New Due */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="player-name">Player Name</Label>
              <Input
                id="player-name"
                value={newDue.playerName}
                onChange={(e) => setNewDue({...newDue, playerName: e.target.value})}
                placeholder="Enter player name"
              />
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
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newDue.description}
                onChange={(e) => setNewDue({...newDue, description: e.target.value})}
                placeholder="Match fee"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddDue} className="w-full bg-[#333446] text-white hover:bg-[#7F8CAA]">
                Add Due 💰
              </Button>
            </div>
          </div>

          {/* Dues Table */}
          {dues.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#333446]">Player</TableHead>
                  <TableHead className="text-[#333446]">Amount</TableHead>
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
