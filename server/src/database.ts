import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../data');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json');
const DECISIONS_FILE = path.join(DATA_DIR, 'team_decisions.json');
const RESULTS_FILE = path.join(DATA_DIR, 'cycle_results.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
function initFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]), 'utf8');
  }
}

initFile(GAMES_FILE);
initFile(TEAMS_FILE);
initFile(DECISIONS_FILE);
initFile(RESULTS_FILE);

// Helper functions to read/write JSON
function readJSON(filePath: string): any[] {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeJSON(filePath: string, data: any[]) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Database interface
export const db = {
  prepare: (query: string) => {
    return {
      run: (...params: any[]) => {
        // INSERT INTO games
        if (query.includes('INSERT INTO games')) {
          const games = readJSON(GAMES_FILE);
          const [id, gameCode, createdAt, status, numberOfTeams, currentCycle, scenarioSeed, facilitatorName] = params;
          games.push({
            id,
            game_code: gameCode,
            created_at: createdAt,
            status,
            number_of_teams: numberOfTeams,
            current_cycle: currentCycle,
            scenario_seed: scenarioSeed,
            facilitator_name: facilitatorName
          });
          writeJSON(GAMES_FILE, games);
          return { changes: 1 };
        }
        
        // INSERT INTO teams
        if (query.includes('INSERT INTO teams')) {
          const teams = readJSON(TEAMS_FILE);
          const [id, gameId, name, joinedAt, roleAssignments, cumulativeScore] = params;
          teams.push({
            id,
            game_id: gameId,
            name,
            joined_at: joinedAt,
            role_assignments: roleAssignments,
            cumulative_score: cumulativeScore
          });
          writeJSON(TEAMS_FILE, teams);
          return { changes: 1 };
        }
        
        // INSERT INTO team_decisions (handles INSERT OR REPLACE)
        if (query.includes('INSERT') && query.includes('team_decisions')) {
          const decisions = readJSON(DECISIONS_FILE);
          const [id, teamId, gameId, cycle, decisionsJson, submittedAt] = params;
          
          // Remove existing entry for this team+cycle (for INSERT OR REPLACE)
          const filtered = decisions.filter(d => !(d.team_id === teamId && d.cycle === cycle));
          
          filtered.push({
            id,
            team_id: teamId,
            game_id: gameId,
            cycle,
            decisions: decisionsJson,
            submitted_at: submittedAt
          });
          writeJSON(DECISIONS_FILE, filtered);
          return { changes: 1 };
        }
        
        // INSERT INTO cycle_results
        if (query.includes('INSERT INTO cycle_results')) {
          const results = readJSON(RESULTS_FILE);
          const [id, gameId, cycle, teamId, scores, metrics, incidents, calculatedAt] = params;
          results.push({
            id,
            game_id: gameId,
            cycle,
            team_id: teamId,
            scores,
            metrics,
            incidents,
            calculated_at: calculatedAt
          });
          writeJSON(RESULTS_FILE, results);
          return { changes: 1 };
        }
        
        // UPDATE games
        if (query.includes('UPDATE games')) {
          const games = readJSON(GAMES_FILE);
          console.log('UPDATE games query:', query);
          console.log('UPDATE games params:', params);
          
          if (query.includes('SET status = ?, current_cycle = ?')) {
            const [status, currentCycle, id] = params;
            const game = games.find(g => g.id === id);
            if (game) {
              game.status = status;
              game.current_cycle = currentCycle;
              writeJSON(GAMES_FILE, games);
              console.log('Updated game status to:', status, 'cycle:', currentCycle);
            }
          } else if (query.includes('SET status = ?')) {
            const [status, id] = params;
            console.log('Updating status to:', status, 'for id:', id);
            const game = games.find(g => g.id === id);
            if (game) {
              game.status = status;
              writeJSON(GAMES_FILE, games);
              console.log('Updated game status to:', status);
            } else {
              console.log('Game not found with id:', id);
            }
          } else if (query.includes('SET current_cycle = ?, status = ?')) {
            const [currentCycle, status, id] = params;
            const game = games.find(g => g.id === id);
            if (game) {
              game.current_cycle = currentCycle;
              game.status = status;
              writeJSON(GAMES_FILE, games);
            }
          }
          return { changes: 1 };
        }
        
        // UPDATE teams
        if (query.includes('UPDATE teams')) {
          const teams = readJSON(TEAMS_FILE);
          const [cumulativeScore, id] = params;
          const team = teams.find(t => t.id === id);
          if (team) {
            team.cumulative_score = cumulativeScore;
            writeJSON(TEAMS_FILE, teams);
          }
          return { changes: 1 };
        }
        
        return { changes: 0 };
      },
      
      get: (...params: any[]) => {
        // SELECT from games
        if (query.includes('FROM games WHERE game_code = ?')) {
          const games = readJSON(GAMES_FILE);
          return games.find(g => g.game_code === params[0]) || null;
        }
        
        if (query.includes('FROM games WHERE id = ?')) {
          const games = readJSON(GAMES_FILE);
          return games.find(g => g.id === params[0]) || null;
        }
        
        // SELECT from teams
        if (query.includes('FROM teams WHERE id = ?')) {
          const teams = readJSON(TEAMS_FILE);
          return teams.find(t => t.id === params[0]) || null;
        }
        
        // COUNT teams
        if (query.includes('COUNT(*) as count FROM teams')) {
          const teams = readJSON(TEAMS_FILE);
          const gameId = params[0];
          const count = teams.filter(t => t.game_id === gameId).length;
          return { count };
        }
        
        return null;
      },
      
      all: (...params: any[]) => {
        // SELECT teams
        if (query.includes('FROM teams WHERE game_id = ?')) {
          const teams = readJSON(TEAMS_FILE);
          return teams.filter(t => t.game_id === params[0]);
        }
        
        // SELECT team_decisions
        if (query.includes('FROM team_decisions WHERE game_id = ? AND cycle = ?')) {
          const decisions = readJSON(DECISIONS_FILE);
          const filtered = decisions.filter(d => d.game_id === params[0] && d.cycle === params[1]);
          
          // Handle DISTINCT team_id
          if (query.includes('DISTINCT team_id')) {
            const uniqueTeamIds = [...new Set(filtered.map(d => d.team_id))];
            return uniqueTeamIds.map(id => ({ team_id: id }));
          }
          
          return filtered;
        }
        
        // SELECT cycle_results
        if (query.includes('FROM cycle_results WHERE game_id = ? AND cycle = ?')) {
          const results = readJSON(RESULTS_FILE);
          return results.filter(r => r.game_id === params[0] && r.cycle === params[1]);
        }
        
        return [];
      }
    };
  }
};

export function initDatabase() {
  console.log('JSON database initialized');
  console.log('Data directory:', DATA_DIR);
  return db;
}

export function getDatabase() {
  return db;
}
