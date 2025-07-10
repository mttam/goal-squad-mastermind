import { Player } from '@/types/fantacalcietto';

/**
 * CSV Parser utility for loading player data from CSV files
 */

export interface CSVPlayerRow {
  Name: string;
  Position: string;
  Goals: string;
  Assists: string;
  Saves: string;
  DefenderVoting: string;
}

/**
 * Parse CSV content and convert to Player objects
 */
export function parseCSVToPlayers(csvContent: string): Player[] {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header and one data row');
  }

  // Parse header
  const header = lines[0].split(',').map(col => col.trim());
  
  // Validate required columns
  const requiredColumns = ['Name', 'Position', 'Goals', 'Assists', 'Saves', 'DefenderVoting'];
  const missingColumns = requiredColumns.filter(col => !header.includes(col));
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  // Parse data rows
  const players: Player[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim());
    
    if (row.length !== header.length) {
      console.warn(`Row ${i + 1} has ${row.length} columns, expected ${header.length}. Skipping.`);
      continue;
    }

    // Create object from row data
    const rowData: Record<string, string> = {};
    header.forEach((col, index) => {
      rowData[col] = row[index];
    });

    // Convert to Player object
    try {
      const player: Player = {
        id: generatePlayerId(rowData.Name, i),
        name: rowData.Name,
        position: normalizePosition(rowData.Position),
        goals: parseInt(rowData.Goals) || 0,
        assists: parseInt(rowData.Assists) || 0,
        saves: parseInt(rowData.Saves) || 0,
        defenderVoting: parseInt(rowData.DefenderVoting) || 5
      };

      players.push(player);
    } catch (error) {
      console.warn(`Failed to parse row ${i + 1}:`, rowData, error);
    }
  }

  return players;
}

/**
 * Generate a unique ID for a player based on name and index
 */
function generatePlayerId(name: string, index: number): string {
  // Create a simple ID from name + index
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${cleanName}_${index}`;
}

/**
 * Normalize position string to match Player interface
 */
function normalizePosition(position: string): 'GK' | 'DEF' | 'MID' | 'ATT' {
  const pos = position.toUpperCase().trim();
  
  switch (pos) {
    case 'GK':
    case 'GOALKEEPER':
    case 'PORTIERE':
      return 'GK';
    case 'DEF':
    case 'DEFENDER':
    case 'DIFENSORE':
    case 'D':
      return 'DEF';
    case 'MID':
    case 'MIDFIELDER':
    case 'CENTROCAMPISTA':
    case 'M':
      return 'MID';
    case 'ATT':
    case 'ATTACKER':
    case 'FORWARD':
    case 'ATTACCANTE':
    case 'A':
    case 'F':
      return 'ATT';
    default:
      console.warn(`Unknown position "${position}", defaulting to MID`);
      return 'MID';
  }
}

/**
 * Load and parse CSV file from the public directory
 */
export async function loadPlayersFromCSV(): Promise<Player[]> {
  try {
    // In development, you might need to serve the CSV from public folder
    // or bundle it as a static asset
    const response = await fetch('/db_0.csv');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.status} ${response.statusText}`);
    }
    
    const csvContent = await response.text();
    return parseCSVToPlayers(csvContent);
  } catch (error) {
    console.error('Failed to load players from CSV:', error);
    
    // Fallback to hardcoded data based on the CSV content you provided
    return getFallbackPlayers();
  }
}

/**
 * Convert Player objects back to CSV format
 */
export function playersToCSV(players: Player[]): string {
  const headers = ['Name', 'Position', 'Goals', 'Assists', 'Saves', 'DefenderVoting'];
  
  const csvRows = [
    headers.join(','),
    ...players.map(player => [
      player.name,
      player.position,
      player.goals.toString(),
      player.assists.toString(),
      player.saves.toString(),
      player.defenderVoting.toString()
    ].join(','))
  ];
  
  return csvRows.join('\n');
}

/**
 * Save players data to CSV file (browser download)
 * Note: In a web browser environment, we can't directly write to the public folder
 * This function triggers a download of the updated CSV file
 */
export function savePlayersToCSV(players: Player[], filename: string = 'db_0.csv'): void {
  const csvContent = playersToCSV(players);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Update players data by merging with existing data from CSV
 * This function merges new player data with existing CSV data and returns the merged result
 */
export async function updatePlayersInCSV(updatedPlayers: Player[]): Promise<Player[]> {
  try {
    // Load existing players from CSV
    const existingPlayers = await loadPlayersFromCSV();
    
    // Create a map of existing players by name for efficient lookup
    const existingPlayersMap = new Map(existingPlayers.map(p => [p.name, p]));
    
    // Merge updated players with existing ones
    const mergedPlayers = [...existingPlayers];
    let addedCount = 0;
    let updatedCount = 0;
    
    updatedPlayers.forEach(updatedPlayer => {
      const existingIndex = mergedPlayers.findIndex(p => p.name === updatedPlayer.name);
      
      if (existingIndex >= 0) {
        // Update existing player
        mergedPlayers[existingIndex] = {
          ...mergedPlayers[existingIndex],
          ...updatedPlayer,
          id: mergedPlayers[existingIndex].id // Keep the original ID
        };
        updatedCount++;
      } else {
        // Add new player
        mergedPlayers.push({
          ...updatedPlayer,
          id: generatePlayerId(updatedPlayer.name, mergedPlayers.length + 1)
        });
        addedCount++;
      }
    });
    
    // Save the merged data to CSV (triggers download)
    savePlayersToCSV(mergedPlayers);
    
    console.log(`CSV Update: Added ${addedCount} new players, updated ${updatedCount} existing players`);
    
    return mergedPlayers;
  } catch (error) {
    console.error('Failed to update players in CSV:', error);
    throw error;
  }
}

/**
 * Fallback player data based on the CSV file content
 */
function getFallbackPlayers(): Player[] {
  return [
    { id: 'mattiaambrosiano_1', name: 'Mattia Ambrosiano', position: 'DEF', goals: 0, assists: 0, saves: 5, defenderVoting: 7 },
    { id: 'jacopodidonna_2', name: 'Jacopo Di Donna', position: 'ATT', goals: 20, assists: 10, saves: 0, defenderVoting: 5 },
    { id: 'castigliafrancesco_3', name: 'Castiglia Francesco', position: 'MID', goals: 5, assists: 10, saves: 0, defenderVoting: 5 },
    { id: 'antonellosantopaolo_4', name: 'Antonello Santopaolo', position: 'DEF', goals: 5, assists: 5, saves: 5, defenderVoting: 9 },
    { id: 'alessandrobruno_5', name: 'Alessandro Bruno', position: 'MID', goals: 10, assists: 15, saves: 5, defenderVoting: 6 },
    { id: 'francescogencarelli_6', name: 'Francesco Gencarelli', position: 'DEF', goals: 0, assists: 5, saves: 0, defenderVoting: 7 },
    { id: 'vittorioscarnati_7', name: 'Vittorio Scarnati', position: 'DEF', goals: 0, assists: 0, saves: 0, defenderVoting: 5 },
    { id: 'vladimirvena_8', name: 'Vladimir Vena', position: 'MID', goals: 5, assists: 5, saves: 0, defenderVoting: 5 },
    { id: 'francescobrogno_9', name: 'Francesco Brogno', position: 'MID', goals: 20, assists: 10, saves: 0, defenderVoting: 5 },
    { id: 'cicciogargiullo_10', name: 'Ciccio Gargiullo', position: 'MID', goals: 15, assists: 15, saves: 0, defenderVoting: 6 },
    { id: 'giovannibonofiglio_11', name: 'Giovanni Bonofiglio', position: 'ATT', goals: 30, assists: 0, saves: 0, defenderVoting: 5 },
    { id: 'nicoladidonna_12', name: 'Nicola Di Donna', position: 'MID', goals: 15, assists: 15, saves: 0, defenderVoting: 5 },
    { id: 'martinoperito_13', name: 'Martino Perito', position: 'MID', goals: 0, assists: 10, saves: 0, defenderVoting: 7 },
    { id: 'raffaelebiondi_14', name: 'Raffaele Biondi', position: 'DEF', goals: 0, assists: 0, saves: 5, defenderVoting: 7 },
    { id: 'gabrielegrandinetti_15', name: 'Gabriele Grandinetti', position: 'ATT', goals: 20, assists: 10, saves: 0, defenderVoting: 5 },
    { id: 'lucaferraro_16', name: 'Luca Ferraro', position: 'MID', goals: 0, assists: 0, saves: 0, defenderVoting: 5 },
    { id: 'matteosantoro_17', name: 'Matteo Santoro', position: 'MID', goals: 5, assists: 10, saves: 0, defenderVoting: 6 },
    { id: 'pietrofurfaro_18', name: 'Pietro Furfaro', position: 'DEF', goals: 0, assists: 5, saves: 0, defenderVoting: 7 },
    { id: 'kevinrubino_19', name: 'Kevin Rubino', position: 'MID', goals: 5, assists: 10, saves: 0, defenderVoting: 5 },
    { id: 'francescodantonio_20', name: 'Francesco D\'Antonio', position: 'MID', goals: 5, assists: 5, saves: 5, defenderVoting: 5 },
    { id: 'pietromazza_21', name: 'Pietro Mazza', position: 'MID', goals: 20, assists: 20, saves: 5, defenderVoting: 6 },
    { id: 'simonenicoletti_22', name: 'Simone Nicoletti', position: 'MID', goals: 5, assists: 5, saves: 5, defenderVoting: 6 },
    { id: 'renatoalfieri_23', name: 'Renato Alfieri', position: 'MID', goals: 0, assists: 0, saves: 0, defenderVoting: 5 },
    { id: 'simonepellicori_24', name: 'Simone Pellicori', position: 'ATT', goals: 25, assists: 5, saves: 0, defenderVoting: 5 },
    { id: 'niccolozagarese_25', name: 'Niccolò zagarese', position: 'MID', goals: 0, assists: 0, saves: 0, defenderVoting: 5 },
    { id: 'marcomolinaro_26', name: 'Marco Molinaro', position: 'MID', goals: 0, assists: 0, saves: 0, defenderVoting: 5 },
    { id: 'luigiferraro_27', name: 'Luigi Ferraro', position: 'ATT', goals: 0, assists: 0, saves: 0, defenderVoting: 5 },
    { id: 'iginobonetti_28', name: 'Igino Bonetti', position: 'ATT', goals: 0, assists: 0, saves: 0, defenderVoting: 5 }
  ];
}
