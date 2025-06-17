
import { Player, RankingType } from '@/types/fantacalcietto';

export const getRankedPlayers = (players: Player[], type: RankingType): Player[] => {
  switch (type) {
    case 'goleador':
      return [...players].sort((a, b) => b.goals - a.goals);
    case 'assistman':
      return [...players].sort((a, b) => b.assists - a.assists);
    case 'bestnonGK':
      return [...players]
        .filter(p => p.position !== 'GK')
        .sort((a, b) => b.saves - a.saves);
    case 'bestDefender':
      return [...players]
        .filter(p => p.position === 'DEF')
        .sort((a, b) => b.defenderVoting - a.defenderVoting);
    default:
      return players;
  }
};

export const generateSquad = (players: Player[], mode: string): { teamA: Player[], teamB: Player[] } => {
  const playersPerTeam = {
    '5vs5': 5,
    '6vs6': 6,
    '7vs7': 7,
    '8vs8': 8,
  }[mode] || 5;

  const totalPlayers = playersPerTeam * 2;
  
  if (players.length < totalPlayers) {
    throw new Error(`Non ci sono abbastanza giocatori per il modo ${mode}`);
  }

  // Prendi solo i giocatori necessari
  const selectedPlayers = players.slice(0, totalPlayers);
  
  // Funzione per calcolare le medie di una squadra
  const calculateTeamStats = (team: Player[]) => {
    if (team.length === 0) return { goals: 0, assists: 0, saves: 0, defenderVoting: 0 };
    
    return {
      goals: team.reduce((sum, p) => sum + p.goals, 0) / team.length,
      assists: team.reduce((sum, p) => sum + p.assists, 0) / team.length,
      saves: team.reduce((sum, p) => sum + p.saves, 0) / team.length,
      defenderVoting: team.reduce((sum, p) => sum + p.defenderVoting, 0) / team.length
    };
  };

  // Funzione per calcolare la differenza tra due squadre
  const calculateStatsDifference = (team1: Player[], team2: Player[]) => {
    const stats1 = calculateTeamStats(team1);
    const stats2 = calculateTeamStats(team2);
    
    return {
      goals: Math.abs(stats1.goals - stats2.goals),
      assists: Math.abs(stats1.assists - stats2.assists),
      saves: Math.abs(stats1.saves - stats2.saves),
      defenderVoting: Math.abs(stats1.defenderVoting - stats2.defenderVoting)
    };
  };

  // Funzione per verificare se le squadre sono bilanciate (scarto max 0.2)
  const areTeamsBalanced = (team1: Player[], team2: Player[]) => {
    const diff = calculateStatsDifference(team1, team2);
    const maxDiff = 0.2;
    
    return diff.goals <= maxDiff && 
           diff.assists <= maxDiff && 
           diff.saves <= maxDiff && 
           diff.defenderVoting <= maxDiff;
  };

  // Algoritmo per creare squadre bilanciate
  const createBalancedTeams = (players: Player[]): { teamA: Player[], teamB: Player[] } => {
    // Ordina i giocatori per una metrica combinata (più forti prima)
    const sortedPlayers = [...players].sort((a, b) => {
      const scoreA = (a.goals + a.assists + a.saves + a.defenderVoting) / 4;
      const scoreB = (b.goals + b.assists + b.saves + b.defenderVoting) / 4;
      return scoreB - scoreA;
    });

    const team1: Player[] = [];
    const team2: Player[] = [];

    // Distribuzione alternata iniziale (draft style)
    for (let i = 0; i < sortedPlayers.length; i++) {
      if (i % 2 === 0) {
        team1.push(sortedPlayers[i]);
      } else {
        team2.push(sortedPlayers[i]);
      }
    }

    return { teamA: team1, teamB: team2 };
  };

  // Algoritmo di ottimizzazione per migliorare il bilanciamento
  const optimizeTeams = (teamA: Player[], teamB: Player[]): { teamA: Player[], teamB: Player[] } => {
    let bestTeamA = [...teamA];
    let bestTeamB = [...teamB];
    let bestDiff = calculateStatsDifference(teamA, teamB);
    let bestScore = bestDiff.goals + bestDiff.assists + bestDiff.saves + bestDiff.defenderVoting;

    // Prova a scambiare giocatori per migliorare il bilanciamento
    for (let i = 0; i < teamA.length; i++) {
      for (let j = 0; j < teamB.length; j++) {
        // Crea squadre temporanee con giocatori scambiati
        const tempTeamA = [...teamA];
        const tempTeamB = [...teamB];
        
        // Scambia i giocatori
        const temp = tempTeamA[i];
        tempTeamA[i] = tempTeamB[j];
        tempTeamB[j] = temp;

        // Calcola il nuovo punteggio di differenza
        const tempDiff = calculateStatsDifference(tempTeamA, tempTeamB);
        const tempScore = tempDiff.goals + tempDiff.assists + tempDiff.saves + tempDiff.defenderVoting;

        // Se questo scambio migliora il bilanciamento, salvalo
        if (tempScore < bestScore) {
          bestTeamA = [...tempTeamA];
          bestTeamB = [...tempTeamB];
          bestDiff = tempDiff;
          bestScore = tempScore;
        }
      }
    }

    return { teamA: bestTeamA, teamB: bestTeamB };
  };

  // Crea le squadre iniziali
  let result = createBalancedTeams(selectedPlayers);

  // Ottimizza il bilanciamento con più iterazioni
  for (let iteration = 0; iteration < 10; iteration++) {
    result = optimizeTeams(result.teamA, result.teamB);
    
    // Se le squadre sono già bilanciate, esci dal loop
    if (areTeamsBalanced(result.teamA, result.teamB)) {
      break;
    }
  }

  return result;
};
