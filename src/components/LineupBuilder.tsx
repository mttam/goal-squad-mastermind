import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MatchMode } from '@/types/fantacalcietto';

interface Player {
  id: number;
  x: number;
  y: number;
  isGK?: boolean;
}

interface LineupBuilderProps {
  className?: string;
}

const LineupBuilder: React.FC<LineupBuilderProps> = ({ className }) => {
  const formations = {
    '5vs5': ['3-1', '2-2', '1-3', '2-1-1', '1-2-1', '1-1-2'],
    '6vs6': ['4-1', '3-2', '2-3', '1-4', '3-1-1', '2-2-1', '2-1-2', '1-3-1', '1-2-2', '1-1-3'],
    '7vs7': ['4-2', '3-3', '2-4', '5-1', '4-1-1', '3-2-1', '3-1-2', '2-3-1', '2-2-2', '2-1-3', '1-4-1', '1-3-2', '1-2-3'],
    '8vs8': ['4-3', '3-4', '5-2', '2-5', '6-1', '1-6', '5-1-1', '4-2-1', '4-1-2', '3-3-1', '3-2-2', '3-1-3', '2-4-1', '2-3-2', '2-2-3', '1-5-1', '1-4-2', '1-3-3', '1-2-4']
  };

  const [selectedMode, setSelectedMode] = useState<MatchMode>('5vs5');
  const [selectedFormation, setSelectedFormation] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [draggedPlayer, setDraggedPlayer] = useState<number | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  const getPlayerCount = (mode: MatchMode): number => {
    switch (mode) {
      case '5vs5': return 5;
      case '6vs6': return 6;
      case '7vs7': return 7;
      case '8vs8': return 8;
      default: return 5;
    }
  };

  const generateFormationPositions = (formation: string, mode: MatchMode): Player[] => {
    const playerCount = getPlayerCount(mode);
    const positions: Player[] = [];
    const fieldWidth = 400;
    const fieldHeight = 300;
    
    // Always add goalkeeper first
    positions.push({
      id: 1,
      x: 20,
      y: fieldHeight / 2,
      isGK: true
    });

    const formationParts = formation.split('-').map(Number);
    let playerId = 2;
    
    // Calculate positions for outfield players
    const sectionsCount = formationParts.length;
    const sectionWidth = (fieldWidth - 80) / sectionsCount; // 80px for GK area and end space
    
    formationParts.forEach((playersInSection, sectionIndex) => {
      const sectionX = 80 + sectionIndex * sectionWidth + sectionWidth / 2;
      
      for (let i = 0; i < playersInSection; i++) {
        const playerY = fieldHeight / (playersInSection + 1) * (i + 1);
        positions.push({
          id: playerId,
          x: sectionX,
          y: playerY
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

    // Keep players within field bounds
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

        {/* Field */}
        {players.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#333446]">
              Field View - Drag players to reposition
            </label>
            <div
              ref={fieldRef}
              className="relative w-full h-80 bg-green-100 border-2 border-green-300 rounded-lg overflow-hidden cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ userSelect: 'none' }}
            >
              {/* Field markings */}
              <div className="absolute inset-0">
                {/* Center line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white opacity-60"></div>
                {/* Center circle */}
                <div className="absolute left-1/2 top-1/2 w-16 h-16 border border-white opacity-60 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                {/* Goal areas */}
                <div className="absolute left-0 top-1/2 w-12 h-20 border border-white opacity-60 transform -translate-y-1/2"></div>
                <div className="absolute right-0 top-1/2 w-12 h-20 border border-white opacity-60 transform -translate-y-1/2"></div>
              </div>

              {/* Players */}
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-move transform -translate-x-1/2 -translate-y-1/2 shadow-lg transition-transform hover:scale-110 ${
                    player.isGK ? 'bg-orange-500' : 'bg-blue-600'
                  } ${draggedPlayer === player.id ? 'scale-125 z-10' : ''}`}
                  style={{ 
                    left: player.x, 
                    top: player.y,
                  }}
                  onMouseDown={() => handleMouseDown(player.id)}
                >
                  {player.id}
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-[#7F8CAA]">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span>Goalkeeper</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                <span>Outfield Player</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LineupBuilder;
