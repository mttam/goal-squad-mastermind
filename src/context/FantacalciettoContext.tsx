
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Player, Squad, Formation, Due, MatchMode, SavedRotation } from '@/types/fantacalcietto';
import { generateFakeData } from '@/utils/fakeData';
import { LocalStorageManager, STORAGE_KEYS, DataValidators, StorageError } from '@/utils/localStorage';

interface FantacalciettoContextType {
  players: Player[];
  squads: Squad[];
  formations: Formation[];
  dues: Due[];
  savedRotations: SavedRotation[];
  setPlayers: (players: Player[]) => void;
  setSquads: (squads: Squad[]) => void;
  setFormations: (formations: Formation[]) => void;
  setDues: (dues: Due[]) => void;
  setSavedRotations: (rotations: SavedRotation[]) => void;
  addSquad: (squad: Squad) => void;
  addFormation: (formation: Formation) => void;
  addDue: (due: Due) => void;
  addSavedRotation: (rotation: SavedRotation) => void;
  updateDue: (id: string, updates: Partial<Due>) => void;
  addPlayer: (player: Player) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  replacePlayerInSquad: (squadId: string, oldPlayerId: string, newPlayer: Player) => void;
  // Storage management methods
  getStorageHealth: () => any;
  exportAllData: () => any;
  importAllData: (data: any) => Promise<boolean>;
  clearAllData: () => void;
  isDataLoaded: boolean;
  storageErrors: string[];
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
  const [players, setPlayersState] = useState<Player[]>([]);
  const [squads, setSquadsState] = useState<Squad[]>([]);
  const [formations, setFormationsState] = useState<Formation[]>([]);
  const [dues, setDuesState] = useState<Due[]>([]);
  const [savedRotations, setSavedRotationsState] = useState<SavedRotation[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [storageErrors, setStorageErrors] = useState<string[]>([]);

  // Enhanced setters with localStorage persistence
  const setPlayers = useCallback((newPlayers: Player[]) => {
    setPlayersState(newPlayers);
    const result = LocalStorageManager.save(STORAGE_KEYS.players, newPlayers, DataValidators.isPlayersArray);
    if (!result.success) {
      setStorageErrors(prev => [...prev, `Failed to save players: ${result.error?.message}`]);
    }
  }, []);

  const setSquads = useCallback((newSquads: Squad[]) => {
    setSquadsState(newSquads);
    const result = LocalStorageManager.save(STORAGE_KEYS.squads, newSquads, DataValidators.isSquadsArray);
    if (!result.success) {
      setStorageErrors(prev => [...prev, `Failed to save squads: ${result.error?.message}`]);
    }
  }, []);

  const setFormations = useCallback((newFormations: Formation[]) => {
    setFormationsState(newFormations);
    const result = LocalStorageManager.save(STORAGE_KEYS.formations, newFormations, DataValidators.isFormationsArray);
    if (!result.success) {
      setStorageErrors(prev => [...prev, `Failed to save formations: ${result.error?.message}`]);
    }
  }, []);
  const setDues = useCallback((newDues: Due[]) => {
    setDuesState(newDues);
    const result = LocalStorageManager.save(STORAGE_KEYS.dues, newDues, DataValidators.isDuesArray);
    if (!result.success) {
      setStorageErrors(prev => [...prev, `Failed to save dues: ${result.error?.message}`]);
    }
  }, []);

  const setSavedRotations = useCallback((newRotations: SavedRotation[]) => {
    setSavedRotationsState(newRotations);
    // For now, save to localStorage with a simple key since we don't have a specific validator yet
    try {
      localStorage.setItem('fantacalcietto-savedRotations', JSON.stringify(newRotations));
    } catch (error) {
      setStorageErrors(prev => [...prev, `Failed to save rotations: ${error}`]);
    }
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // First, attempt to migrate legacy data
        const migrationResult = LocalStorageManager.migrateFromLegacy();
        if (migrationResult.migrated.length > 0) {
          console.log('Migrated legacy data:', migrationResult.migrated);
        }
        if (migrationResult.errors.length > 0) {
          setStorageErrors(prev => [...prev, ...migrationResult.errors]);
        }

        // Load players
        const playersResult = LocalStorageManager.load<Player[]>(STORAGE_KEYS.players, DataValidators.isPlayersArray);
        if (playersResult.success && playersResult.data) {
          setPlayersState(playersResult.data);
          if (playersResult.recovered) {
            setStorageErrors(prev => [...prev, 'Players data recovered from backup']);
          }
        } else {
          // Fall back to fake data for players
          const fakeData = generateFakeData();
          setPlayersState(fakeData);
          setPlayers(fakeData); // Save to localStorage
          if (playersResult.error) {
            setStorageErrors(prev => [...prev, `Players load error: ${playersResult.error?.message}`]);
          }
        }

        // Load squads
        const squadsResult = LocalStorageManager.load<Squad[]>(STORAGE_KEYS.squads, DataValidators.isSquadsArray);
        if (squadsResult.success && squadsResult.data) {
          setSquadsState(squadsResult.data);
          if (squadsResult.recovered) {
            setStorageErrors(prev => [...prev, 'Squads data recovered from backup']);
          }
        } else if (squadsResult.error) {
          setStorageErrors(prev => [...prev, `Squads load error: ${squadsResult.error?.message}`]);
        }

        // Load formations
        const formationsResult = LocalStorageManager.load<Formation[]>(STORAGE_KEYS.formations, DataValidators.isFormationsArray);
        if (formationsResult.success && formationsResult.data) {
          setFormationsState(formationsResult.data);
          if (formationsResult.recovered) {
            setStorageErrors(prev => [...prev, 'Formations data recovered from backup']);
          }
        } else if (formationsResult.error) {
          setStorageErrors(prev => [...prev, `Formations load error: ${formationsResult.error?.message}`]);
        }        // Load dues
        const duesResult = LocalStorageManager.load<Due[]>(STORAGE_KEYS.dues, DataValidators.isDuesArray);
        if (duesResult.success && duesResult.data) {
          setDuesState(duesResult.data);
          if (duesResult.recovered) {
            setStorageErrors(prev => [...prev, 'Dues data recovered from backup']);
          }
        } else if (duesResult.error) {
          setStorageErrors(prev => [...prev, `Dues load error: ${duesResult.error?.message}`]);
        }

        // Load saved rotations
        try {
          const savedRotationsData = localStorage.getItem('fantacalcietto-savedRotations');
          if (savedRotationsData) {
            const parsedRotations = JSON.parse(savedRotationsData) as SavedRotation[];
            setSavedRotationsState(parsedRotations);
          }
        } catch (error) {
          setStorageErrors(prev => [...prev, `Saved rotations load error: ${error}`]);
        }

      } catch (error) {
        console.error('Critical error loading data:', error);
        setStorageErrors(prev => [...prev, `Critical load error: ${error}`]);
        
        // Fallback to fake data
        const fakeData = generateFakeData();
        setPlayersState(fakeData);
      } finally {
        setIsDataLoaded(true);
      }
    };

    loadData();
  }, [setPlayers, setSquads, setFormations, setDues]);  const addSquad = useCallback((squad: Squad) => {
    setSquadsState(prev => {
      const updated = [...prev, squad];
      console.log('Adding squad:', squad);
      console.log('Updated squads:', updated);
      // Save to localStorage with the updated array
      const result = LocalStorageManager.save(STORAGE_KEYS.squads, updated, DataValidators.isSquadsArray);
      if (!result.success) {
        setStorageErrors(prevErrors => [...prevErrors, `Failed to save squads: ${result.error?.message}`]);
      }
      return updated;
    });
  }, []);

  const addFormation = useCallback((formation: Formation) => {
    setFormations(prev => [...prev, formation]);
  }, [setFormations]);
  const addDue = useCallback((due: Due) => {
    setDues(prev => [...prev, due]);
  }, [setDues]);

  const addSavedRotation = useCallback((rotation: SavedRotation) => {
    setSavedRotations(prev => [...prev, rotation]);
  }, [setSavedRotations]);

  const updateDue = useCallback((id: string, updates: Partial<Due>) => {
    setDues(prev => prev.map(due => due.id === id ? { ...due, ...updates } : due));
  }, [setDues]);

  const addPlayer = useCallback((player: Player) => {
    setPlayers(prev => [...prev, player]);
  }, [setPlayers]);

  const updatePlayer = useCallback((id: string, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(player => player.id === id ? { ...player, ...updates } : player));
  }, [setPlayers]);

  const replacePlayerInSquad = useCallback((squadId: string, oldPlayerId: string, newPlayer: Player) => {
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
  }, [setSquads]);

  // Storage management methods
  const getStorageHealth = useCallback(() => {
    return LocalStorageManager.getStorageInfo();
  }, []);
  const exportAllData = useCallback(() => {
    return {
      players,
      squads,
      formations,
      dues,
      savedRotations,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }, [players, squads, formations, dues, savedRotations]);

  const importAllData = useCallback(async (data: any): Promise<boolean> => {
    try {
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid import data format');
      }

      const errors: string[] = [];

      // Validate and import players
      if (data.players && DataValidators.isPlayersArray(data.players)) {
        setPlayers(data.players);
      } else if (data.players) {
        errors.push('Invalid players data format');
      }

      // Validate and import squads
      if (data.squads && DataValidators.isSquadsArray(data.squads)) {
        setSquads(data.squads);
      } else if (data.squads) {
        errors.push('Invalid squads data format');
      }

      // Validate and import formations
      if (data.formations && DataValidators.isFormationsArray(data.formations)) {
        setFormations(data.formations);
      } else if (data.formations) {
        errors.push('Invalid formations data format');
      }      // Validate and import dues
      if (data.dues && DataValidators.isDuesArray(data.dues)) {
        setDues(data.dues);
      } else if (data.dues) {
        errors.push('Invalid dues data format');
      }

      // Validate and import saved rotations
      if (data.savedRotations && Array.isArray(data.savedRotations)) {
        setSavedRotations(data.savedRotations);
      } else if (data.savedRotations) {
        errors.push('Invalid saved rotations data format');
      }

      if (errors.length > 0) {
        setStorageErrors(prev => [...prev, ...errors]);
        return false;
      }      return true;
    } catch (error) {
      setStorageErrors(prev => [...prev, `Import failed: ${error}`]);
      return false;
    }
  }, [setPlayers, setSquads, setFormations, setDues, setSavedRotations]);
  const clearAllData = useCallback(() => {
    try {
      LocalStorageManager.clearAll();
      localStorage.removeItem('fantacalcietto-savedRotations');
      setPlayersState([]);
      setSquadsState([]);
      setFormationsState([]);
      setDuesState([]);
      setSavedRotationsState([]);
      setStorageErrors([]);
    } catch (error) {
      setStorageErrors(prev => [...prev, `Clear data failed: ${error}`]);
    }
  }, []);
  return (
    <FantacalciettoContext.Provider value={{
      players,
      squads,
      formations,
      dues,
      savedRotations,
      setPlayers,
      setSquads,
      setFormations,
      setDues,
      setSavedRotations,
      addSquad,
      addFormation,
      addDue,
      addSavedRotation,
      updateDue,
      addPlayer,
      updatePlayer,
      replacePlayerInSquad,
      getStorageHealth,
      exportAllData,
      importAllData,
      clearAllData,
      isDataLoaded,
      storageErrors,
    }}>
      {children}
    </FantacalciettoContext.Provider>
  );
};
