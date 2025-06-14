
export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'ATT';
  goals: number;
  assists: number;
  saves: number;
  defenderVoting: number; // 1-10 scale
}

export interface Squad {
  id: string;
  name: string;
  players: Player[];
  mode: MatchMode;
  createdAt: Date;
}

export interface Formation {
  id: string;
  name: string;
  mode: MatchMode;
  teamA: Player[];
  teamB: Player[];
  createdAt: Date;
}

export interface Due {
  id: string;
  playerName: string;
  amount: number;
  description: string;
  paid: boolean;
  date: Date;
}

export type MatchMode = '5vs5' | '6vs6' | '7vs7' | '8vs8';

export type RankingType = 'goleador' | 'assistman' | 'bestnonGK' | 'bestDefender';
