
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
  
  // Get top players from different categories
  const goleadors = getRankedPlayers(players, 'goleador');
  const assistmen = getRankedPlayers(players, 'assistman');
  const defenders = getRankedPlayers(players, 'bestDefender');
  const nonGKs = getRankedPlayers(players, 'bestnonGK');

  const selectedPlayers = new Set<Player>();
  const result: Player[] = [];

  // 10% Best Defender (Voting)
  const defenderCount = Math.ceil(totalPlayers * 0.3);
  for (let i = 0; i < defenderCount && i < defenders.length; i++) {
    if (!selectedPlayers.has(defenders[i])) {
      selectedPlayers.add(defenders[i]);
      result.push(defenders[i]);
    }
  }

  // 30% Best Defender (by Assist facts) - using nonGK saves
  const defAssistCount = Math.ceil(totalPlayers * 0.1);
  for (let i = 0; i < defAssistCount && i < nonGKs.length; i++) {
    if (!selectedPlayers.has(nonGKs[i])) {
      selectedPlayers.add(nonGKs[i]);
      result.push(nonGKs[i]);
    }
  }

  // 30% Assistman
  const assistCount = Math.ceil(totalPlayers * 0.3);
  for (let i = 0; i < assistCount && i < assistmen.length; i++) {
    if (!selectedPlayers.has(assistmen[i])) {
      selectedPlayers.add(assistmen[i]);
      result.push(assistmen[i]);
    }
  }

  // 30% Goleador
  const goalCount = Math.ceil(totalPlayers * 0.3);
  for (let i = 0; i < goalCount && i < goleadors.length; i++) {
    if (!selectedPlayers.has(goleadors[i])) {
      selectedPlayers.add(goleadors[i]);
      result.push(goleadors[i]);
    }
  }

  // Fill remaining spots with random players
  const remainingPlayers = players.filter(p => !selectedPlayers.has(p));
  while (result.length < totalPlayers && remainingPlayers.length > 0) {
    const randomIndex = Math.floor(Math.random() * remainingPlayers.length);
    result.push(remainingPlayers.splice(randomIndex, 1)[0]);
  }

  // Split into two teams
  const shuffled = [...result].sort(() => Math.random() - 0.2);
  return {
    teamA: shuffled.slice(0, playersPerTeam),
    teamB: shuffled.slice(playersPerTeam, totalPlayers),
  };
};
