import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MatchMode, Formation, Player } from '@/types/fantacalcietto';

interface LineupBuilderProps {
  className?: string;
  formation?: Formation | null;
}

interface FieldPlayer {
  id: number;
  x: number;
  y: number;
  isGK?: boolean;
  team: 'A' | 'B';
  originalPlayer?: Player;
}

const LineupBuilder: React.FC<LineupBuilderProps> = ({ className, formation }) => {
  const formations = {
    '5vs5': ['3-1', '2-2', '1-3', '2-1-1', '1-2-1', '1-1-2'],
    '6vs6': ['4-1', '3-2', '2-3', '1-4', '3-1-1', '2-2-1', '2-1-2', '1-3-1', '1-2-2', '1-1-3'],
    '7vs7': ['4-2', '3-3', '2-4', '5-1', '4-1-1', '3-2-1', '3-1-2', '2-3-1', '2-2-2', '2-1-3', '1-4-1', '1-3-2', '1-2-3'],
    '8vs8': ['4-3', '3-4', '5-2', '2-5', '6-1', '1-6', '5-1-1', '4-2-1', '4-1-2', '3-3-1', '3-2-2', '3-1-3', '2-4-1', '2-3-2', '2-2-3', '1-5-1', '1-4-2', '1-3-3', '1-2-4']
  };

  const [selectedMode, setSelectedMode] = useState<MatchMode>('5vs5');
  const [selectedFormationA, setSelectedFormationA] = useState<string>('');
  const [selectedFormationB, setSelectedFormationB] = useState<string>('');
  const [players, setPlayers] = useState<FieldPlayer[]>([]);
  const [draggedPlayer, setDraggedPlayer] = useState<number | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);  // Update when formation prop changes
  useEffect(() => {
    if (formation) {
      setSelectedMode(formation.mode);
      const teamAPlayers = generateTeamPositions(formation.teamA, 'A', formation.mode);
      const teamBPlayers = generateTeamPositions(formation.teamB, 'B', formation.mode);
      setPlayers([...teamAPlayers, ...teamBPlayers]);
    }
  }, [formation]);

  // Recalculate positions when field becomes available or dimensions change
  useEffect(() => {
    if (!fieldRef.current) return;

    const recalculatePositions = () => {
      if (players.length > 0) {
        if (formation) {
          // Regenerate from formation data
          const teamAPlayers = generateTeamPositions(formation.teamA, 'A', formation.mode);
          const teamBPlayers = generateTeamPositions(formation.teamB, 'B', formation.mode);
          setPlayers([...teamAPlayers, ...teamBPlayers]);
        } else if (selectedFormationA && selectedFormationB) {
          // Regenerate from selected formations
          const newPositions = generateFormationPositions(selectedFormationA, selectedFormationB, selectedMode);
          setPlayers(newPositions);
        }
      }
    };

    // Initial calculation when field becomes available
    recalculatePositions();

    const handleResize = () => {
      recalculatePositions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [players.length, formation, selectedFormationA, selectedFormationB, selectedMode]);

  // Additional effect to handle initial positioning when formations are first applied
  useEffect(() => {
    if (selectedFormationA && selectedFormationB && fieldRef.current && players.length === 0) {
      const newPositions = generateFormationPositions(selectedFormationA, selectedFormationB, selectedMode);
      setPlayers(newPositions);
    }
  }, [selectedFormationA, selectedFormationB, selectedMode]);

  const getPlayerCount = (mode: MatchMode): number => {
    switch (mode) {
      case '5vs5': return 5;
      case '6vs6': return 6;
      case '7vs7': return 7;
      case '8vs8': return 8;
      default: return 5;
    }
  };  const generateTeamPositions = (teamPlayers: Player[], team: 'A' | 'B', mode: MatchMode): FieldPlayer[] => {
    const positions: FieldPlayer[] = [];
    // Get field dimensions from the actual div element, fallback to default values
    const fieldWidth = fieldRef.current?.clientWidth || 300;
    const fieldHeight = fieldRef.current?.clientHeight || 400;
    const isTeamB = team === 'B';// Goalkeeper position (top for Team A, bottom for Team B)
    const gkPlayer = teamPlayers.find(p => p.position === 'GK') || teamPlayers[0];
    positions.push({
      id: parseInt(gkPlayer.id),
      x: fieldWidth * 0.5, // Center horizontally (50% of field width)
      y: isTeamB ? fieldHeight * 0.9 : fieldHeight * 0.1, // 10% from top/bottom
      isGK: true,
      team,
      originalPlayer: gkPlayer
    });    // Outfield players - arrange them in a basic formation vertically
    const outfieldPlayers = teamPlayers.filter(p => p.position !== 'GK');
    const playerCount = getPlayerCount(mode);
    const sectionsCount = Math.min(3, playerCount - 1); // Max 3 sections (DEF, MID, ATT)
    const availableHeight = fieldHeight * 0.25; // 25% of field height for formation (reduced from 30%)
    const sectionHeight = availableHeight / sectionsCount;
    
    outfieldPlayers.forEach((player, index) => {
      const sectionIndex = Math.floor(index / Math.ceil(outfieldPlayers.length / sectionsCount));
      const positionInSection = index % Math.ceil(outfieldPlayers.length / sectionsCount);
      const playersInSection = Math.ceil(outfieldPlayers.length / sectionsCount);
      
      const sectionY = isTeamB 
        ? fieldHeight * 0.75 - (sectionIndex + 1) * sectionHeight // Start from 75% for Team B
        : fieldHeight * 0.12 + (sectionIndex + 1) * sectionHeight; // Start from 12% for Team A (closer to GK)
      
      // Center players horizontally with relative spacing
      const marginRatio = 0.15; // 15% margins on each side
      const availableWidth = fieldWidth * (1 - 2 * marginRatio);
      const playerX = fieldWidth * marginRatio + (availableWidth / (playersInSection + 1)) * (positionInSection + 1);
      
      positions.push({
        id: parseInt(player.id),
        x: playerX,
        y: sectionY,
        team,
        originalPlayer: player
      });
    });

    return positions;
  };  const generateFormationPositions = (formationA: string, formationB: string, mode: MatchMode): FieldPlayer[] => {
    const positions: FieldPlayer[] = [];
    // Get field dimensions from the actual div element, fallback to default values
    const fieldWidth = fieldRef.current?.clientWidth || 300;
    const fieldHeight = fieldRef.current?.clientHeight || 400;
    
    // Team A (top side - blue) - use unique IDs but display team-based numbers
    positions.push({
      id: 1001, // Unique ID for Team A GK
      x: fieldWidth * 0.5, // Center horizontally (50% of field width)
      y: fieldHeight * 0.1, // 10% from top
      isGK: true,
      team: 'A'
    });

    const formationPartsA = formationA.split('-').map(Number);
    let uniqueIdA = 1002; // Start unique IDs for Team A outfield players
    
    const sectionsCountA = formationPartsA.length;
    const availableHeightA = fieldHeight * 0.25; // 25% of field height for formation (reduced from 30%)
    const sectionHeightA = availableHeightA / sectionsCountA;
    
    formationPartsA.forEach((playersInSection, sectionIndex) => {
      // Start from 12% of field height and move towards center (closer to GK)
      const sectionY = fieldHeight * 0.12 + (sectionIndex + 1) * sectionHeightA;
      
      for (let i = 0; i < playersInSection; i++) {
        // Center players horizontally with relative spacing
        const marginRatio = 0.15; // 15% margins on each side
        const availableWidth = fieldWidth * (1 - 2 * marginRatio);
        const playerX = fieldWidth * marginRatio + (availableWidth / (playersInSection + 1)) * (i + 1);
        positions.push({
          id: uniqueIdA,
          x: playerX,
          y: sectionY,
          team: 'A'
        });
        uniqueIdA++;
      }
    });

    // Team B (bottom side - red) - use unique IDs but display team-based numbers
    positions.push({
      id: 2001, // Unique ID for Team B GK
      x: fieldWidth * 0.5, // Center horizontally (50% of field width)
      y: fieldHeight * 0.9, // 10% from bottom
      isGK: true,
      team: 'B'
    });

    const formationPartsB = formationB.split('-').map(Number);
    let uniqueIdB = 2002; // Start unique IDs for Team B outfield players
    const sectionsCountB = formationPartsB.length;
    const availableHeightB = fieldHeight * 0.25; // 25% of field height for formation (reduced from 30%)
    const sectionHeightB = availableHeightB / sectionsCountB;

    formationPartsB.forEach((playersInSection, sectionIndex) => {
      // Start from 88% of field height and move towards center (closer to GK)
      const sectionY = fieldHeight * 0.88 - (sectionIndex + 1) * sectionHeightB;
      
      for (let i = 0; i < playersInSection; i++) {
        // Center players horizontally with relative spacing
        const marginRatio = 0.15; // 15% margins on each side
        const availableWidth = fieldWidth * (1 - 2 * marginRatio);
        const playerX = fieldWidth * marginRatio + (availableWidth / (playersInSection + 1)) * (i + 1);
        
        positions.push({
          id: uniqueIdB,
          x: playerX,
          y: sectionY,
          team: 'B'
        });
        uniqueIdB++;
      }
    });

    return positions;
  };const handleFormationSelect = () => {
    if (!selectedFormationA || !selectedFormationB) return;
    
    const newPositions = generateFormationPositions(selectedFormationA, selectedFormationB, selectedMode);
    setPlayers(newPositions);
  };

  const handleModeChange = (mode: MatchMode) => {
    setSelectedMode(mode);
    setSelectedFormationA('');
    setSelectedFormationB('');
    setPlayers([]);
  };
  const handleMouseDown = (playerId: number) => {
    setDraggedPlayer(playerId);
  };

  const handleTouchStart = (playerId: number) => {
    setDraggedPlayer(playerId);
  };

  const getEventCoordinates = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ('touches' in e) {
      // Touch event
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else {
      // Mouse event
      return {
        x: e.clientX,
        y: e.clientY
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handleMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent scrolling
    handleMove(e);
  };

  const handleMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (draggedPlayer === null || !fieldRef.current) return;

    const rect = fieldRef.current.getBoundingClientRect();
    const coords = getEventCoordinates(e);
    const x = coords.x - rect.left;
    const y = coords.y - rect.top;

    const boundedX = Math.max(15, Math.min(x, rect.width - 15));
    const boundedY = Math.max(15, Math.min(y, rect.height - 15));

    setPlayers(prev => 
      prev.map(player => 
        player.id === draggedPlayer 
          ? { ...player, x: boundedX, y: boundedY }
          : player
      )
    );
  };

  const handleMouseUp = () => {
    setDraggedPlayer(null);
  };

  const handleTouchEnd = () => {
    setDraggedPlayer(null);
  };

  const modes = [
    { value: '5vs5', label: '5 vs 5' },
    { value: '6vs6', label: '6 vs 6' },
    { value: '7vs7', label: '7 vs 7' },
    { value: '8vs8', label: '8 vs 8' },
  ];

  // Get display number for a player (1-based numbering for each team)
  const getPlayerDisplayNumber = (player: FieldPlayer): number => {
    const teamPlayers = players.filter(p => p.team === player.team);
    const sortedTeamPlayers = teamPlayers.sort((a, b) => {
      // GK first, then by original ID order
      if (a.isGK && !b.isGK) return -1;
      if (!a.isGK && b.isGK) return 1;
      return a.id - b.id;
    });
    
    const index = sortedTeamPlayers.findIndex(p => p.id === player.id);
    return index + 1; // 1-based numbering
  };

  return (
    <Card className={`bg-white border-[#B8CFCE] ${className}`}>
      <CardHeader>
        <CardTitle className="text-[#333446]">Interactive Lineup Builder ⚽</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!formation && (
          <>
            {/* Mode Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {modes.map((mode) => (
                <Button
                  key={mode.value}
                  variant={selectedMode === mode.value ? "default" : "outline"}
                  onClick={() => handleModeChange(mode.value as MatchMode)}
                  className={`h-auto flex flex-col gap-1 text-xs ${
                    selectedMode === mode.value 
                      ? 'bg-[#333446] text-white' 
                      : 'text-[#333446] border-[#B8CFCE] hover:bg-[#EAEFEF]'
                  }`}
                >
                  <span className="text-lg">⚽</span>
                  <span className="font-medium">{mode.label}</span>
                </Button>
              ))}
            </div>

            {/* Formation Selection for Both Teams */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">                <label className="text-sm font-medium text-[#333446] flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                  Team A Formation (Blue - Top Side)
                </label>
                <Select value={selectedFormationA} onValueChange={setSelectedFormationA}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Team A formation" />
                  </SelectTrigger>
                  <SelectContent>
                    {formations[selectedMode].map((formation) => (
                      <SelectItem key={formation} value={formation}>
                        {formation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">                <label className="text-sm font-medium text-[#333446] flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                  Team B Formation (Red - Bottom Side)
                </label>
                <Select value={selectedFormationB} onValueChange={setSelectedFormationB}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Team B formation" />
                  </SelectTrigger>
                  <SelectContent>
                    {formations[selectedMode].map((formation) => (
                      <SelectItem key={formation} value={formation}>
                        {formation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedFormationA && selectedFormationB && (
              <Button 
                onClick={handleFormationSelect}
                className="bg-[#333446] text-white hover:bg-[#7F8CAA] w-full"
              >
                Apply Formations to Field
              </Button>
            )}
          </>
        )}

        {/* Field */}
        {players.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#333446]">
              {formation ? `${formation.name} - Formation View` : `${selectedFormationA} vs ${selectedFormationB}`} - Drag players to reposition
            </label>            <div
              ref={fieldRef}
              className="relative w-full h-96 bg-gradient-to-b from-green-400 to-green-500 border-4 border-[#333446] rounded-lg overflow-hidden cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ userSelect: 'none', touchAction: 'none' }}
            >{/* Soccer field markings */}
              <div className="absolute inset-0">
                {/* Center line (horizontal) */}
                <div className="absolute left-0 right-0 top-1/2 h-1 bg-white opacity-90 transform -translate-y-0.5"></div>
                {/* Center circle */}
                <div className="absolute left-1/2 top-1/2 w-16 h-16 border-2 border-white opacity-90 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white opacity-90 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                
                {/* Top goal area */}
                <div className="absolute top-0 left-1/2 h-12 w-16 border-2 border-white opacity-90 transform -translate-x-1/2"></div>
                <div className="absolute top-0 left-1/2 h-6 w-8 border-2 border-white opacity-90 transform -translate-x-1/2"></div>
                
                {/* Bottom goal area */}
                <div className="absolute bottom-0 left-1/2 h-12 w-16 border-2 border-white opacity-90 transform -translate-x-1/2"></div>
                <div className="absolute bottom-0 left-1/2 h-6 w-8 border-2 border-white opacity-90 transform -translate-x-1/2"></div>
                
                {/* Corner arcs */}
                <div className="absolute top-0 left-0 w-6 h-6 border-2 border-white opacity-90 rounded-br-full"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-2 border-white opacity-90 rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-2 border-white opacity-90 rounded-tr-full"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-2 border-white opacity-90 rounded-tl-full"></div>
              </div>

              {/* Players */}
              {players.map((player) => (                <div
                  key={player.id}
                  className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-move transform -translate-x-1/2 -translate-y-1/2 shadow-lg transition-transform hover:scale-110 border-2 border-white ${
                    player.isGK 
                      ? (player.team === 'A' ? 'bg-blue-800' : 'bg-red-800')
                      : (player.team === 'A' ? 'bg-blue-600' : 'bg-red-600')
                  } ${draggedPlayer === player.id ? 'scale-125 z-10' : ''}`}
                  style={{ 
                    left: player.x, 
                    top: player.y,
                    touchAction: 'none'
                  }}                  onMouseDown={() => handleMouseDown(player.id)}
                  onTouchStart={() => handleTouchStart(player.id)}
                  title={player.originalPlayer?.name || `Team ${player.team} - Player ${getPlayerDisplayNumber(player)}`}
                >
                  {player.originalPlayer?.name.split(' ')[0].substring(0, 2).toUpperCase() || getPlayerDisplayNumber(player)}
                </div>
              ))}
            </div>
              <div className="flex items-center justify-center gap-6 text-sm text-[#7F8CAA]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-600 rounded-full border-2 border-white"></div>
                <span>Team A (Top)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-600 rounded-full border-2 border-white"></div>
                <span>Team B (Bottom)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-800 rounded-full border-2 border-white"></div>
                <div className="w-5 h-5 bg-red-800 rounded-full border-2 border-white"></div>
                <span>Goalkeepers</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LineupBuilder;
