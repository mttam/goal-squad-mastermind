
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Player, Squad, Formation, Due, MatchMode } from '@/types/fantacalcietto';
import { generateFakeData } from '@/utils/fakeData';

interface FantacalciettoContextType {
  players: Player[];
  squads: Squad[];
  formations: Formation[];
  dues: Due[];
  setPlayers: (players: Player[]) => void;
  setSquads: (squads: Squad[]) => void;
  setFormations: (formations: Formation[]) => void;
  setDues: (dues: Due[]) => void;
  addSquad: (squad: Squad) => void;
  addFormation: (formation: Formation) => void;
  addDue: (due: Due) => void;
  updateDue: (id: string, updates: Partial<Due>) => void;
  addPlayer: (player: Player) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  replacePlayerInSquad: (squadId: string, oldPlayerId: string, newPlayer: Player) => void;
}

const FantacalciettoContext = createContext<FantacalciettoContextType | undefined>(undefined);

export const useFantacalcietto = () => {
  const context = useContext(FantacalciettoContext);
  if (!context) {
    throw new Error('useFantacalcietto must be used within a FantacalciettoProvider');
  }
  return context;
};

export const FantacalciettoProvider = ({ children }: { children: ReactNode }) => {
  const [players, setPlayers] = useState<Player[]>(generateFakeData());
  const [squads, setSquads] = useState<Squad[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [dues, setDues] = useState<Due[]>([]);

  const addSquad = (squad: Squad) => {
    setSquads(prev => [...prev, squad]);
  };

  const addFormation = (formation: Formation) => {
    setFormations(prev => [...prev, formation]);
  };

  const addDue = (due: Due) => {
    setDues(prev => [...prev, due]);
  };

  const updateDue = (id: string, updates: Partial<Due>) => {
    setDues(prev => prev.map(due => due.id === id ? { ...due, ...updates } : due));
  };

  const addPlayer = (player: Player) => {
    setPlayers(prev => [...prev, player]);
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(player => player.id === id ? { ...player, ...updates } : player));
  };

  const replacePlayerInSquad = (squadId: string, oldPlayerId: string, newPlayer: Player) => {
    setSquads(prev => prev.map(squad => {
      if (squad.id === squadId) {
        return {
          ...squad,
          players: squad.players.map(player => 
            player.id === oldPlayerId ? newPlayer : player
          )
        };
      }
      return squad;
    }));
  };

  return (
    <FantacalciettoContext.Provider value={{
      players,
      squads,
      formations,
      dues,
      setPlayers,
      setSquads,
      setFormations,
      setDues,
      addSquad,
      addFormation,
      addDue,
      updateDue,
      addPlayer,
      updatePlayer,
      replacePlayerInSquad,
    }}>
      {children}
    </FantacalciettoContext.Provider>
  );
};
