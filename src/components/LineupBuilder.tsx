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
  const [selectedFormation, setSelectedFormation] = useState<string>('');
  const [players, setPlayers] = useState<FieldPlayer[]>([]);
  const [draggedPlayer, setDraggedPlayer] = useState<number | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  // Update when formation prop changes
  useEffect(() => {
    if (formation) {
      setSelectedMode(formation.mode);
      const teamAPlayers = generateTeamPositions(formation.teamA, 'A', formation.mode);
      const teamBPlayers = generateTeamPositions(formation.teamB, 'B', formation.mode);
      setPlayers([...teamAPlayers, ...teamBPlayers]);
    }
  }, [formation]);

  const getPlayerCount = (mode: MatchMode): number => {
    switch (mode) {
      case '5vs5': return 5;
      case '6vs6': return 6;
      case '7vs7': return 7;
      case '8vs8': return 8;
      default: return 5;
    }
  };

  const generateTeamPositions = (teamPlayers: Player[], team: 'A' | 'B', mode: MatchMode): FieldPlayer[] => {
    const positions: FieldPlayer[] = [];
    const fieldWidth = 500;
    const fieldHeight = 350;
    const isTeamB = team === 'B';
    
    // Goalkeeper position
    const gkPlayer = teamPlayers.find(p => p.position === 'GK') || teamPlayers[0];
    positions.push({
      id: parseInt(gkPlayer.id),
      x: isTeamB ? fieldWidth - 30 : 30,
      y: fieldHeight / 2,
      isGK: true,
      team,
      originalPlayer: gkPlayer
    });

    // Outfield players - arrange them in a basic formation
    const outfieldPlayers = teamPlayers.filter(p => p.position !== 'GK');
    const playerCount = getPlayerCount(mode);
    const sectionsCount = Math.min(3, playerCount - 1); // Max 3 sections (DEF, MID, ATT)
    const sectionWidth = (fieldWidth - 120) / sectionsCount;
    
    outfieldPlayers.forEach((player, index) => {
      const sectionIndex = Math.floor(index / Math.ceil(outfieldPlayers.length / sectionsCount));
      const positionInSection = index % Math.ceil(outfieldPlayers.length / sectionsCount);
      const playersInSection = Math.ceil(outfieldPlayers.length / sectionsCount);
      
      const sectionX = isTeamB 
        ? fieldWidth - 90 - sectionIndex * sectionWidth - sectionWidth / 2
        : 90 + sectionIndex * sectionWidth + sectionWidth / 2;
      
      const playerY = fieldHeight / (playersInSection + 1) * (positionInSection + 1);
      
      positions.push({
        id: parseInt(player.id),
        x: sectionX,
        y: playerY,
        team,
        originalPlayer: player
      });
    });

    return positions;
  };

  const generateFormationPositions = (formation: string, mode: MatchMode): FieldPlayer[] => {
    const playerCount = getPlayerCount(mode);
    const positions: FieldPlayer[] = [];
    const fieldWidth = 500;
    const fieldHeight = 350;
    
    // Team A (left side)
    positions.push({
      id: 1,
      x: 30,
      y: fieldHeight / 2,
      isGK: true,
      team: 'A'
    });

    const formationParts = formation.split('-').map(Number);
    let playerId = 2;
    
    const sectionsCount = formationParts.length;
    const sectionWidth = (fieldWidth / 2 - 80) / sectionsCount;
    
    formationParts.forEach((playersInSection, sectionIndex) => {
      const sectionX = 80 + sectionIndex * sectionWidth + sectionWidth / 2;
      
      for (let i = 0; i < playersInSection; i++) {
        const playerY = fieldHeight / (playersInSection + 1) * (i + 1);
        positions.push({
          id: playerId,
          x: sectionX,
          y: playerY,
          team: 'A'
        });
        playerId++;
      }
    });

    // Team B (right side) - mirror formation
    positions.push({
      id: playerId,
      x: fieldWidth - 30,
      y: fieldHeight / 2,
      isGK: true,
      team: 'B'
    });
    playerId++;

    formationParts.forEach((playersInSection, sectionIndex) => {
      const sectionX = fieldWidth - 80 - sectionIndex * sectionWidth - sectionWidth / 2;
      
      for (let i = 0; i < playersInSection; i++) {
        const playerY = fieldHeight / (playersInSection + 1) * (i + 1);
        positions.push({
          id: playerId,
          x: sectionX,
          y: playerY,
          team: 'B'
        });
        playerId++;
      }
    });

    return positions;
  };

  const handleFormationSelect = (formation: string) => {
    setSelectedFormation(formation);
    const newPositions = generateFormationPositions(formation, selectedMode);
    setPlayers(newPositions);
  };

  const handleModeChange = (mode: MatchMode) => {
    setSelectedMode(mode);
    setSelectedFormation('');
    setPlayers([]);
  };

  const handleMouseDown = (playerId: number) => {
    setDraggedPlayer(playerId);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedPlayer === null || !fieldRef.current) return;

    const rect = fieldRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const boundedX = Math.max(20, Math.min(x, rect.width - 20));
    const boundedY = Math.max(20, Math.min(y, rect.height - 20));

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

  const modes = [
    { value: '5vs5', label: '5 vs 5' },
    { value: '6vs6', label: '6 vs 6' },
    { value: '7vs7', label: '7 vs 7' },
    { value: '8vs8', label: '8 vs 8' },
  ];

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

            {/* Formation Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#333446]">Select Formation</label>
              <Select value={selectedFormation} onValueChange={handleFormationSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a formation" />
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
          </>
        )}

        {/* Field */}
        {players.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#333446]">
              {formation ? `${formation.name} - Formation View` : 'Field View'} - Drag players to reposition
            </label>
            <div
              ref={fieldRef}
              className="relative w-full h-96 bg-gradient-to-b from-green-400 to-green-500 border-4 border-white rounded-lg overflow-hidden cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ userSelect: 'none' }}
            >
              {/* Soccer field markings */}
              <div className="absolute inset-0">
                {/* Center line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white opacity-90 transform -translate-x-0.5"></div>
                {/* Center circle */}
                <div className="absolute left-1/2 top-1/2 w-20 h-20 border-2 border-white opacity-90 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white opacity-90 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                
                {/* Left goal area */}
                <div className="absolute left-0 top-1/2 w-16 h-24 border-2 border-white opacity-90 transform -translate-y-1/2"></div>
                <div className="absolute left-0 top-1/2 w-8 h-12 border-2 border-white opacity-90 transform -translate-y-1/2"></div>
                
                {/* Right goal area */}
                <div className="absolute right-0 top-1/2 w-16 h-24 border-2 border-white opacity-90 transform -translate-y-1/2"></div>
                <div className="absolute right-0 top-1/2 w-8 h-12 border-2 border-white opacity-90 transform -translate-y-1/2"></div>
                
                {/* Corner arcs */}
                <div className="absolute top-0 left-0 w-8 h-8 border-2 border-white opacity-90 rounded-br-full"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-2 border-white opacity-90 rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-2 border-white opacity-90 rounded-tr-full"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-2 border-white opacity-90 rounded-tl-full"></div>
              </div>

              {/* Players */}
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-move transform -translate-x-1/2 -translate-y-1/2 shadow-lg transition-transform hover:scale-110 border-2 border-white ${
                    player.isGK 
                      ? (player.team === 'A' ? 'bg-blue-800' : 'bg-red-800')
                      : (player.team === 'A' ? 'bg-blue-600' : 'bg-red-600')
                  } ${draggedPlayer === player.id ? 'scale-125 z-10' : ''}`}
                  style={{ 
                    left: player.x, 
                    top: player.y,
                  }}
                  onMouseDown={() => handleMouseDown(player.id)}
                  title={player.originalPlayer?.name || `Player ${player.id}`}
                >
                  {player.originalPlayer?.name.split(' ')[0].substring(0, 2).toUpperCase() || player.id}
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm text-[#7F8CAA]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-600 rounded-full border-2 border-white"></div>
                <span>Team A</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-600 rounded-full border-2 border-white"></div>
                <span>Team B</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-800 rounded-full border-2 border-white"></div>
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
