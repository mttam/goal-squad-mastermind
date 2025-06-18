import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { Player, Squad, Formation, Due, MatchMode } from '@/types/fantacalcietto';
import { useToast } from '@/hooks/use-toast';
import LineupBuilder from '@/components/LineupBuilder';

const MatchTools = () => {
  const { players, squads, formations, dues, addFormation, addDue, updateDue } = useFantacalcietto();
  const { toast } = useToast();

  const [selectedMode, setSelectedMode] = useState<MatchMode>('5vs5');
  const [selectedSquadA, setSelectedSquadA] = useState('');
  const [selectedSquadB, setSelectedSquadB] = useState('');
  const [generatedFormation, setGeneratedFormation] = useState<Formation | null>(null);
  const [rotationMode, setRotationMode] = useState<MatchMode>('5vs5');
  const [selectedGoalkeepers, setSelectedGoalkeepers] = useState<string[]>([]);
  const [rotationSchedule, setRotationSchedule] = useState<{teamA: {segment: number, goalkeeper: Player}[], teamB: {segment: number, goalkeeper: Player}[]} | null>(null);
  const [newDue, setNewDue] = useState({
    playerName: '',
    amount: 0,
    description: '',
    actualPaid: 0,
    change: 0
  });

  // Local storage keys
  const STORAGE_KEYS = {
    formations: 'fantacalcietto_formations',
    dues: 'fantacalcietto_dues',
    goalkeepers: 'fantacalcietto_goalkeepers'
  };

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      // Load saved goalkeepers selection
      const savedGoalkeepers = localStorage.getItem(STORAGE_KEYS.goalkeepers);
      if (savedGoalkeepers) {
        setSelectedGoalkeepers(JSON.parse(savedGoalkeepers));
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Save formations to localStorage whenever generatedFormation changes
  useEffect(() => {
    if (generatedFormation) {
      try {
        const savedFormations = localStorage.getItem(STORAGE_KEYS.formations);
        let formationsArray = savedFormations ? JSON.parse(savedFormations) : [];
        
        // Add new formation or update existing
        const existingIndex = formationsArray.findIndex((f: Formation) => f.id === generatedFormation.id);
        if (existingIndex >= 0) {
          formationsArray[existingIndex] = generatedFormation;
        } else {
          formationsArray.push(generatedFormation);
        }
        
        localStorage.setItem(STORAGE_KEYS.formations, JSON.stringify(formationsArray));
      } catch (error) {
        console.error('Error saving formation to localStorage:', error);
      }
    }
  }, [generatedFormation]);

  // Save dues to localStorage whenever dues change
  useEffect(() => {
    if (dues.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEYS.dues, JSON.stringify(dues));
      } catch (error) {
        console.error('Error saving dues to localStorage:', error);
      }
    }
  }, [dues]);

  // Save goalkeepers selection to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.goalkeepers, JSON.stringify(selectedGoalkeepers));
    } catch (error) {
      console.error('Error saving goalkeepers to localStorage:', error);
    }
  }, [selectedGoalkeepers]);

  const modes = [
    { value: '5vs5', label: '5 vs 5', icon: '⚽' },
    { value: '6vs6', label: '6 vs 6', icon: '⚽' },
    { value: '7vs7', label: '7 vs 7', icon: '⚽' },
    { value: '8vs8', label: '8 vs 8', icon: '⚽' },
  ];

  const getPositionEmoji = (position: string) => {
    switch (position) {
      case 'GK': return '🥅';
      case 'DEF': return '🛡️';
      case 'MID': return '⚙️';
      case 'ATT': return '⚔️';
      default: return '⚽';
    }
  };

  const handleGenerateFormation = () => {
    if (!selectedSquadA || !selectedSquadB) {
      toast({
        title: "Missing Teams ❌",
        description: "Please select both Team A and Team B",
        variant: "destructive",
      });
      return;
    }

    const squadA = squads.find(s => s.id === selectedSquadA);
    const squadB = squads.find(s => s.id === selectedSquadB);

    if (!squadA || !squadB) {
      toast({
        title: "Error ❌",
        description: "Selected squads not found",
        variant: "destructive",
      });
      return;
    }

    const formation: Formation = {
      id: `formation-${Date.now()}`,
      name: `${squadA.name} vs ${squadB.name}`,
      mode: selectedMode,
      teamA: squadA.players,
      teamB: squadB.players,
      createdAt: new Date(),
    };

    setGeneratedFormation(formation);
    addFormation(formation);

    toast({
      title: "Formation Created! ⚽",
      description: `Match formation for ${selectedMode} mode is ready`,
    });
  };

  const handleGoalkeeperSelection = (playerId: string, checked: boolean) => {
    if (checked) {
      setSelectedGoalkeepers(prev => [...prev, playerId]);
    } else {
      setSelectedGoalkeepers(prev => prev.filter(id => id !== playerId));
    }
  };

  const handleGenerateRotation = () => {
    if (selectedGoalkeepers.length === 0) {
      toast({
        title: "No Goalkeepers Selected ❌",
        description: "Please select at least one goalkeeper",
        variant: "destructive",
      });
      return;
    }

    const segmentsPerMatch = {
      '5vs5': 10,
      '6vs6': 12,
      '7vs7': 14,
      '8vs8': 16,
    }[rotationMode] || 10;

    const goalkeepers = players.filter(p => selectedGoalkeepers.includes(p.id));
    const segmentsPerGK = Math.floor(segmentsPerMatch / goalkeepers.length);
    const extraSegments = segmentsPerMatch % goalkeepers.length;

    const teamASchedule: {segment: number, goalkeeper: Player}[] = [];
    const teamBSchedule: {segment: number, goalkeeper: Player}[] = [];

    let currentSegment = 1;
    
    goalkeepers.forEach((gk, index) => {
      const segments = segmentsPerGK + (index < extraSegments ? 1 : 0);
      
      for (let i = 0; i < segments; i++) {
        if (currentSegment % 2 === 1) {
          teamASchedule.push({ segment: currentSegment, goalkeeper: gk });
        } else {
          teamBSchedule.push({ segment: currentSegment, goalkeeper: gk });
        }
        currentSegment++;
      }
    });

    setRotationSchedule({ teamA: teamASchedule, teamB: teamBSchedule });

    toast({
      title: "Rotation Generated! 🔄",
      description: `Created goalkeeper rotation for ${goalkeepers.length} goalkeepers`,
    });
  };

  const handleAddDue = () => {
    if (!newDue.playerName || newDue.amount <= 0) {
      toast({
        title: "Invalid Due ❌",
        description: "Please enter a valid player name and amount",
        variant: "destructive",
      });
      return;
    }

    const due: Due = {
      id: `due-${Date.now()}`,
      playerName: newDue.playerName,
      amount: newDue.amount,
      description: newDue.description,
      paid: false,
      date: new Date(),
      actualPaid: newDue.actualPaid || undefined,
      change: newDue.change || undefined,
    };

    addDue(due);
    setNewDue({
      playerName: '',
      amount: 0,
      description: '',
      actualPaid: 0,
      change: 0
    });

    toast({
      title: "Due Added! 💰",
      description: `Added due for ${due.playerName}`,
    });
  };

  const handlePayDue = (dueId: string) => {
    updateDue(dueId, { paid: true });
    toast({
      title: "Due Paid! ✅",
      description: "Due has been marked as paid",
    });
  };

  const calculateFinancialSummary = () => {
    const totalDues = dues.reduce((sum, due) => sum + due.amount, 0);
    const totalActualPaid = dues.reduce((sum, due) => sum + (due.actualPaid || 0), 0);
    const totalChange = dues.reduce((sum, due) => sum + (due.change || 0), 0);
    const totalRemaining = dues
      .filter(due => !due.paid)
      .reduce((sum, due) => sum + due.amount, 0);

    return { totalDues, totalActualPaid, totalChange, totalRemaining };
  };

  const financialSummary = calculateFinancialSummary();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-[#333446]">Match Tools ⚽</h1>
        <p className="text-[#7F8CAA]">Manage formations, goalkeeper rotations, and player dues</p>
      </div>

      
      {/* Formation Generator */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="text-[#333446]">Formation Generator 📋</CardTitle>
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

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Team A</Label>
              <Select value={selectedSquadA} onValueChange={setSelectedSquadA}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Team A" />
                </SelectTrigger>
                <SelectContent>
                  {squads.filter(s => s.mode === selectedMode).map((squad) => (
                    <SelectItem key={squad.id} value={squad.id}>
                      🔴 {squad.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Team B</Label>
              <Select value={selectedSquadB} onValueChange={setSelectedSquadB}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Team B" />
                </SelectTrigger>
                <SelectContent>
                  {squads.filter(s => s.mode === selectedMode && s.id !== selectedSquadA).map((squad) => (
                    <SelectItem key={squad.id} value={squad.id}>
                      🔵 {squad.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleGenerateFormation}
            className="bg-[#333446] text-white hover:bg-[#7F8CAA]"
            disabled={!selectedSquadA || !selectedSquadB}
          >
            Generate Formation 📋
          </Button>
        </CardContent>
      </Card>

      {/* Generated Formation display section */}
      {generatedFormation && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white border-[#B8CFCE]">
            <CardHeader>
              <CardTitle className="text-[#333446]">🔴 {generatedFormation.teamA[0]?.name.split(' ')[0] || 'Team A'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {generatedFormation.teamA.map((player, index) => (
                  <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#EAEFEF]">
                    <span className="font-bold text-[#333446] w-6">{index + 1}</span>
                    <span className="text-lg">{getPositionEmoji(player.position)}</span>
                    <div className="flex-1">
                      <div className="font-medium text-[#333446]">{player.name}</div>
                      <div className="text-sm text-[#7F8CAA]">{player.position}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#B8CFCE]">
            <CardHeader>
              <CardTitle className="text-[#333446]">🔵 {generatedFormation.teamB[0]?.name.split(' ')[0] || 'Team B'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {generatedFormation.teamB.map((player, index) => (
                  <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#EAEFEF]">
                    <span className="font-bold text-[#333446] w-6">{index + 1}</span>
                    <span className="text-lg">{getPositionEmoji(player.position)}</span>
                    <div className="flex-1">
                      <div className="font-medium text-[#333446]">{player.name}</div>
                      <div className="text-sm text-[#7F8CAA]">{player.position}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goalkeeper Rotation Generator section */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="text-[#333446]">Goalkeeper Rotation Generator 🔄</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {modes.map((mode) => (
              <Button
                key={mode.value}
                variant={rotationMode === mode.value ? "default" : "outline"}
                onClick={() => setRotationMode(mode.value as MatchMode)}
                className={`px-2 py-1 h-auto flex flex-col gap-1 text-xs ${
                  rotationMode === mode.value 
                    ? 'bg-[#333446] text-white' 
                    : 'text-[#333446] border-[#B8CFCE] hover:bg-[#EAEFEF]'
                }`}
              >
                <span className="text-lg">{mode.icon}</span>
                <span className="font-medium">{mode.label}</span>
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Select Goalkeepers</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {players.filter(p => p.position === 'GK').map((player) => (
                <div key={player.id} className="flex items-center space-x-2 p-2 rounded bg-[#EAEFEF]">
                  <Checkbox
                    checked={selectedGoalkeepers.includes(player.id)}
                    onCheckedChange={(checked) => handleGoalkeeperSelection(player.id, checked as boolean)}
                  />
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="text-sm">🥅</span>
                    <span className="text-sm font-medium text-[#333446] truncate">{player.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleGenerateRotation}
            className="bg-[#333446] text-white hover:bg-[#7F8CAA]"
            disabled={selectedGoalkeepers.length === 0}
          >
            Generate Rotation 🔄
          </Button>
        </CardContent>
      </Card>

      {/* Rotation Schedule display */}
      {rotationSchedule && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-white border-[#B8CFCE]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#333446] text-lg">🔴 Team A Rotation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {rotationSchedule.teamA.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded bg-[#EAEFEF] text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#333446] w-4">{item.segment}</span>
                      <span>🥅</span>
                      <span className="font-medium text-[#333446]">{item.goalkeeper.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#B8CFCE]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#333446] text-lg">🔵 Team B Rotation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {rotationSchedule.teamB.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded bg-[#EAEFEF] text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#333446] w-4">{item.segment}</span>
                      <span>🥅</span>
                      <span className="font-medium text-[#333446]">{item.goalkeeper.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Interactive Lineup Builder - now integrated with Formation Generator */}
      <LineupBuilder formation={generatedFormation} />
      
      {/* Dues Management section with all the existing logic and UI */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="text-[#333446]">Dues Management 💰</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Player Name</Label>
              <Input
                value={newDue.playerName}
                onChange={(e) => setNewDue({...newDue, playerName: e.target.value})}
                placeholder="Enter player name"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (€)</Label>
              <Input
                type="number"
                value={newDue.amount}
                onChange={(e) => setNewDue({...newDue, amount: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Actual Paid (€)</Label>
              <Input
                type="number"
                value={newDue.actualPaid}
                onChange={(e) => setNewDue({...newDue, actualPaid: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Change (€)</Label>
              <Input
                type="number"
                value={newDue.change}
                onChange={(e) => setNewDue({...newDue, change: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newDue.description}
                onChange={(e) => setNewDue({...newDue, description: e.target.value})}
                placeholder="Optional description"
              />
            </div>
          </div>

          <Button 
            onClick={handleAddDue}
            className="bg-[#333446] text-white hover:bg-[#7F8CAA]"
          >
            Add Due 💰
          </Button>

          {dues.length > 0 && (
            <div className="space-y-4">
              <div className="bg-[#EAEFEF] p-4 rounded-lg">
                <h3 className="font-medium text-[#333446] mb-2">Financial Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-[#7F8CAA]">Total Dues:</span>
                    <div className="font-bold text-[#333446]">€{financialSummary.totalDues}</div>
                  </div>
                  <div>
                    <span className="text-[#7F8CAA]">Actual Received:</span>
                    <div className="font-bold text-green-600">€{financialSummary.totalActualPaid}</div>
                  </div>
                  <div>
                    <span className="text-[#7F8CAA]">Total Change:</span>
                    <div className="font-bold text-orange-600">€{financialSummary.totalChange}</div>
                  </div>
                  <div>
                    <span className="text-[#7F8CAA]">Still Owed:</span>
                    <div className="font-bold text-red-600">€{financialSummary.totalRemaining}</div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#B8CFCE]">
                      <th className="text-left p-2 text-[#333446]">Player</th>
                      <th className="text-left p-2 text-[#333446]">Amount</th>
                      <th className="text-left p-2 text-[#333446]">Actual Paid</th>
                      <th className="text-left p-2 text-[#333446]">Change</th>
                      <th className="text-left p-2 text-[#333446]">Description</th>
                      <th className="text-left p-2 text-[#333446]">Status</th>
                      <th className="text-left p-2 text-[#333446]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dues.map((due) => (
                      <tr key={due.id} className="border-b border-[#EAEFEF]">
                        <td className="p-2 font-medium text-[#333446]">{due.playerName}</td>
                        <td className="p-2 text-[#333446]">€{due.amount}</td>
                        <td className="p-2 text-[#333446]">€{due.actualPaid || 0}</td>
                        <td className="p-2 text-[#333446]">€{due.change || 0}</td>
                        <td className="p-2 text-[#7F8CAA]">{due.description || '-'}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            due.paid 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {due.paid ? '✅ Paid' : '❌ Unpaid'}
                          </span>
                        </td>
                        <td className="p-2">
                          {!due.paid && (
                            <Button
                              size="sm"
                              onClick={() => handlePayDue(due.id)}
                              className="bg-green-600 text-white hover:bg-green-700"
                            >
                              Mark Paid
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchTools;
