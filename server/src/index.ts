import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { initDatabase, getDatabase } from './database';
import { calculateCycleResults, getDecisions } from './engine/gameEngine';
import { generateFacilitationPrompts } from './engine/promptEngine';
import { generateEventsForCycle, RandomEvent } from './engine/eventsEngine';
import { generateFacilitatorPrompts, generateCyclePrompts, TeamContext, GameContext } from './debrief';
import {
  Game,
  Team,
  TeamDecisions,
  CycleResults,
  INITIAL_BUDGETS,
  CreateGameRequest,
  ScoreBreakdown,
} from '@safe-by-design/shared';
import cycleBriefs from './data/cycleBriefs.json';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
  // Heartbeat configuration
  pingTimeout: 60000,      // How long to wait for pong response (60 seconds)
  pingInterval: 25000,     // How often to send ping (25 seconds)
  connectTimeout: 45000,   // Connection timeout
});

app.use(cors());
app.use(express.json());

// Initialize database
const db = initDatabase();

// API Routes
app.post('/api/games', (req, res) => {
  try {
    const { numberOfTeams, facilitatorName }: CreateGameRequest = req.body;
    
    if (!numberOfTeams || numberOfTeams < 2 || numberOfTeams > 6) {
      return res.status(400).json({ error: 'Number of teams must be between 2 and 6' });
    }
    
    const gameId = nanoid();
    const gameCode = generateGameCode();
    const scenarioSeed = Math.floor(Math.random() * 1000000);
    
    const game: Game = {
      id: gameId,
      gameCode,
      createdAt: new Date().toISOString(),
      status: 'lobby',
      numberOfTeams,
      currentCycle: 1,
      scenarioSeed,
      facilitatorName,
    };
    
    db.prepare(`
      INSERT INTO games (id, game_code, created_at, status, number_of_teams, current_cycle, scenario_seed, facilitator_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      game.id,
      game.gameCode,
      game.createdAt,
      game.status,
      game.numberOfTeams,
      game.currentCycle,
      game.scenarioSeed,
      game.facilitatorName || null
    );
    
    res.json({ success: true, data: { game, gameCode } });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

app.get('/api/games/:gameCode', (req, res) => {
  try {
    const { gameCode } = req.params;
    const game = db.prepare('SELECT * FROM games WHERE game_code = ?').get(gameCode);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json({ success: true, data: mapGameFromDb(game) });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

app.get('/api/games/:gameId/teams', (req, res) => {
  try {
    const { gameId } = req.params;
    const teams = db.prepare('SELECT * FROM teams WHERE game_id = ?').all(gameId);
    
    res.json({ success: true, data: teams.map(mapTeamFromDb) });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

app.get('/api/decisions', (req, res) => {
  try {
    res.json({ success: true, data: getDecisions() });
  } catch (error) {
    console.error('Error fetching decisions:', error);
    res.status(500).json({ error: 'Failed to fetch decisions' });
  }
});

app.get('/api/cycles/:cycle/brief', (req, res) => {
  try {
    const cycle = parseInt(req.params.cycle);
    const brief = cycleBriefs.find(b => b.cycle === cycle);
    
    if (!brief) {
      return res.status(404).json({ error: 'Brief not found' });
    }
    
    res.json({ success: true, data: brief });
  } catch (error) {
    console.error('Error fetching brief:', error);
    res.status(500).json({ error: 'Failed to fetch brief' });
  }
});

app.get('/api/games/:gameId/prompts/:cycle', (req, res) => {
  try {
    const { gameId, cycle } = req.params;
    const cycleNum = parseInt(cycle);
    
    console.log('Fetching prompts for game:', gameId, 'cycle:', cycleNum);
    
    // Get game
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as any;
    if (!game) {
      console.log('Game not found:', gameId);
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Get all teams
    const teams = db.prepare('SELECT * FROM teams WHERE game_id = ?').all(gameId) as any[];
    console.log('Found teams:', teams.length);
    
    // Get cycle results
    const results = db.prepare(
      'SELECT * FROM cycle_results WHERE game_id = ? AND cycle = ?'
    ).all(gameId, cycleNum) as any[];
    console.log('Found results:', results.length);
    
    // Get team decisions
    const decisions = db.prepare(
      'SELECT * FROM team_decisions WHERE game_id = ? AND cycle = ?'
    ).all(gameId, cycleNum) as any[];
    console.log('Found decisions:', decisions.length);
    
    // Generate prompts for each team and plenary
    const prompts = generateFacilitationPrompts(
      mapGameFromDb(game),
      teams.map(mapTeamFromDb),
      results.map(mapCycleResultFromDb),
      decisions.map(mapTeamDecisionFromDb),
      cycleNum
    );
    
    console.log('Generated prompts:', prompts?.length || 0);
    
    res.json({ success: true, data: prompts });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join_game', async ({ gameCode, teamName, roles }) => {
    console.log('=== JOIN_GAME received ===');
    console.log('Game code:', gameCode);
    console.log('Team name:', teamName);
    
    try {
      const game = db.prepare('SELECT * FROM games WHERE game_code = ?').get(gameCode) as any;
      
      if (!game) {
        console.log('Game not found for code:', gameCode);
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      const mappedGame = mapGameFromDb(game);
      console.log('Game found:', mappedGame.id, 'status:', mappedGame.status);
      
      // Check if game is in lobby
      if (mappedGame.status !== 'lobby') {
        socket.emit('error', { message: 'Game has already started' });
        return;
      }
      
      // Check team capacity
      const existingTeams = db.prepare('SELECT COUNT(*) as count FROM teams WHERE game_id = ?').get(mappedGame.id) as any;
      if (existingTeams.count >= mappedGame.numberOfTeams) {
        socket.emit('error', { message: 'Game is full' });
        return;
      }
      
      // Create team
      const teamId = nanoid();
      const team: Team = {
        id: teamId,
        gameId: mappedGame.id,
        name: teamName,
        joinedAt: new Date().toISOString(),
        roleAssignments: roles,
        cumulativeScore: { safety: 0, equity: 0, staff: 0, resilience: 0, total: 0 },
      };
      
      db.prepare(`
        INSERT INTO teams (id, game_id, name, joined_at, role_assignments, cumulative_score)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        team.id,
        team.gameId,
        team.name,
        team.joinedAt,
        JSON.stringify(team.roleAssignments),
        JSON.stringify(team.cumulativeScore)
      );
      
      socket.join(`game-${mappedGame.id}`);
      socket.data.teamId = teamId;
      socket.data.gameId = mappedGame.id;
      
      // Emit team_joined to both game and facilitator rooms
      console.log('Emitting team_joined to game-' + mappedGame.id + ' and facilitator-' + mappedGame.id);
      io.to(`game-${mappedGame.id}`).emit('team_joined', team);
      io.to(`facilitator-${mappedGame.id}`).emit('team_joined', team);
      
      // Send game state to the joining team
      socket.emit('game_updated', mappedGame);
      
      // Also send updated game state to facilitator
      console.log('Emitting game_updated to facilitator-' + mappedGame.id);
      io.to(`facilitator-${mappedGame.id}`).emit('game_updated', mappedGame);
      
      // Check if all teams have joined and game should auto-start
      const allTeams = db.prepare('SELECT COUNT(*) as count FROM teams WHERE game_id = ?').get(mappedGame.id) as any;
      console.log('Team count:', allTeams.count, '/', mappedGame.numberOfTeams);
      if (allTeams.count === mappedGame.numberOfTeams && mappedGame.status === 'lobby') {
        // Don't auto-start, wait for facilitator
        io.to(`facilitator-${mappedGame.id}`).emit('all_teams_ready', {});
      }
    } catch (error) {
      console.error('Error joining game:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });
  
  socket.on('join_facilitator', async ({ gameCode }, callback) => {
    console.log('=== JOIN_FACILITATOR received ===');
    console.log('Game code:', gameCode);
    console.log('Socket ID:', socket.id);
    
    try {
      const game = db.prepare('SELECT * FROM games WHERE game_code = ?').get(gameCode) as any;
      
      if (!game) {
        console.log('Game not found for code:', gameCode);
        if (callback) callback({ error: 'Game not found' });
        return;
      }
      
      const mappedGame = mapGameFromDb(game);
      console.log('Facilitator joining game:', mappedGame.id);
      
      socket.join(`game-${mappedGame.id}`);
      socket.join(`facilitator-${mappedGame.id}`);
      socket.data.gameId = mappedGame.id;
      socket.data.isFacilitator = true;
      
      console.log('Facilitator joined rooms: game-' + mappedGame.id + ', facilitator-' + mappedGame.id);
      
      // Get all current teams
      const teams = db.prepare('SELECT * FROM teams WHERE game_id = ?').all(mappedGame.id) as any[];
      const mappedTeams = teams.map(team => ({
        id: team.id,
        gameId: team.game_id,
        name: team.name,
        joinedAt: team.joined_at,
        roleAssignments: typeof team.role_assignments === 'string' ? JSON.parse(team.role_assignments) : team.role_assignments,
        cumulativeScore: typeof team.cumulative_score === 'string' ? JSON.parse(team.cumulative_score) : team.cumulative_score
      }));
      
      console.log('Sending', mappedTeams.length, 'teams to facilitator via callback');
      
      // Send everything via callback (Pitch Perfect pattern)
      if (callback) {
        callback({
          success: true,
          game: mappedGame,
          teams: mappedTeams
        });
      }
      
      // Also emit for any listeners
      socket.emit('game_updated', mappedGame);
    } catch (error) {
      console.error('Error joining as facilitator:', error);
      if (callback) callback({ error: 'Failed to join as facilitator' });
    }
  });
  
  socket.on('start_cycle', async ({ gameId, cycle }) => {
    console.log('=== START_CYCLE received ===');
    console.log('Game ID:', gameId);
    console.log('Cycle:', cycle);
    
    try {
      db.prepare('UPDATE games SET status = ?, current_cycle = ? WHERE id = ?')
        .run('in_cycle', cycle, gameId);
      
      const updatedGame = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as any;
      const mappedGame = mapGameFromDb(updatedGame);
      console.log('Game status after start:', mappedGame.status);
      
      const brief = cycleBriefs.find(b => b.cycle === cycle);
      
      // Generate random events for this cycle
      const events = generateEventsForCycle(cycle, mappedGame.scenarioSeed || 12345, []);
      console.log('Generated events:', events.length);
      
      // Get previous cycle results to build system state
      const allResults = db.prepare('SELECT * FROM cycle_results WHERE game_id = ? ORDER BY cycle DESC').all(gameId) as any[];
      const teams = db.prepare('SELECT * FROM teams WHERE game_id = ?').all(gameId) as any[];
      
      // Build initial system state (average of last cycle or defaults)
      let systemState = {
        backlog: 35,
        dnaRate: 8,
        staffSickness: 12,
        staffMorale: 72,
        highRiskShare: 28,
        incidents: 0,
      };
      
      if (allResults.length > 0) {
        // Average across teams from last cycle
        const lastCycleResults = allResults.filter(r => r.cycle === cycle - 1);
        if (lastCycleResults.length > 0) {
          const avgMetrics = lastCycleResults.reduce((acc, r) => {
            const metrics = typeof r.metrics === 'string' ? JSON.parse(r.metrics) : r.metrics;
            return {
              backlog: acc.backlog + (metrics.backlog || 0),
              dnaRate: acc.dnaRate + (metrics.dnaRate || 0),
              staffSickness: acc.staffSickness + (metrics.staffSickness || 0),
              incidents: acc.incidents + (metrics.incidents || 0),
            };
          }, { backlog: 0, dnaRate: 0, staffSickness: 0, incidents: 0 });
          
          const count = lastCycleResults.length;
          systemState = {
            backlog: Math.round(avgMetrics.backlog / count),
            dnaRate: Math.round(avgMetrics.dnaRate / count),
            staffSickness: Math.round(avgMetrics.staffSickness / count),
            staffMorale: 72, // TODO: track properly
            highRiskShare: 28,
            incidents: Math.round(avgMetrics.incidents / count),
          };
        }
      }
      
      // Build leaderboard
      const leaderboard = teams.map(t => {
        const cumScore = typeof t.cumulative_score === 'string' 
          ? JSON.parse(t.cumulative_score) 
          : t.cumulative_score;
        return {
          teamName: t.name,
          score: cumScore?.total || 0,
          rank: 0,
        };
      }).sort((a, b) => b.score - a.score).map((t, idx) => ({ ...t, rank: idx + 1 }));
      
      // Emit to all clients so they update their game status
      io.to(`game-${gameId}`).emit('game_updated', mappedGame);
      io.to(`facilitator-${gameId}`).emit('game_updated', mappedGame);
      io.to(`game-${gameId}`).emit('cycle_started', { cycle, brief, events, systemState });
      io.to(`facilitator-${gameId}`).emit('cycle_started', { cycle, brief, events, systemState });
      io.to(`game-${gameId}`).emit('leaderboard_updated', { leaderboard });
      io.to(`facilitator-${gameId}`).emit('leaderboard_updated', { leaderboard });
      
      console.log('Cycle started, events emitted');
    } catch (error) {
      console.error('Error starting cycle:', error);
      socket.emit('error', { message: 'Failed to start cycle' });
    }
  });
  
  socket.on('submit_decisions', async ({ teamId, decisions }) => {
    console.log('=== SUBMIT_DECISIONS received ===');
    console.log('Team ID:', teamId);
    console.log('Decisions:', decisions);
    
    try {
      const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId) as any;
      console.log('Team found:', team ? team.name : 'NOT FOUND');
      
      if (!team) {
        socket.emit('error', { message: 'Team not found' });
        return;
      }
      
      const game = db.prepare('SELECT * FROM games WHERE id = ?').get(team.game_id) as any;
      const mappedGame = mapGameFromDb(game);
      console.log('Game status:', mappedGame.status);
      
      if (mappedGame.status !== 'in_cycle') {
        console.log('ERROR: Not in decision phase, status is:', mappedGame.status);
        socket.emit('error', { message: 'Not in decision phase' });
        return;
      }
      
      const decisionId = nanoid();
      const teamDecisions: TeamDecisions = {
        id: decisionId,
        teamId,
        gameId: team.game_id,
        cycle: mappedGame.currentCycle,
        decisions,
        submittedAt: new Date().toISOString(),
        budgetsUsed: INITIAL_BUDGETS, // Would calculate actual usage
      };
      
      db.prepare(`
        INSERT OR REPLACE INTO team_decisions (id, team_id, game_id, cycle, decisions, submitted_at, budgets_used)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        teamDecisions.id,
        teamDecisions.teamId,
        teamDecisions.gameId,
        teamDecisions.cycle,
        JSON.stringify(teamDecisions.decisions),
        teamDecisions.submittedAt,
        JSON.stringify(teamDecisions.budgetsUsed)
      );
      
      // Notify facilitator
      io.to(`facilitator-${team.game_id}`).emit('team_submitted', { 
        teamId: team.id, 
        teamName: team.name 
      });
      
      // Check if all teams have submitted
      const allTeams = db.prepare('SELECT * FROM teams WHERE game_id = ?').all(team.game_id) as any[];
      const submittedDecisions = db.prepare(
        'SELECT DISTINCT team_id FROM team_decisions WHERE game_id = ? AND cycle = ?'
      ).all(team.game_id, mappedGame.currentCycle) as any[];
      
      console.log('=== CHECKING ALL SUBMITTED ===');
      console.log('All teams count:', allTeams.length);
      console.log('Submitted decisions count:', submittedDecisions.length);
      console.log('All teams:', allTeams.map(t => t.name));
      console.log('Submitted team IDs:', submittedDecisions);
      
      const allSubmitted = allTeams.length === submittedDecisions.length;
      console.log('All submitted?', allSubmitted);
      
      if (allSubmitted) {
        // Auto-calculate results
        console.log('All teams submitted, auto-calculating results...');
        console.log('Updating game status to results for game:', team.game_id);
        
        db.prepare('UPDATE games SET status = ? WHERE id = ?').run('results', team.game_id);
        
        // Verify the update worked
        const checkGame = db.prepare('SELECT * FROM games WHERE id = ?').get(team.game_id) as any;
        console.log('Game after update:', checkGame?.status);
        
        const results: CycleResults[] = [];
        
        for (const t of allTeams) {
          const teamDecs = db.prepare(
            'SELECT * FROM team_decisions WHERE team_id = ? AND cycle = ?'
          ).get(t.id, mappedGame.currentCycle) as any;
          
          const selectedDecisionIds = teamDecs ? JSON.parse(teamDecs.decisions) : [];
          
          // Map decision IDs to full decision objects
          const allDecisions = getDecisions();
          const selectedDecisions = selectedDecisionIds
            .map((id: string) => allDecisions.find(d => d.id === id))
            .filter(Boolean);
          
          const context = {
            teamId: t.id,
            gameId: team.game_id,
            cycle: mappedGame.currentCycle,
            scenarioSeed: mappedGame.scenarioSeed,
            selectedDecisions,
          };
          
          const result = calculateCycleResults(context);
          
          db.prepare(`
            INSERT INTO cycle_results (id, game_id, cycle, team_id, scores, metrics, incidents, calculated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            result.id,
            result.gameId,
            result.cycle,
            result.teamId,
            JSON.stringify(result.scores),
            JSON.stringify(result.metrics),
            JSON.stringify(result.incidents),
            result.calculatedAt
          );
          
          // Update cumulative scores
          const mappedTeam = mapTeamFromDb(t);
          const newCumulative = {
            safety: mappedTeam.cumulativeScore.safety + result.scores.safety,
            equity: mappedTeam.cumulativeScore.equity + result.scores.equity,
            staff: mappedTeam.cumulativeScore.staff + result.scores.staff,
            resilience: mappedTeam.cumulativeScore.resilience + result.scores.resilience,
            total: mappedTeam.cumulativeScore.total + result.scores.total,
          };
          
          db.prepare('UPDATE teams SET cumulative_score = ? WHERE id = ?')
            .run(JSON.stringify(newCumulative), t.id);
          
          results.push(result);
        }
        
        // Debug: Log results before broadcast
        console.log('=== BROADCASTING RESULTS ===');
        console.log('Results count:', results.length);
        for (const r of results) {
          console.log('Team:', r.teamId);
          console.log('Scores:', r.scores);
          console.log('Metrics:', r.metrics);
          console.log('Incidents:', r.incidents);
        }
        
        // Get updated game state and broadcast
        const updatedGame = db.prepare('SELECT * FROM games WHERE id = ?').get(team.game_id) as any;
        const updatedMappedGame = mapGameFromDb(updatedGame);
        
        console.log('Broadcasting game_updated with status:', updatedMappedGame.status);
        console.log('Emitting to rooms: game-' + team.game_id + ' and facilitator-' + team.game_id);
        
        io.to(`game-${team.game_id}`).emit('game_updated', updatedMappedGame);
        io.to(`facilitator-${team.game_id}`).emit('game_updated', updatedMappedGame);
        io.to(`game-${team.game_id}`).emit('results_ready', { cycle: mappedGame.currentCycle, results });
        io.to(`facilitator-${team.game_id}`).emit('results_ready', { cycle: mappedGame.currentCycle, results });
        
        // Generate and emit debrief prompts
        try {
          const allTeamsForDebrief = db.prepare('SELECT * FROM teams WHERE game_id = ?').all(team.game_id) as any[];
          const allDecisionsForDebrief = db.prepare('SELECT * FROM team_decisions WHERE game_id = ?').all(team.game_id) as any[];
          const allResultsForDebrief = db.prepare('SELECT * FROM cycle_results WHERE game_id = ?').all(team.game_id) as any[];
          
          // Build team contexts for debrief
          const teamContexts: TeamContext[] = allTeamsForDebrief.map(t => {
            const teamResults = allResultsForDebrief
              .filter(r => r.team_id === t.id)
              .map(r => ({
                cycle: r.cycle,
                scores: typeof r.scores === 'string' ? JSON.parse(r.scores) : r.scores,
                metrics: typeof r.metrics === 'string' ? JSON.parse(r.metrics) : r.metrics,
                incidents: typeof r.incidents === 'string' ? JSON.parse(r.incidents) : r.incidents
              }));
            
            const teamDecisions = allDecisionsForDebrief
              .filter(d => d.team_id === t.id)
              .map(d => ({
                cycle: d.cycle,
                decisions: typeof d.decisions === 'string' ? JSON.parse(d.decisions) : d.decisions
              }));
            
            const cumScore = typeof t.cumulative_score === 'string' 
              ? JSON.parse(t.cumulative_score) 
              : t.cumulative_score;
            
            return {
              teamId: t.id,
              teamName: t.name,
              currentCycle: mappedGame.currentCycle,
              cycleResults: teamResults,
              decisions: teamDecisions,
              cumulativeScore: cumScore
            };
          });
          
          // Build game context
          const gameContext: GameContext = {
            totalTeams: teamContexts.length,
            currentCycle: mappedGame.currentCycle,
            leaderByCycle: [], // TODO: Track leader by cycle
            allTeams: teamContexts
          };
          
          // Generate cycle-specific prompts
          const cyclePrompts = generateCyclePrompts(teamContexts, gameContext, mappedGame.currentCycle);
          
          console.log('📋 Debrief prompts generated for cycle', mappedGame.currentCycle);
          io.to(`facilitator-${team.game_id}`).emit('debrief_prompts', cyclePrompts);
          
          // Build and emit updated leaderboard
          const leaderboard = allTeamsForDebrief.map(t => {
            const cumScore = typeof t.cumulative_score === 'string' 
              ? JSON.parse(t.cumulative_score) 
              : t.cumulative_score;
            return {
              teamName: t.name,
              teamId: t.id,
              scores: cumScore,
              score: cumScore?.total || 0,
              rank: 0,
            };
          }).sort((a, b) => b.score - a.score).map((t, idx) => ({ ...t, rank: idx + 1 }));
          
          io.to(`game-${team.game_id}`).emit('leaderboard_updated', { leaderboard });
          io.to(`facilitator-${team.game_id}`).emit('leaderboard_updated', { leaderboard });
        } catch (debriefError) {
          console.error('Error generating debrief prompts:', debriefError);
        }
        
        console.log('Results broadcast complete');
      }
    } catch (error) {
      console.error('Error submitting decisions:', error);
      socket.emit('error', { message: 'Failed to submit decisions' });
    }
  });
  
  socket.on('close_submissions', async ({ gameId, cycle }) => {
    try {
      db.prepare('UPDATE games SET status = ? WHERE id = ?').run('results', gameId);
      
      // Calculate results for all teams
      const teams = db.prepare('SELECT * FROM teams WHERE game_id = ?').all(gameId) as any[];
      const results: CycleResults[] = [];
      
      for (const team of teams) {
        const decisions = db.prepare(
          'SELECT * FROM team_decisions WHERE team_id = ? AND cycle = ?'
        ).get(team.id, cycle) as any;
        
        const previousResults = db.prepare(
          'SELECT * FROM cycle_results WHERE team_id = ? AND cycle = ? ORDER BY cycle DESC LIMIT 1'
        ).get(team.id, cycle - 1) as any;
        
        const decisionIds = decisions ? JSON.parse(decisions.decisions) : [];
        
        const gameData = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as any;
        
        const result = calculateCycleResults({
          teamId: team.id,
          gameId,
          cycle,
          scenarioSeed: gameData.scenario_seed,
          selectedDecisions: getDecisions().filter(d => decisionIds.includes(d.id)),
          previousResults: previousResults ? mapResultsFromDb(previousResults) : undefined,
        });
        
        db.prepare(`
          INSERT INTO cycle_results (id, game_id, cycle, team_id, scores, metrics, incidents, calculated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          result.id,
          result.gameId,
          result.cycle,
          result.teamId,
          JSON.stringify(result.scores),
          JSON.stringify(result.metrics),
          JSON.stringify(result.incidents),
          result.calculatedAt
        );
        
        // Update cumulative scores
        const mappedTeam = mapTeamFromDb(team);
        const newCumulative = {
          safety: mappedTeam.cumulativeScore.safety + result.scores.safety,
          equity: mappedTeam.cumulativeScore.equity + result.scores.equity,
          staff: mappedTeam.cumulativeScore.staff + result.scores.staff,
          resilience: mappedTeam.cumulativeScore.resilience + result.scores.resilience,
          total: mappedTeam.cumulativeScore.total + result.scores.total,
        };
        
        db.prepare('UPDATE teams SET cumulative_score = ? WHERE id = ?')
          .run(JSON.stringify(newCumulative), team.id);
        
        results.push(result);
      }
      
      io.to(`game-${gameId}`).emit('submissions_closed', { cycle });
      io.to(`game-${gameId}`).emit('results_ready', { cycle, results });
    } catch (error) {
      console.error('Error closing submissions:', error);
      socket.emit('error', { message: 'Failed to close submissions' });
    }
  });
  
  socket.on('advance_cycle', async ({ gameId }) => {
    try {
      const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as any;
      const mappedGame = mapGameFromDb(game);
      const nextCycle = mappedGame.currentCycle + 1;
      
      if (nextCycle > 6) {
        db.prepare('UPDATE games SET status = ? WHERE id = ?').run('ended', gameId);
        io.to(`game-${gameId}`).emit('game_ended', {});
        io.to(`facilitator-${gameId}`).emit('game_ended', {});
      } else {
        // Auto-start next cycle
        db.prepare('UPDATE games SET current_cycle = ?, status = ? WHERE id = ?')
          .run(nextCycle, 'in_cycle', gameId);
        
        const updatedGame = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as any;
        const updatedMappedGame = mapGameFromDb(updatedGame);
        
        const brief = cycleBriefs.find(b => b.cycle === nextCycle);
        
        io.to(`game-${gameId}`).emit('game_updated', updatedMappedGame);
        io.to(`facilitator-${gameId}`).emit('game_updated', updatedMappedGame);
        io.to(`game-${gameId}`).emit('cycle_advanced', { cycle: nextCycle });
        io.to(`facilitator-${gameId}`).emit('cycle_advanced', { cycle: nextCycle });
        io.to(`game-${gameId}`).emit('cycle_started', { cycle: nextCycle, brief });
        io.to(`facilitator-${gameId}`).emit('cycle_started', { cycle: nextCycle, brief });
      }
    } catch (error) {
      console.error('Error advancing cycle:', error);
      socket.emit('error', { message: 'Failed to advance cycle' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Helper functions
function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function mapGameFromDb(game: any): Game {
  return {
    id: game.id,
    gameCode: game.game_code,
    createdAt: game.created_at,
    status: game.status,
    numberOfTeams: game.number_of_teams,
    currentCycle: game.current_cycle,
    scenarioSeed: game.scenario_seed,
    facilitatorName: game.facilitator_name,
  };
}

function mapTeamFromDb(team: any): Team {
  return {
    id: team.id,
    gameId: team.game_id,
    name: team.name,
    joinedAt: team.joined_at,
    roleAssignments: team.role_assignments ? JSON.parse(team.role_assignments) : undefined,
    cumulativeScore: JSON.parse(team.cumulative_score),
  };
}

function mapResultsFromDb(results: any): CycleResults {
  return {
    id: results.id,
    gameId: results.game_id,
    cycle: results.cycle,
    teamId: results.team_id,
    scores: typeof results.scores === 'string' ? JSON.parse(results.scores) : results.scores,
    metrics: typeof results.metrics === 'string' ? JSON.parse(results.metrics) : results.metrics,
    incidents: typeof results.incidents === 'string' ? JSON.parse(results.incidents) : results.incidents,
    calculatedAt: results.calculated_at,
  };
}

function mapCycleResultFromDb(result: any): CycleResults {
  return mapResultsFromDb(result);
}

function mapTeamDecisionFromDb(decision: any): TeamDecisions {
  return {
    id: decision.id,
    teamId: decision.team_id,
    gameId: decision.game_id,
    cycle: decision.cycle,
    decisions: typeof decision.decisions === 'string' ? JSON.parse(decision.decisions) : decision.decisions,
    submittedAt: decision.submitted_at,
  };
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
