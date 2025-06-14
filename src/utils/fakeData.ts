
import { Player } from '@/types/fantacalcietto';

const names = [
  'Marco Rossi', 'Luca Bianchi', 'Andrea Ferrari', 'Matteo Romano', 'Francesco Ricci',
  'Alessandro Marino', 'Davide Greco', 'Simone Bruno', 'Lorenzo Villa', 'Gabriele Conti',
  'Roberto Mancini', 'Antonio Esposito', 'Giuseppe Barbieri', 'Stefano Costa', 'Fabio Rizzo',
  'Daniele Fontana', 'Michele Santoro', 'Paolo Caruso', 'Giovanni Fabbri', 'Nicola Serra',
  'Emanuele Pellegrini', 'Cristiano Galli', 'Federico Lombardi', 'Riccardo Martinelli', 'Vincenzo Sorrentino',
  'Alberto Parisi', 'Claudio Rossini', 'Mauro Benedetti', 'Sergio Moretti', 'Enrico Ferretti',
  'Massimo De Santis', 'Diego Cattaneo', 'Gianluca Monti', 'Pierluigi Rizzi', 'Salvatore Giordano',
  'Tommaso Negri', 'Leonardo Donati', 'Alessio Marchetti', 'Marco Valentini', 'Luca De Angelis',
  'Andrea Silvestri', 'Matteo Farina', 'Francesco Orlandi', 'Alessandro Vitali', 'Davide Pagano',
  'Simone Ferrara', 'Lorenzo Guerra', 'Gabriele Fiorentino', 'Roberto Ferri', 'Antonio Gatti'
];

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
