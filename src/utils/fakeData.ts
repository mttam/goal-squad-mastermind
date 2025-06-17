
import { Player } from '@/types/fantacalcietto';

const names = ['Placeholder'];

const positions: Array<'GK' | 'DEF' | 'MID' | 'ATT'> = ['GK', 'DEF', 'MID', 'ATT'];

export const generateFakeData = (): Player[] => {
  return names.map((name, index) => {
    const position = positions[Math.floor(Math.random() * positions.length)];
    
    // Position-based stat generation
    let goals = 0;
    let assists = 0;
    let saves = 0;
    
    switch (position) {
      case 'GK':
        goals = Math.floor(Math.random() * 3); // GKs rarely score
        assists = Math.floor(Math.random() * 5);
        saves = Math.floor(Math.random() * 50) + 20; // High saves for GK
        break;
      case 'DEF':
        goals = Math.floor(Math.random() * 8) + 1;
        assists = Math.floor(Math.random() * 12) + 2;
        saves = Math.floor(Math.random() * 15) + 5;
        break;
      case 'MID':
        goals = Math.floor(Math.random() * 15) + 3;
        assists = Math.floor(Math.random() * 20) + 5;
        saves = Math.floor(Math.random() * 10) + 2;
        break;
      case 'ATT':
        goals = Math.floor(Math.random() * 25) + 8; // High goals for attackers
        assists = Math.floor(Math.random() * 15) + 3;
        saves = Math.floor(Math.random() * 5) + 1;
        break;
    }

    return {
      id: `player-${index + 1}`,
      name,
      position,
      goals,
      assists,
      saves,
      defenderVoting: Math.floor(Math.random() * 10) + 1, // 1-10 scale
    };
  });
};
