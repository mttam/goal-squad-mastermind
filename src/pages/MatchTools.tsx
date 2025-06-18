import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useFantacalcietto } from '@/context/FantacalciettoContext';
import { Player, Squad, Formation, MinimalFormation, Due, MatchMode } from '@/types/fantacalcietto';
import { useToast } from '@/hooks/use-toast';
import LineupBuilder from '@/components/LineupBuilder';

const MatchTools = () => {
  const { players, squads, formations, dues, addFormation, addDue, updateDue } = useFantacalcietto();
  const { toast } = useToast();

  const [selectedMode, setSelectedMode] = useState<MatchMode>('5vs5');  const [selectedSquadA, setSelectedSquadA] = useState('');
  const [selectedSquadB, setSelectedSquadB] = useState('');
  const [selectedFormationA, setSelectedFormationA] = useState('');
  const [selectedFormationB, setSelectedFormationB] = useState('');
  const [generatedFormation, setGeneratedFormation] = useState<MinimalFormation | null>(null);
  const [rotationMode, setRotationMode] = useState<MatchMode>('5vs5');
  const [selectedGoalkeepers, setSelectedGoalkeepers] = useState<string[]>([]);
  const [rotationSchedule, setRotationSchedule] = useState<{teamA: {segment: number, goalkeeper: Player}[], teamB: {segment: number, goalkeeper: Player}[]} | null>(null);
  const [newDue, setNewDue] = useState({
    playerName: '',
    amount: 0,
    description: '',
    actualPaid: 0,
    change: 0  });

  // Formation options for each match mode
  const formationOptions = {
    '5vs5': ['3-1', '2-2', '1-3', '2-1-1', '1-2-1', '1-1-2'],
    '6vs6': ['4-1', '3-2', '2-3', '1-4', '3-1-1', '2-2-1', '2-1-2', '1-3-1', '1-2-2', '1-1-3'],
    '7vs7': ['4-2', '3-3', '2-4', '5-1', '4-1-1', '3-2-1', '3-1-2', '2-3-1', '2-2-2', '2-1-3', '1-4-1', '1-3-2', '1-2-3'],
    '8vs8': ['4-3', '3-4', '5-2', '2-5', '6-1', '1-6', '5-1-1', '4-2-1', '4-1-2', '3-3-1', '3-2-2', '3-1-3', '2-4-1', '2-3-2', '2-2-3', '1-5-1', '1-4-2', '1-3-3', '1-2-4']
  };

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
  // Note: Formation storage is handled by addFormation in the generation function
  // generatedFormation is now MinimalFormation and only used for LineupBuilder
  /*
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
  */

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

  // Reset formation selections when mode changes
  useEffect(() => {
    setSelectedFormationA('');
    setSelectedFormationB('');
  }, [selectedMode]);

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

  const getFormationLabel = (formation: string) => {
    // Convert formation like "3-1" to "3-1 (3 Defenders, 1 Midfielder)"
    const parts = formation.split('-').map(Number);
    const labels = ['Defenders', 'Midfielders', 'Attackers'];
    const description = parts.map((count, index) => 
      count > 0 ? `${count} ${labels[index] || 'Players'}` : ''
    ).filter(Boolean).join(', ');
    
    return `${formation} (${description})`;
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

    if (!selectedFormationA || !selectedFormationB) {
      toast({
        title: "Missing Formations ❌",
        description: "Please select formations for both teams",
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
    }    // Create the full formation for storage
    const fullFormation: Formation = {
      id: `formation-${Date.now()}`,
      name: `${squadA.name} (${selectedFormationA}) vs ${squadB.name} (${selectedFormationB})`,
      mode: selectedMode,
      teamA: squadA.players,
      teamB: squadB.players,
      createdAt: new Date(),
    };

    // Create the minimal formation for the LineupBuilder
    const minimalFormation: MinimalFormation = {
      id: fullFormation.id,
      name: fullFormation.name,
      mode: selectedMode,
      formationA: selectedFormationA,
      formationB: selectedFormationB,
      createdAt: new Date(),
    };

    setGeneratedFormation(minimalFormation);
    addFormation(fullFormation); // Still save the full formation for other uses

    // Auto-sync rotation mode with formation mode
    setRotationMode(selectedMode);

    // Debug: Log the generated formation
    console.log('🔍 Generated Formation:', formation);
    console.log('📋 Formation Details:', {
      id: formation.id,
      name: formation.name,
      mode: formation.mode,
      teamA: formation.teamA,
      teamB: formation.teamB,
      createdAt: formation.createdAt
    });

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
  };  const handleGenerateRotation = () => {
    let teamAPlayers: Player[] = [];
    let teamBPlayers: Player[] = [];

    // Get players from the stored formations using the generatedFormation ID
    if (generatedFormation) {
      const storedFormation = formations.find(f => f.id === generatedFormation.id);
      if (storedFormation) {
        teamAPlayers = storedFormation.teamA;
        teamBPlayers = storedFormation.teamB;
      }
    }
    
    // Fallback if no stored formation found
    if (teamAPlayers.length === 0 || teamBPlayers.length === 0) {
      const allPlayers = players;
      const halfwayPoint = Math.ceil(allPlayers.length / 2);
      teamAPlayers = allPlayers.slice(0, halfwayPoint);
      teamBPlayers = allPlayers.slice(halfwayPoint);
    }

    const hasFixedGoalkeepersA = teamAPlayers.some(p => p.position === 'GK');
    const hasFixedGoalkeepersB = teamBPlayers.some(p => p.position === 'GK');
    const hasFixedGoalkeepers = hasFixedGoalkeepersA || hasFixedGoalkeepersB;

    let teamARotationPlayers: Player[] = [];
    let teamBRotationPlayers: Player[] = [];

    if (hasFixedGoalkeepers) {
      // Use only goalkeepers for rotation
      teamARotationPlayers = teamAPlayers.filter(p => p.position === 'GK');
      teamBRotationPlayers = teamBPlayers.filter(p => p.position === 'GK');
      
      if (teamARotationPlayers.length === 0 && teamBRotationPlayers.length === 0) {
        toast({
          title: "No Goalkeepers Available ❌",
          description: "No goalkeepers found in the selected teams",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Use all players for goalkeeper rotation
      teamARotationPlayers = teamAPlayers;
      teamBRotationPlayers = teamBPlayers;
    }

    if (teamARotationPlayers.length === 0 && teamBRotationPlayers.length === 0) {
      toast({
        title: "No Players Available ❌",
        description: "No players found for rotation",
        variant: "destructive",
      });
      return;
    }    const segmentsPerTeam = {
      '5vs5': 5,
      '6vs6': 6,
      '7vs7': 7,
      '8vs8': 8,
    }[rotationMode] || 5;

    // Generate Team A rotation schedule
    const teamASchedule: {segment: number, goalkeeper: Player}[] = [];
    if (teamARotationPlayers.length > 0) {
      for (let segment = 1; segment <= segmentsPerTeam; segment++) {
        const playerIndex = (segment - 1) % teamARotationPlayers.length;
        teamASchedule.push({ 
          segment: segment, 
          goalkeeper: teamARotationPlayers[playerIndex] 
        });
      }
    }

    // Generate Team B rotation schedule  
    const teamBSchedule: {segment: number, goalkeeper: Player}[] = [];
    if (teamBRotationPlayers.length > 0) {
      for (let segment = 1; segment <= segmentsPerTeam; segment++) {
        const playerIndex = (segment - 1) % teamBRotationPlayers.length;
        teamBSchedule.push({ 
          segment: segment, 
          goalkeeper: teamBRotationPlayers[playerIndex] 
        });
      }
    }

    setRotationSchedule({ teamA: teamASchedule, teamB: teamBSchedule });

    const rotationSource = generatedFormation 
      ? `formation "${generatedFormation.name}"`
      : "available players";    toast({
      title: "Rotation Generated! 🔄",
      description: hasFixedGoalkeepers 
        ? `Separate goalkeeper rotations created for each team (${segmentsPerTeam} segments each) in ${rotationMode} mode using ${rotationSource}`
        : `Separate player rotations created for each team (${segmentsPerTeam} segments each) in ${rotationMode} mode - all players from ${rotationSource} will rotate as goalkeeper`,
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

  // Helper function to get players from the stored formation
  const getFormationPlayers = (): { teamA: Player[], teamB: Player[] } => {
    if (generatedFormation) {
      const storedFormation = formations.find(f => f.id === generatedFormation.id);
      if (storedFormation) {
        return {
          teamA: storedFormation.teamA,
          teamB: storedFormation.teamB
        };
      }
    }
    return { teamA: [], teamB: [] };
  };

  // Helper function to get all players (formation or fallback to all players)
  const getAllPlayers = (): Player[] => {
    if (generatedFormation) {
      const { teamA, teamB } = getFormationPlayers();
      return [...teamA, ...teamB];
    }
    return players;
  };

  // Helper function to get goalkeepers count
  const getGoalkeepersCount = (): number => {
    return getAllPlayers().filter(p => p.position === 'GK').length;
  };

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
          </div>          <div className="grid md:grid-cols-2 gap-4">
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

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Formation for Team A</Label>
              <Select value={selectedFormationA} onValueChange={setSelectedFormationA}>
                <SelectTrigger>
                  <SelectValue placeholder="Select formation for Team A" />
                </SelectTrigger>
                <SelectContent>
                  {formationOptions[selectedMode].map((formation) => (
                    <SelectItem key={formation} value={formation}>
                      🔴 {getFormationLabel(formation)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Formation for Team B</Label>
              <Select value={selectedFormationB} onValueChange={setSelectedFormationB}>
                <SelectTrigger>
                  <SelectValue placeholder="Select formation for Team B" />
                </SelectTrigger>
                <SelectContent>
                  {formationOptions[selectedMode].map((formation) => (
                    <SelectItem key={formation} value={formation}>
                      🔵 {getFormationLabel(formation)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>          <Button 
            onClick={handleGenerateFormation}
            className="bg-[#333446] text-white hover:bg-[#7F8CAA]"
            disabled={!selectedSquadA || !selectedSquadB || !selectedFormationA || !selectedFormationB}
          >
            Generate Formation 📋
          </Button>
        </CardContent>
      </Card>      {/* Generated Formation display section */}
      {generatedFormation && (
        <Card className="bg-white border-[#B8CFCE]">
          <CardHeader>
            <CardTitle className="text-[#333446]">Formation Generated ⚽</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-[#333446]">🔴 Team A</h3>
                <p className="text-[#7F8CAA]">Formation: {getFormationLabel(generatedFormation.formationA)}</p>
                <p className="text-[#7F8CAA]">Mode: {generatedFormation.mode}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-[#333446]">🔵 Team B</h3>
                <p className="text-[#7F8CAA]">Formation: {getFormationLabel(generatedFormation.formationB)}</p>
                <p className="text-[#7F8CAA]">Mode: {generatedFormation.mode}</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-[#EAEFEF] rounded-lg">
              <p className="text-sm text-[#7F8CAA]">
                Formation ready for Interactive Lineup Builder below 👇
              </p>
            </div>
          </CardContent>
        </Card>
      )}{/* Goalkeeper Rotation Generator section */}
      <Card className="bg-white border-[#B8CFCE]">
        <CardHeader>
          <CardTitle className="text-[#333446]">Goalkeeper Rotation Generator 🔄</CardTitle>
          <p className="text-sm text-[#7F8CAA]">
            {generatedFormation 
              ? `Using players from: ${generatedFormation.name}` 
              : "Generate a formation above to use specific teams, or select rotation mode for all players"}
          </p>
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

          {/* Team Selection for Rotation */}
          {generatedFormation && (
            <div className="p-3 bg-[#EAEFEF] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-[#333446]">Using Formation:</span>
                <span className="text-sm text-[#7F8CAA]">{generatedFormation.name}</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-[#333446]">🔴 Team A:</span>
                  <span className="ml-2 text-[#7F8CAA]">{generatedFormation.teamA.length} players</span>
                  {selectedFormationA && (
                    <span className="ml-2 text-[#7F8CAA]">({selectedFormationA})</span>
                  )}
                </div>
                <div>
                  <span className="font-medium text-[#333446]">🔵 Team B:</span>
                  <span className="ml-2 text-[#7F8CAA]">{generatedFormation.teamB.length} players</span>
                  {selectedFormationB && (
                    <span className="ml-2 text-[#7F8CAA]">({selectedFormationB})</span>
                  )}
                </div>
              </div>
            </div>
          )}          <div className="space-y-2">
            <Label>
              {(generatedFormation 
                ? [...generatedFormation.teamA, ...generatedFormation.teamB].filter(p => p.position === 'GK').length 
                : players.filter(p => p.position === 'GK').length) > 0 
                ? "Select Goalkeepers" 
                : "Player Rotation (No Fixed Goalkeepers)"}
            </Label>            {getGoalkeepersCount() === 0 && (
              <p className="text-sm text-[#7F8CAA] italic">
                {generatedFormation 
                  ? "No fixed goalkeepers found in formation. All formation players will be included in rotation automatically."
                  : "No fixed goalkeepers found. All players will be included in rotation automatically."}
              </p>
            )}
            {getGoalkeepersCount() > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {getAllPlayers()
                  .filter(p => p.position === 'GK')
                  .map((player) => {
                    const { teamA } = getFormationPlayers();
                    const teamLabel = generatedFormation 
                      ? (teamA.find(p => p.id === player.id) ? '🔴' : '🔵')
                      : '';
                    return (
                      <div key={player.id} className="flex items-center space-x-2 p-2 rounded bg-[#EAEFEF]">
                        <Checkbox
                          checked={selectedGoalkeepers.includes(player.id)}
                          onCheckedChange={(checked) => handleGoalkeeperSelection(player.id, checked as boolean)}
                        />
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <span className="text-sm">🥅</span>
                          {teamLabel && <span className="text-sm">{teamLabel}</span>}
                          <span className="text-sm font-medium text-[#333446] truncate">{player.name}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>          <Button 
            onClick={handleGenerateRotation}
            className="bg-[#333446] text-white hover:bg-[#7F8CAA]"
            disabled={getGoalkeepersCount() > 0}
            title={getGoalkeepersCount() > 0 
              ? "Disabled: Fixed goalkeepers found - separate rotations not needed" 
              : "Click to generate separate goalkeeper rotations for each team"}          >
            Generate Rotation 🔄
            {getGoalkeepersCount() > 0 ? ' (Disabled)' : ''}
          </Button>
        </CardContent>
      </Card>      {/* Rotation Schedule display */}
      {rotationSchedule && (
        <div className="space-y-4">
          {generatedFormation && (
            <div className="text-center p-3 bg-[#EAEFEF] rounded-lg">
              <h3 className="font-medium text-[#333446]">Rotation Schedule for:</h3>
              <p className="text-sm text-[#7F8CAA]">{generatedFormation.name}</p>
              <p className="text-xs text-[#7F8CAA] mt-1">Mode: {rotationMode}</p>
            </div>
          )}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="bg-white border-[#B8CFCE]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#333446] text-lg">
                  🔴 Team A Rotation
                  {selectedFormationA && (
                    <span className="text-sm text-[#7F8CAA] font-normal ml-2">({selectedFormationA})</span>
                  )}
                </CardTitle>
              </CardHeader>              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {rotationSchedule.teamA.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded bg-[#EAEFEF] text-sm">
                      <span className="font-bold text-[#333446] w-6 text-center">#{item.segment}</span>
                      <span>🥅</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#333446] truncate">{item.goalkeeper.name}</div>
                        <div className="text-xs text-[#7F8CAA]">({item.goalkeeper.position})</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#B8CFCE]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#333446] text-lg">
                  🔵 Team B Rotation
                  {selectedFormationB && (
                    <span className="text-sm text-[#7F8CAA] font-normal ml-2">({selectedFormationB})</span>
                  )}
                </CardTitle>
              </CardHeader>              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {rotationSchedule.teamB.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded bg-[#EAEFEF] text-sm">
                      <span className="font-bold text-[#333446] w-6 text-center">#{item.segment}</span>
                      <span>🥅</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#333446] truncate">{item.goalkeeper.name}</div>
                        <div className="text-xs text-[#7F8CAA]">({item.goalkeeper.position})</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}      
      {/* Interactive Lineup Builder - Clean Integration */}
      {generatedFormation ? (
        <LineupBuilder formation={generatedFormation} />
      ) : (
        <Card className="bg-white border-[#B8CFCE]">
          <CardHeader>
            <CardTitle className="text-[#333446]">Interactive Lineup Builder ⚽</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚽</div>
              <p className="text-[#7F8CAA] mb-4">No formation generated yet</p>
              <p className="text-sm text-[#7F8CAA]">
                Use the Formation Generator above to create a formation and see the interactive lineup
              </p>
            </div>
             </CardContent>
      </Card>
          )}
       
      
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
