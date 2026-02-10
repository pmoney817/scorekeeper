import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, Trophy, Play, Edit3, Trash2, Shuffle, Target, Crown, MessageCircle, Send, Bot, Mic, ChevronUp, ChevronDown, ArrowUp, ArrowDown, Home } from 'lucide-react';

const PickleballTournament = () => {
  const [currentView, setCurrentView] = useState('format-select'); // format-select, setup, ai-setup, tournament, match, results
  const [tournamentType, setTournamentType] = useState('roundrobin'); // roundrobin, bracket, poolplay, ladder
  const [tournamentPhase, setTournamentPhase] = useState(null); // null, 'pools', 'bracket', 'playing', 'session-results'
  const [ladderSession, setLadderSession] = useState(0);
  const [courtAssignments, setCourtAssignments] = useState({});
  const [participantType, setParticipantType] = useState('individual'); // individual, team
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [tournamentSettings, setTournamentSettings] = useState({
    rounds: 6,
    courts: 1,
    numPools: 1,
    poolSize: 4,
    advanceCount: 2,
    pointsToWin: 11,
    winByTwo: true
  });

  // AI Setup states
  const [aiMessages, setAiMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  const [newParticipant, setNewParticipant] = useState({
    name: '',
    partner: ''
  });

  const [score, setScore] = useState({
    team1: 0,
    team2: 0
  });

  const [hydrated, setHydrated] = useState(false);

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pickleball-tournament');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.currentView && data.currentView !== 'setup') setCurrentView(data.currentView);
        if (data.currentView === 'setup' && data.matches && data.matches.length > 0) setCurrentView('setup');
        if (data.tournamentType) setTournamentType(data.tournamentType);
        if (data.participantType) setParticipantType(data.participantType);
        if (data.participants) setParticipants(data.participants);
        if (data.matches) setMatches(data.matches);
        if (data.currentMatch) setCurrentMatch(data.currentMatch);
        if (data.tournamentSettings) setTournamentSettings(data.tournamentSettings);
        if (data.score) setScore(data.score);
        if (data.tournamentPhase) setTournamentPhase(data.tournamentPhase);
        if (data.ladderSession) setLadderSession(data.ladderSession);
        if (data.courtAssignments) setCourtAssignments(data.courtAssignments);
      }
    } catch (e) {
      console.error('Failed to restore tournament state:', e);
    }
    setHydrated(true);
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('pickleball-tournament', JSON.stringify({
        currentView,
        tournamentType,
        tournamentPhase,
        participantType,
        participants,
        matches,
        currentMatch,
        tournamentSettings,
        score,
        ladderSession,
        courtAssignments,
      }));
    } catch (e) {
      console.error('Failed to save tournament state:', e);
    }
  }, [hydrated, currentView, tournamentType, tournamentPhase, participantType, participants, matches, currentMatch, tournamentSettings, score, ladderSession, courtAssignments]);

  // AI Setup functionality
  const processAISetup = async (userMessage) => {
    setIsProcessing(true);
    
    const messages = [
      {
        role: "user",
        content: `I need help setting up a pickleball tournament. Please extract the tournament details from this message and respond ONLY with a JSON object containing the extracted information. If any information is missing, set reasonable defaults.

User message: "${userMessage}"

Please extract and return JSON in this exact format:
{
  "tournamentType": "roundrobin" or "bracket",
  "participantType": "individual" or "team", 
  "rounds": number (1-5, only for round robin),
  "pointsToWin": 11, 15, or 21,
  "winByTwo": true or false,
  "participants": [
    {"name": "Player Name", "partner": "Partner Name (if team)"} 
  ]
}

Examples:
- "round robin with 4 players" → roundrobin, individual, reasonable defaults
- "bracket tournament with teams" → bracket, team
- "John, Mary, Bob playing to 15 points" → individual participants
- "Team Red: Alice & Bob, Team Blue: Carol & Dave" → team participants`
      }
    ];

    try {
      const response = await fetch("/api/ai-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      });

      const data = await response.json();
      const aiResponse = data.content[0]?.text || "";
      
      // Add messages to chat
      setAiMessages(prev => [
        ...prev,
        { role: "user", content: userMessage },
        { role: "assistant", content: "I'll help you set up the tournament! Let me extract the details..." }
      ]);

      // Try to parse JSON from the response
      try {
        // Clean the response to extract just the JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedInfo = JSON.parse(jsonMatch[0]);
          setExtractedData(extractedInfo);
          
          setAiMessages(prev => [
            ...prev,
            { role: "assistant", content: "Perfect! I extracted your tournament setup. Please review the details below and click 'Apply Settings' if everything looks good, or continue chatting to make adjustments." }
          ]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        setAiMessages(prev => [
          ...prev,
          { role: "assistant", content: "I had trouble understanding the tournament details. Could you please be more specific? For example: 'I want a round robin tournament with 6 individual players: John, Mary, Bob, Alice, Carol, and Dave. Play to 11 points.'" }
        ]);
      }
    } catch (error) {
      console.error("AI API error:", error);
      setAiMessages(prev => [
        ...prev,
        { role: "user", content: userMessage },
        { role: "assistant", content: "Sorry, I'm having trouble connecting right now. You can still set up your tournament manually using the regular setup form." }
      ]);
    }
    
    setIsProcessing(false);
  };

  const handleAISubmit = () => {
    if (!userInput.trim()) return;
    
    processAISetup(userInput.trim());
    setUserInput('');
  };

  const applyAISettings = () => {
    if (!extractedData) return;

    // Apply tournament settings
    setTournamentType(extractedData.tournamentType || 'roundrobin');
    setParticipantType(extractedData.participantType || 'individual');
    setTournamentSettings({
      rounds: extractedData.rounds || 1,
      pointsToWin: extractedData.pointsToWin || 11,
      winByTwo: extractedData.winByTwo !== undefined ? extractedData.winByTwo : true
    });

    // Add participants
    if (extractedData.participants && extractedData.participants.length > 0) {
      const newParticipants = extractedData.participants.map((p, index) => ({
        id: crypto.randomUUID(),
        type: extractedData.participantType || 'individual',
        name: p.name,
        partner: p.partner || null,
        wins: 0,
        losses: 0,
        points: 0
      }));
      setParticipants(newParticipants);
    }

    // Switch to regular setup view
    setCurrentView('setup');
    setExtractedData(null);
    setAiMessages([]);
  };

  // Add participant
  const addParticipant = () => {
    if (!newParticipant.name.trim()) return;
    
    const participant = {
      id: crypto.randomUUID(),
      type: participantType,
      name: newParticipant.name.trim(),
      partner: participantType === 'team' ? newParticipant.partner.trim() : null,
      wins: 0,
      losses: 0,
      points: 0
    };

    setParticipants([...participants, participant]);
    setNewParticipant({ name: '', partner: '' });
  };

  const removeParticipant = (id) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  // Generate Round Robin matches
  const generateRoundRobin = () => {
    if (participantType === 'team') {
      // Team round robin: each team plays every other team
      if (participants.length < 2) {
        alert('Need at least 2 teams for a round robin');
        return;
      }

      const teams = [...participants].sort(() => Math.random() - 0.5);
      const maxCourts = Math.floor(teams.length / 2);
      const numCourts = Math.min(tournamentSettings.courts, maxCourts);

      // Generate all matchups (every team vs every other team)
      const allMatchups = [];
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          allMatchups.push({ team1: teams[i], team2: teams[j] });
        }
      }

      // Schedule into rounds with multiple courts
      const playCounts = {};
      teams.forEach(t => playCounts[t.id] = 0);
      const usedMatchups = new Set();
      const allMatches = [];
      const totalRounds = tournamentSettings.rounds;

      for (let round = 1; round <= totalRounds; round++) {
        const usedThisRound = new Set();

        for (let court = 1; court <= numCourts; court++) {
          let bestMatchup = null;
          let bestScore = Infinity;
          const candidates = [...allMatchups].sort(() => Math.random() - 0.5);

          for (const matchup of candidates) {
            const id1 = matchup.team1.id;
            const id2 = matchup.team2.id;

            // Skip if either team is already playing this round
            if (usedThisRound.has(id1) || usedThisRound.has(id2)) continue;

            const key = [id1, id2].sort().join('-');
            const repeatPenalty = usedMatchups.has(key) ? 1000 : 0;
            const score = playCounts[id1] + playCounts[id2] + repeatPenalty;

            if (score < bestScore) {
              bestScore = score;
              bestMatchup = matchup;
            }
          }

          if (!bestMatchup) break;

          const id1 = bestMatchup.team1.id;
          const id2 = bestMatchup.team2.id;
          playCounts[id1]++;
          playCounts[id2]++;
          usedThisRound.add(id1);
          usedThisRound.add(id2);
          usedMatchups.add([id1, id2].sort().join('-'));

          allMatches.push({
            id: `round-${round}-court-${court}`,
            round,
            court,
            team1: bestMatchup.team1,
            team2: bestMatchup.team2,
            score1: null,
            score2: null,
            winner: null,
            completed: false
          });
        }
      }

      setMatches(allMatches);
      setCurrentView('tournament');
    } else {
      // Individual round robin (doubles mixer)
      if (participants.length < 4) {
        alert('Need at least 4 players for a doubles round robin');
        return;
      }

      const players = [...participants].sort(() => Math.random() - 0.5);
      const maxCourts = Math.floor(players.length / 4);
      const numCourts = Math.min(tournamentSettings.courts, maxCourts);

      // Generate all unique 2v2 pairings from all groups of 4 players
      const allPairings = [];
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          for (let k = j + 1; k < players.length; k++) {
            for (let l = k + 1; l < players.length; l++) {
              allPairings.push({ team1: [players[i], players[j]], team2: [players[k], players[l]] });
              allPairings.push({ team1: [players[i], players[k]], team2: [players[j], players[l]] });
              allPairings.push({ team1: [players[i], players[l]], team2: [players[j], players[k]] });
            }
          }
        }
      }

      // Greedily pick pairings to balance games per player, multiple courts per round
      const playCounts = {};
      players.forEach(p => playCounts[p.id] = 0);
      const usedPairings = new Set();
      const allMatches = [];

      for (let round = 1; round <= tournamentSettings.rounds; round++) {
        const usedThisRound = new Set();

        for (let court = 1; court <= numCourts; court++) {
          let bestPairing = null;
          let bestScore = Infinity;
          const candidates = [...allPairings].sort(() => Math.random() - 0.5);

          for (const pairing of candidates) {
            const ids = [...pairing.team1, ...pairing.team2].map(p => p.id);

            // Skip if any player is already on another court this round
            if (ids.some(id => usedThisRound.has(id))) continue;

            const key = [...ids].sort().join('-');
            const repeatPenalty = usedPairings.has(key) ? 1000 : 0;
            const score = ids.reduce((sum, id) => sum + playCounts[id], 0) + repeatPenalty;

            if (score < bestScore) {
              bestScore = score;
              bestPairing = pairing;
            }
          }

          if (!bestPairing) break; // Not enough available players for another court

          const ids = [...bestPairing.team1, ...bestPairing.team2].map(p => p.id);
          ids.forEach(id => { playCounts[id]++; usedThisRound.add(id); });
          usedPairings.add([...ids].sort().join('-'));

          allMatches.push({
            id: `round-${round}-court-${court}`,
            round,
            court,
            team1: bestPairing.team1,
            team2: bestPairing.team2,
            score1: null,
            score2: null,
            winner: null,
            completed: false
          });
        }
      }

      setMatches(allMatches);
      setCurrentView('tournament');
    }
  };

  // Generate Tournament Bracket
  const generateBracket = () => {
    if (participants.length < 2) {
      alert('Need at least 2 participants for a tournament');
      return;
    }

    // Create a single elimination bracket with bye support
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);
    const bracketMatches = [];

    // Pad to next power of 2 for balanced bracket
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(shuffledParticipants.length)));
    const byeCount = bracketSize - shuffledParticipants.length;

    // First round
    const firstRoundMatchCount = bracketSize / 2;
    for (let i = 0; i < firstRoundMatchCount; i++) {
      const p1Index = i * 2;
      const p2Index = i * 2 + 1;
      const team1 = p1Index < shuffledParticipants.length ? shuffledParticipants[p1Index] : null;
      const team2 = p2Index < shuffledParticipants.length ? shuffledParticipants[p2Index] : null;

      if (team1 && team2) {
        bracketMatches.push({
          id: `bracket-${i}-round-1`,
          round: 1,
          team1,
          team2,
          score1: null,
          score2: null,
          winner: null,
          completed: false,
          bracketPosition: i
        });
      } else if (team1) {
        // Bye: team1 auto-advances, mark match as completed
        bracketMatches.push({
          id: `bracket-${i}-round-1`,
          round: 1,
          team1,
          team2: null,
          score1: null,
          score2: null,
          winner: team1,
          completed: true,
          bracketPosition: i,
          isBye: true
        });
      }
    }

    // Generate subsequent rounds (placeholders)
    let currentRoundMatches = firstRoundMatchCount;
    let round = 2;
    while (currentRoundMatches > 1) {
      const nextRoundMatches = Math.ceil(currentRoundMatches / 2);
      for (let i = 0; i < nextRoundMatches; i++) {
        bracketMatches.push({
          id: `bracket-${i}-round-${round}`,
          round,
          team1: null, // Will be filled when previous matches complete
          team2: null,
          score1: null,
          score2: null,
          winner: null,
          completed: false,
          bracketPosition: i
        });
      }
      currentRoundMatches = nextRoundMatches;
      round++;
    }

    // Advance bye winners into second round
    const byeWinners = bracketMatches.filter(m => m.isBye && m.winner);
    byeWinners.forEach(byeMatch => {
      const nextRoundMatch = bracketMatches.find(m =>
        m.round === 2 &&
        Math.floor(byeMatch.bracketPosition / 2) === m.bracketPosition
      );
      if (nextRoundMatch) {
        if (!nextRoundMatch.team1) {
          nextRoundMatch.team1 = byeMatch.winner;
        } else {
          nextRoundMatch.team2 = byeMatch.winner;
        }
      }
    });

    setMatches(bracketMatches);
    setCurrentView('tournament');
  };

  // Generate Pool Play into Bracket
  const generatePoolPlay = () => {
    const { numPools, poolSize } = tournamentSettings;
    const totalSlots = numPools * poolSize;
    if (participants.length < 2) {
      alert('Need at least 2 teams for pool play');
      return;
    }
    if (participants.length > totalSlots) {
      alert(`${participants.length} teams don't fit in ${numPools} pools of ${poolSize}. Increase pools or pool size.`);
      return;
    }

    const shuffled = [...participants].sort(() => Math.random() - 0.5);

    // Distribute teams across pools (round-robin assignment, respecting pool size)
    const pools = Array.from({ length: numPools }, () => []);
    shuffled.forEach((team, i) => {
      pools[i % numPools].push(team);
    });

    // Generate all pool matches (unscheduled)
    const unscheduled = [];
    pools.forEach((poolTeams, poolIndex) => {
      for (let i = 0; i < poolTeams.length; i++) {
        for (let j = i + 1; j < poolTeams.length; j++) {
          unscheduled.push({
            pool: poolIndex + 1,
            phase: 'pool',
            team1: poolTeams[i],
            team2: poolTeams[j],
            score1: null,
            score2: null,
            winner: null,
            completed: false
          });
        }
      }
    });

    // Schedule into rounds with court assignments
    const numCourts = tournamentSettings.courts;
    const allMatches = [];
    const remaining = [...unscheduled];
    let round = 0;

    while (remaining.length > 0) {
      round++;
      const usedTeamIds = new Set();
      let courtNum = 0;

      for (let i = remaining.length - 1; i >= 0 && courtNum < numCourts; i--) {
        const match = remaining[i];
        const t1Id = match.team1.id;
        const t2Id = match.team2.id;
        if (!usedTeamIds.has(t1Id) && !usedTeamIds.has(t2Id)) {
          courtNum++;
          usedTeamIds.add(t1Id);
          usedTeamIds.add(t2Id);
          allMatches.push({
            ...match,
            id: `pool-${match.pool}-round-${round}-court-${courtNum}`,
            round,
            court: courtNum
          });
          remaining.splice(i, 1);
        }
      }
    }

    setMatches(allMatches);
    setTournamentPhase('pools');
    setCurrentView('tournament');
  };

  // Get standings for a specific pool
  const getPoolStandings = (poolNumber) => {
    const poolMatches = matches.filter(m => m.pool === poolNumber && m.phase === 'pool');
    const teamIds = new Set();
    poolMatches.forEach(m => {
      teamIds.add(m.team1.id);
      teamIds.add(m.team2.id);
    });

    return participants
      .filter(p => teamIds.has(p.id))
      .map(p => {
        const poolWins = poolMatches.filter(m => m.completed && m.winner && m.winner.id === p.id).length;
        const poolLosses = poolMatches.filter(m => m.completed && m.winner && m.winner.id !== p.id && (m.team1.id === p.id || m.team2.id === p.id)).length;
        const poolPoints = poolMatches
          .filter(m => m.completed && (m.team1.id === p.id || m.team2.id === p.id))
          .reduce((sum, m) => sum + (m.team1.id === p.id ? m.score1 : m.score2), 0);
        const totalGames = poolWins + poolLosses;
        return {
          ...p,
          poolWins,
          poolLosses,
          poolPoints,
          winPercentage: totalGames > 0 ? (poolWins / totalGames) * 100 : 0
        };
      })
      .sort((a, b) => {
        if (b.poolWins !== a.poolWins) return b.poolWins - a.poolWins;
        if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
        return b.poolPoints - a.poolPoints;
      });
  };

  // Advance top teams from pools to bracket
  const advanceToBracket = () => {
    const { advanceCount } = tournamentSettings;
    const poolNumbers = [...new Set(matches.filter(m => m.phase === 'pool').map(m => m.pool))].sort((a, b) => a - b);

    // Get top teams from each pool
    const advancingTeams = [];
    poolNumbers.forEach(poolNum => {
      const standings = getPoolStandings(poolNum);
      const topTeams = standings.slice(0, advanceCount);
      topTeams.forEach((team, seed) => {
        advancingTeams.push({ ...team, poolSeed: seed + 1, fromPool: poolNum });
      });
    });

    // Cross-seed: alternate pool origins so same-pool teams meet later
    // Sort by seed first, then alternate pools
    const seeded = [];
    const maxSeed = advanceCount;
    for (let seed = 1; seed <= maxSeed; seed++) {
      const teamsAtSeed = advancingTeams.filter(t => t.poolSeed === seed);
      if (seed % 2 === 0) teamsAtSeed.reverse();
      seeded.push(...teamsAtSeed);
    }

    // Generate bracket from seeded teams
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(seeded.length)));
    const bracketMatches = [];

    const firstRoundMatchCount = bracketSize / 2;
    for (let i = 0; i < firstRoundMatchCount; i++) {
      const p1 = i < seeded.length ? seeded[i] : null;
      const p2 = (bracketSize - 1 - i) < seeded.length ? seeded[bracketSize - 1 - i] : null;

      if (p1 && p2) {
        bracketMatches.push({
          id: `bracket-${i}-round-1`,
          round: 1,
          phase: 'bracket',
          team1: p1,
          team2: p2,
          score1: null,
          score2: null,
          winner: null,
          completed: false,
          bracketPosition: i
        });
      } else if (p1) {
        bracketMatches.push({
          id: `bracket-${i}-round-1`,
          round: 1,
          phase: 'bracket',
          team1: p1,
          team2: null,
          score1: null,
          score2: null,
          winner: p1,
          completed: true,
          bracketPosition: i,
          isBye: true
        });
      }
    }

    // Generate subsequent round placeholders
    let currentRoundMatches = firstRoundMatchCount;
    let round = 2;
    while (currentRoundMatches > 1) {
      const nextRoundMatches = Math.ceil(currentRoundMatches / 2);
      for (let i = 0; i < nextRoundMatches; i++) {
        bracketMatches.push({
          id: `bracket-${i}-round-${round}`,
          round,
          phase: 'bracket',
          team1: null,
          team2: null,
          score1: null,
          score2: null,
          winner: null,
          completed: false,
          bracketPosition: i
        });
      }
      currentRoundMatches = nextRoundMatches;
      round++;
    }

    // Advance bye winners
    const byeWinners = bracketMatches.filter(m => m.isBye && m.winner);
    byeWinners.forEach(byeMatch => {
      const nextRoundMatch = bracketMatches.find(m =>
        m.round === 2 &&
        Math.floor(byeMatch.bracketPosition / 2) === m.bracketPosition
      );
      if (nextRoundMatch) {
        if (!nextRoundMatch.team1) {
          nextRoundMatch.team1 = byeMatch.winner;
        } else {
          nextRoundMatch.team2 = byeMatch.winner;
        }
      }
    });

    // Keep pool matches, add bracket matches
    setMatches([...matches, ...bracketMatches]);
    setTournamentPhase('bracket');
    setCurrentView('tournament');
  };

  // Ladder League: move participant up/down in list
  const moveParticipantUp = (index) => {
    if (index <= 0) return;
    const updated = [...participants];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setParticipants(updated);
  };

  const moveParticipantDown = (index) => {
    if (index >= participants.length - 1) return;
    const updated = [...participants];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setParticipants(updated);
  };

  // Generate a Ladder League session
  const generateLadderSession = (playerOrder) => {
    if (playerOrder.length < 4 || playerOrder.length % 4 !== 0) {
      alert('Need a multiple of 4 players for ladder league (4, 8, 12, etc.)');
      return;
    }

    const numCourts = playerOrder.length / 4;
    const assignments = {};
    const allMatches = [];

    for (let c = 0; c < numCourts; c++) {
      const courtNum = numCourts - c; // first 4 players = top court
      const courtPlayers = playerOrder.slice(c * 4, c * 4 + 4);
      assignments[courtNum] = courtPlayers;

      // 3 unique pairings, each played twice = 6 games
      const pairings = [
        { team1: [courtPlayers[0], courtPlayers[1]], team2: [courtPlayers[2], courtPlayers[3]] },
        { team1: [courtPlayers[0], courtPlayers[2]], team2: [courtPlayers[1], courtPlayers[3]] },
        { team1: [courtPlayers[0], courtPlayers[3]], team2: [courtPlayers[1], courtPlayers[2]] },
      ];

      let gameNum = 0;
      for (const pairing of pairings) {
        for (let rep = 1; rep <= 2; rep++) {
          gameNum++;
          allMatches.push({
            id: `ladder-s${ladderSession + 1}-court${courtNum}-g${gameNum}`,
            round: gameNum,
            court: courtNum,
            phase: 'ladder',
            session: ladderSession + 1,
            team1: pairing.team1,
            team2: pairing.team2,
            score1: null,
            score2: null,
            winner: null,
            completed: false
          });
        }
      }
    }

    setCourtAssignments(assignments);
    setMatches(allMatches);
    setLadderSession(prev => prev + 1);
    setTournamentPhase('playing');
    setCurrentView('tournament');
  };

  // Get standings for a specific court in ladder
  const getLadderCourtStandings = (courtNum) => {
    const courtPlayers = courtAssignments[courtNum] || [];
    const courtMatches = matches.filter(m => m.court === courtNum && m.phase === 'ladder' && m.completed);

    return courtPlayers.map(player => {
      let totalPoints = 0;
      courtMatches.forEach(m => {
        const onTeam1 = m.team1.some(p => p.id === player.id);
        const onTeam2 = m.team2.some(p => p.id === player.id);
        if (onTeam1) totalPoints += m.score1 || 0;
        if (onTeam2) totalPoints += m.score2 || 0;
      });
      return { ...player, totalPoints };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  };

  // Calculate ladder movements and return new player order
  const calculateLadderMovement = () => {
    const courtNums = Object.keys(courtAssignments).map(Number).sort((a, b) => a - b);
    const topCourt = Math.max(...courtNums);
    const bottomCourt = Math.min(...courtNums);

    // Get standings per court and determine movers
    const movers = {}; // { courtNum: { up: playerId, down: playerId } }
    courtNums.forEach(courtNum => {
      const standings = getLadderCourtStandings(courtNum);
      movers[courtNum] = {
        up: courtNum < topCourt ? standings[0] : null,
        down: courtNum > bottomCourt ? standings[standings.length - 1] : null,
      };
    });

    // Build new order: for each court, swap movers between adjacent courts
    const newAssignments = {};
    courtNums.forEach(courtNum => {
      newAssignments[courtNum] = [...(courtAssignments[courtNum] || [])];
    });

    // Process swaps between adjacent courts
    for (let i = 0; i < courtNums.length - 1; i++) {
      const lowerCourt = courtNums[i];
      const upperCourt = courtNums[i + 1];
      const goingUp = movers[lowerCourt].up;
      const goingDown = movers[upperCourt].down;

      if (goingUp && goingDown) {
        // Swap them
        newAssignments[lowerCourt] = newAssignments[lowerCourt].map(p => p.id === goingUp.id ? goingDown : p);
        newAssignments[upperCourt] = newAssignments[upperCourt].map(p => p.id === goingDown.id ? goingUp : p);
      }
    }

    // Flatten back to ordered array (top court first)
    const newOrder = [];
    courtNums.sort((a, b) => b - a).forEach(courtNum => {
      newOrder.push(...newAssignments[courtNum]);
    });

    return newOrder;
  };

  // Start a match
  const startMatch = (match) => {
    setCurrentMatch(match);
    setScore({ team1: 0, team2: 0 });
    setCurrentView('match');
  };

  // Update score
  const updateScore = (team, points) => {
    const newScore = { ...score };
    newScore[team] = Math.max(0, newScore[team] + points);
    setScore(newScore);
  };

  // Complete match
  const completeMatch = () => {
    if (!currentMatch) return;

    const { pointsToWin, winByTwo } = tournamentSettings;
    
    // Check if match is actually complete
    const team1Score = score.team1;
    const team2Score = score.team2;
    const scoreDiff = Math.abs(team1Score - team2Score);
    
    if ((team1Score < pointsToWin && team2Score < pointsToWin) || 
        (winByTwo && scoreDiff < 2 && (team1Score >= pointsToWin || team2Score >= pointsToWin))) {
      alert('Match not complete. Need to reach winning score and win by required margin.');
      return;
    }

    const winnerTeam = team1Score > team2Score ? currentMatch.team1 : currentMatch.team2;
    const loserTeam = team1Score > team2Score ? currentMatch.team2 : currentMatch.team1;
    const winScore = Math.max(team1Score, team2Score);
    const loseScore = Math.min(team1Score, team2Score);

    // Update match
    let updatedMatches = matches.map(m => {
      if (m.id === currentMatch.id) {
        return {
          ...m,
          score1: team1Score,
          score2: team2Score,
          winner: winnerTeam,
          completed: true
        };
      }
      return m;
    });

    // Update participant stats (handles both arrays for doubles and single for bracket)
    const winnerIds = Array.isArray(winnerTeam) ? winnerTeam.map(p => p.id) : [winnerTeam.id];
    const loserIds = Array.isArray(loserTeam) ? loserTeam.map(p => p.id) : [loserTeam.id];

    const updatedParticipants = participants.map(p => {
      if (winnerIds.includes(p.id)) {
        return { ...p, wins: p.wins + 1, points: p.points + winScore };
      }
      if (loserIds.includes(p.id)) {
        return { ...p, losses: p.losses + 1, points: p.points + loseScore };
      }
      return p;
    });

    // For bracket tournaments (or bracket phase of pool play), advance winner
    const isBracketMatch = tournamentType === 'bracket' || (tournamentType === 'poolplay' && tournamentPhase === 'bracket');
    if (isBracketMatch && currentMatch.bracketPosition !== undefined) {
      const bracketMatches = updatedMatches.filter(m => m.phase === 'bracket' || tournamentType === 'bracket');
      const maxRound = Math.max(...bracketMatches.map(m => m.round));
      if (currentMatch.round < maxRound) {
        const nextRoundMatch = updatedMatches.find(m =>
          (m.phase === 'bracket' || tournamentType === 'bracket') &&
          m.round === currentMatch.round + 1 &&
          Math.floor(currentMatch.bracketPosition / 2) === m.bracketPosition
        );

        if (nextRoundMatch) {
          updatedMatches = updatedMatches.map(m => {
            if (m.id === nextRoundMatch.id) {
              return {
                ...m,
                team1: m.team1 ? m.team1 : winnerTeam,
                team2: m.team1 ? winnerTeam : m.team2
              };
            }
            return m;
          });
        }
      }
    }

    setMatches(updatedMatches);
    setParticipants(updatedParticipants);

    // Pool play: check if pool phase is done → advance to bracket
    if (tournamentType === 'poolplay' && tournamentPhase === 'pools') {
      const poolMatches = updatedMatches.filter(m => m.phase === 'pool');
      if (poolMatches.every(m => m.completed)) {
        setCurrentMatch(null);
        setTimeout(() => advanceToBracket(), 100);
        return;
      }
    }

    // Pool play bracket phase: check if bracket is done
    if (tournamentType === 'poolplay' && tournamentPhase === 'bracket') {
      const bracketMatches = updatedMatches.filter(m => m.phase === 'bracket');
      if (bracketMatches.every(m => m.completed)) {
        setCurrentView('results');
        setCurrentMatch(null);
        return;
      }
    }

    // Ladder: check if all session matches are done
    if (tournamentType === 'ladder') {
      const ladderMatches = updatedMatches.filter(m => m.phase === 'ladder');
      if (ladderMatches.every(m => m.completed)) {
        setTournamentPhase('session-results');
      }
      setCurrentView('tournament');
      setCurrentMatch(null);
      return;
    }

    const allComplete = updatedMatches.every(m => m.completed);
    setCurrentView(allComplete && tournamentType === 'roundrobin' ? 'results' : 'tournament');
    setCurrentMatch(null);
  };

  // Get standings for round robin
  const getStandings = () => {
    return [...participants]
      .map(p => ({
        ...p,
        winPercentage: p.wins + p.losses > 0 ? (p.wins / (p.wins + p.losses)) * 100 : 0
      }))
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
        return b.points - a.points;
      });
  };

  const resetTournament = () => {
    setMatches([]);
    setCurrentMatch(null);
    setParticipants(participants.map(p => ({ ...p, wins: 0, losses: 0, points: 0 })));
    setTournamentPhase(null);
    setLadderSession(0);
    setCourtAssignments({});
    setAiMessages([]);
    setExtractedData(null);
    setUserInput('');
    setCurrentView('format-select');
    localStorage.removeItem('pickleball-tournament');
  };

  const getDisplayName = (participant) => {
    if (!participant) return 'TBD';
    if (Array.isArray(participant)) {
      return participant.map(p => p.name).join(' & ');
    }
    return participant.type === 'team' && participant.partner
      ? `${participant.name} & ${participant.partner}`
      : participant.name;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <img src="/pickleball-vibes-logo.png" alt="Pickleball Vibes" className="h-16 w-16 object-contain drop-shadow-md cursor-pointer hover:scale-105 transition-transform duration-300" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Target className="text-green-600" />
              Pickleball Tournament Manager
            </h1>
          </div>

          <div className="flex gap-2">
            {currentView === 'format-select' && null}

            {currentView === 'setup' && (
              <>
                <button
                  onClick={() => setCurrentView('format-select')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentView('ai-setup')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Bot size={16} />
                  AI Setup
                </button>
              </>
            )}

            {currentView === 'ai-setup' && (
              <button
                onClick={() => setCurrentView('setup')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Manual Setup
              </button>
            )}
            
            {currentView !== 'setup' && currentView !== 'ai-setup' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('tournament')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Tournament
                </button>
                {(matches.length > 0 && matches.every(m => m.completed)) || (tournamentType === 'ladder' && tournamentPhase === 'session-results') ? (
                  <button
                    onClick={() => setCurrentView('results')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Results
                  </button>
                ) : null}
                <button
                  onClick={resetTournament}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Format Selection View */}
        {currentView === 'format-select' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Game Format</h2>
              <p className="text-gray-600">Select a format to get started</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => { setTournamentType('roundrobin'); setCurrentView('setup'); }}
                className="text-left p-6 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 hover:shadow-md group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                    <Shuffle size={32} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Round Robin</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Every player/team plays against every other. Best for smaller groups wanting maximum play time.</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => { setTournamentType('bracket'); setCurrentView('setup'); }}
                className="text-left p-6 rounded-xl border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition-all duration-200 hover:shadow-md group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-yellow-50 group-hover:bg-yellow-100 transition-colors">
                    <Trophy size={32} className="text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Bracket Tournament</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Single elimination bracket. Win or go home — perfect for competitive events.</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => { setTournamentType('poolplay'); setCurrentView('setup'); }}
                className="text-left p-6 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all duration-200 hover:shadow-md group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-green-50 group-hover:bg-green-100 transition-colors">
                    <Users size={32} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Pool Play into Bracket</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Group stage followed by elimination bracket. Guarantees multiple games before playoffs.</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => { setTournamentType('ladder'); setCurrentView('setup'); }}
                className="text-left p-6 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 hover:shadow-md group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-colors">
                    <Target size={32} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Ladder League</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Players rotate partners on courts by skill level. Top players move up, bottom move down each session.</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* AI Setup View */}
        {currentView === 'ai-setup' && (
          <div className="space-y-6">
            
            {/* AI Setup Header */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border-2 border-purple-200">
              <h2 className="text-2xl font-semibold mb-2 flex items-center gap-3">
                <Bot className="text-purple-600" />
                AI Tournament Setup
              </h2>
              <p className="text-gray-700">
                Tell me about your tournament in natural language and I'll set everything up for you! 
                Try saying something like: "I want a round robin tournament with 6 players: John, Mary, Bob, Alice, Carol, and Dave. Play to 11 points."
              </p>
            </div>

            {/* Chat Interface */}
            <div className="bg-white rounded-lg border border-gray-200 min-h-[400px] flex flex-col">
              
              {/* Chat Messages */}
              <div className="flex-1 p-4 space-y-4 max-h-[400px] overflow-y-auto">
                {aiMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>Start by describing your tournament setup!</p>
                    <div className="mt-4 text-sm text-left max-w-md mx-auto space-y-2">
                      <p><strong>Examples you can try:</strong></p>
                      <p className="bg-gray-50 p-2 rounded italic">"Round robin with 8 individual players: Alice, Bob, Carol, Dave, Eve, Frank, Grace, and Henry"</p>
                      <p className="bg-gray-50 p-2 rounded italic">"Bracket tournament with teams playing to 15 points"</p>
                      <p className="bg-gray-50 p-2 rounded italic">"4 teams: Red (John & Jane), Blue (Bob & Betty), Green (Carl & Carla), Yellow (Dan & Diane)"</p>
                    </div>
                  </div>
                ) : (
                  aiMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <div className="flex items-start gap-2">
                          {message.role === 'assistant' && <Bot size={16} className="text-purple-600 mt-1" />}
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Bot size={16} className="text-purple-600" />
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleAISubmit()}
                    placeholder="Describe your tournament setup..."
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  />
                  <button
                    onClick={handleAISubmit}
                    disabled={isProcessing || !userInput.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Extracted Data Preview */}
            {extractedData && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="text-green-600" />
                  Tournament Setup Preview
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="font-medium">Tournament Type:</span> 
                    <span className="ml-2 capitalize">{extractedData.tournamentType.replace('roundrobin', 'Round Robin')}</span>
                  </div>
                  <div>
                    <span className="font-medium">Participant Type:</span> 
                    <span className="ml-2 capitalize">{extractedData.participantType}</span>
                  </div>
                  {extractedData.tournamentType === 'roundrobin' && (
                    <div>
                      <span className="font-medium">Rounds:</span> 
                      <span className="ml-2">{extractedData.rounds}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Points to Win:</span> 
                    <span className="ml-2">{extractedData.pointsToWin}</span>
                  </div>
                  <div>
                    <span className="font-medium">Win by 2:</span> 
                    <span className="ml-2">{extractedData.winByTwo ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                {extractedData.participants && extractedData.participants.length > 0 && (
                  <div className="mb-4">
                    <span className="font-medium">Participants ({extractedData.participants.length}):</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {extractedData.participants.map((participant, index) => (
                        <span key={index} className="bg-white px-3 py-1 rounded-full text-sm border border-green-300">
                          {participant.name}{participant.partner && ` & ${participant.partner}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={applyAISettings}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Apply These Settings
                  </button>
                  <button
                    onClick={() => setExtractedData(null)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Make Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Setup View */}
        {currentView === 'setup' && (
          <div className="space-y-6">
            
            {/* Tournament Settings */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trophy className="text-yellow-600" />
                Tournament Settings
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tournament Type</label>
                  <select
                    value={tournamentType}
                    onChange={(e) => setTournamentType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="roundrobin">Round Robin</option>
                    <option value="bracket">Bracket Tournament</option>
                    <option value="poolplay">Pool Play into Bracket</option>
                    <option value="ladder">Ladder League</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Participant Type</label>
                  <select
                    value={participantType}
                    onChange={(e) => setParticipantType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="individual">Individual Players</option>
                    <option value="team">Teams (Doubles)</option>
                  </select>
                </div>
                
                {(tournamentType === 'roundrobin' || tournamentType === 'poolplay') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Courts</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={tournamentSettings.courts}
                      onChange={(e) => setTournamentSettings({
                        ...tournamentSettings,
                        courts: parseInt(e.target.value) || 1
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {tournamentType === 'roundrobin' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rounds</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={tournamentSettings.rounds}
                        onChange={(e) => setTournamentSettings({
                          ...tournamentSettings,
                          rounds: parseInt(e.target.value) || 1
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {tournamentType === 'poolplay' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Number of Pools</label>
                      <input
                        type="number"
                        min="1"
                        value={tournamentSettings.numPools}
                        onChange={(e) => setTournamentSettings({
                          ...tournamentSettings,
                          numPools: parseInt(e.target.value) || 1
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Teams per Pool</label>
                      <input
                        type="number"
                        min="2"
                        value={tournamentSettings.poolSize}
                        onChange={(e) => setTournamentSettings({
                          ...tournamentSettings,
                          poolSize: parseInt(e.target.value) || 4
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Advance to Bracket</label>
                      <select
                        value={tournamentSettings.advanceCount}
                        onChange={(e) => setTournamentSettings({
                          ...tournamentSettings,
                          advanceCount: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={1}>Top 1 per pool</option>
                        <option value={2}>Top 2 per pool</option>
                        <option value={3}>Top 3 per pool</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Points to Win</label>
                  <select
                    value={tournamentSettings.pointsToWin}
                    onChange={(e) => setTournamentSettings({
                      ...tournamentSettings,
                      pointsToWin: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={11}>11 Points</option>
                    <option value={15}>15 Points</option>
                    <option value={21}>21 Points</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="winByTwo"
                  checked={tournamentSettings.winByTwo}
                  onChange={(e) => setTournamentSettings({
                    ...tournamentSettings,
                    winByTwo: e.target.checked
                  })}
                  className="rounded"
                />
                <label htmlFor="winByTwo" className="text-sm text-gray-700">Must win by 2 points</label>
              </div>
            </div>

            {/* Add Participants */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="text-blue-600" />
                Add {participantType === 'team' ? 'Teams' : 'Players'}
              </h2>
              
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant({...newParticipant, name: e.target.value})}
                  placeholder={participantType === 'team' ? 'Player 1 name' : 'Player name'}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {participantType === 'team' && (
                  <input
                    type="text"
                    value={newParticipant.partner}
                    onChange={(e) => setNewParticipant({...newParticipant, partner: e.target.value})}
                    placeholder="Player 2 name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
                
                <button
                  onClick={addParticipant}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>

            {/* Participants List */}
            {participants.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200">
                <h2 className="text-xl font-semibold p-4 border-b border-gray-200">
                  {participantType === 'team' ? 'Teams' : 'Players'} ({participants.length})
                </h2>
                
                <div className="p-4 space-y-2">
                  {participants.map((participant, index) => (
                    <React.Fragment key={participant.id}>
                      {tournamentType === 'ladder' && index % 4 === 0 && (
                        <div className="text-sm font-semibold text-purple-600 mt-3 mb-1 flex items-center gap-2">
                          <span className="bg-purple-100 px-2 py-0.5 rounded">
                            Court {Math.floor(participants.length / 4) - Math.floor(index / 4)}
                            {index === 0 ? ' (Top)' : index + 4 >= participants.length ? ' (Bottom)' : ''}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{getDisplayName(participant)}</span>
                        <div className="flex items-center gap-1">
                          {tournamentType === 'ladder' && (
                            <>
                              <button
                                onClick={() => moveParticipantUp(index)}
                                disabled={index === 0}
                                className="text-gray-600 hover:text-blue-600 disabled:text-gray-300 p-1"
                              >
                                <ChevronUp size={16} />
                              </button>
                              <button
                                onClick={() => moveParticipantDown(index)}
                                disabled={index === participants.length - 1}
                                className="text-gray-600 hover:text-blue-600 disabled:text-gray-300 p-1"
                              >
                                <ChevronDown size={16} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => removeParticipant(participant.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      if (tournamentType === 'roundrobin') generateRoundRobin();
                      else if (tournamentType === 'poolplay') generatePoolPlay();
                      else if (tournamentType === 'ladder') generateLadderSession(participants);
                      else generateBracket();
                    }}
                    disabled={tournamentType === 'ladder' ? (participants.length < 4 || participants.length % 4 !== 0) : participants.length < 2}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Shuffle size={20} />
                    Start {tournamentType === 'roundrobin' ? 'Round Robin' : tournamentType === 'poolplay' ? 'Pool Play' : tournamentType === 'ladder' ? 'Ladder League' : 'Tournament Bracket'}
                  </button>
                  {tournamentType === 'ladder' && participants.length > 0 && participants.length % 4 !== 0 && (
                    <p className="text-sm text-red-500 mt-2 text-center">
                      Need a multiple of 4 players for ladder league (currently {participants.length})
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tournament View */}
        {currentView === 'tournament' && (
          <div className="space-y-6">
            
            {/* Tournament Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Trophy className="text-yellow-600" />
                {tournamentType === 'roundrobin' ? 'Round Robin' : tournamentType === 'poolplay' ? (tournamentPhase === 'bracket' ? 'Bracket Play' : 'Pool Play') : tournamentType === 'ladder' ? `Ladder League — Session ${ladderSession}` : 'Tournament Bracket'}
              </h2>

              <div className="text-sm text-gray-600">
                {(() => {
                  if (tournamentType === 'ladder' && tournamentPhase === 'session-results') {
                    return 'Session complete';
                  }
                  const relevant = tournamentType === 'poolplay'
                    ? matches.filter(m => m.phase === tournamentPhase)
                    : matches;
                  return `${relevant.filter(m => m.completed).length} of ${relevant.length} matches completed`;
                })()}
              </div>
            </div>

            {/* Matches */}
            <div className="grid gap-4">
              {tournamentType === 'poolplay' ? (
                // Pool Play display
                tournamentPhase === 'pools' ? (
                  // Pool phase: show each pool with standings and matches
                  [...new Set(matches.filter(m => m.phase === 'pool').map(m => m.pool))].sort((a, b) => a - b).map(poolNum => {
                    const poolMatches = matches.filter(m => m.pool === poolNum && m.phase === 'pool');
                    const standings = getPoolStandings(poolNum);
                    return (
                      <div key={poolNum} className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-3">Pool {poolNum}</h3>

                        {/* Pool Standings */}
                        <div className="bg-white rounded-lg border border-gray-200 mb-3">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left">Team</th>
                                <th className="px-3 py-2 text-center">W</th>
                                <th className="px-3 py-2 text-center">L</th>
                                <th className="px-3 py-2 text-center">Pts</th>
                              </tr>
                            </thead>
                            <tbody>
                              {standings.map((team, idx) => (
                                <tr key={team.id} className={idx < tournamentSettings.advanceCount ? 'bg-green-50' : ''}>
                                  <td className="px-3 py-2 font-medium">{getDisplayName(team)}</td>
                                  <td className="px-3 py-2 text-center">{team.poolWins}</td>
                                  <td className="px-3 py-2 text-center">{team.poolLosses}</td>
                                  <td className="px-3 py-2 text-center">{team.poolPoints}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pool Matches grouped by round */}
                        <div className="grid gap-2">
                          {Object.entries(
                            poolMatches.reduce((acc, m) => {
                              if (!acc[m.round]) acc[m.round] = [];
                              acc[m.round].push(m);
                              return acc;
                            }, {})
                          ).map(([rd, rdMatches]) => (
                            <div key={rd}>
                              {Object.keys(poolMatches.reduce((a, m) => { a[m.round] = 1; return a; }, {})).length > 1 && (
                                <div className="text-xs font-semibold text-gray-500 mb-1">Round {rd}</div>
                              )}
                              {rdMatches.map(match => (
                                <div key={match.id} className={`p-3 rounded-lg border-2 mb-1 ${
                                  match.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                                }`}>
                                  {match.court && rdMatches.length > 1 && (
                                    <div className="text-xs font-semibold text-purple-600 mb-1">Court {match.court}</div>
                                  )}
                                  <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium text-sm">{getDisplayName(match.team1)}</span>
                                        {match.completed && <span className="font-bold">{match.score1}</span>}
                                      </div>
                                      <div className="text-gray-400 text-xs mb-1">vs</div>
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium text-sm">{getDisplayName(match.team2)}</span>
                                        {match.completed && <span className="font-bold">{match.score2}</span>}
                                      </div>
                                    </div>
                                    <div className="ml-3">
                                      {match.completed ? (
                                        <span className="text-sm font-medium text-green-600">Done</span>
                                      ) : (
                                        <button
                                          onClick={() => startMatch(match)}
                                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-colors"
                                        >
                                          <Play size={14} />
                                          Play
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Bracket phase: show bracket matches only
                  Object.entries(
                    matches.filter(m => m.phase === 'bracket').reduce((acc, match) => {
                      if (!acc[match.round]) acc[match.round] = [];
                      acc[match.round].push(match);
                      return acc;
                    }, {})
                  ).map(([round, roundMatches]) => {
                    const bracketMatches = matches.filter(m => m.phase === 'bracket');
                    const maxRound = Math.max(...bracketMatches.map(m => m.round));
                    return (
                      <div key={round} className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-3">
                          {round == maxRound ? 'Final' :
                           round == maxRound - 1 ? 'Semi-Final' :
                           `Round ${round}`}
                        </h3>
                        <div className="grid gap-3">
                          {roundMatches.map(match => (
                            <div key={match.id} className={`p-4 rounded-lg border-2 ${
                              match.completed ? 'bg-green-50 border-green-200' :
                              match.team1 && match.team2 ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-300'
                            }`}>
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">{getDisplayName(match.team1)}</span>
                                    {match.completed && <span className="font-bold text-lg">{match.score1}</span>}
                                  </div>
                                  <div className="text-gray-400 text-sm mb-2">vs</div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{getDisplayName(match.team2)}</span>
                                    {match.completed && <span className="font-bold text-lg">{match.score2}</span>}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  {match.completed ? (
                                    <div className="flex items-center gap-2">
                                      <Crown className="text-yellow-500" size={20} />
                                      <span className="text-sm font-medium text-green-600">Complete</span>
                                    </div>
                                  ) : match.team1 && match.team2 ? (
                                    <button
                                      onClick={() => startMatch(match)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                      <Play size={16} />
                                      Play
                                    </button>
                                  ) : (
                                    <span className="text-gray-500 text-sm">Waiting</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )
              ) : tournamentType === 'ladder' ? (
                // Ladder League display
                tournamentPhase === 'session-results' ? (
                  // Session results with standings and movement
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
                      <h3 className="text-xl font-bold text-yellow-700">Session {ladderSession} Complete</h3>
                      <p className="text-gray-600 mt-1">Review standings and player movements below</p>
                    </div>

                    {Object.keys(courtAssignments).map(Number).sort((a, b) => b - a).map(courtNum => {
                      const standings = getLadderCourtStandings(courtNum);
                      const courtNums = Object.keys(courtAssignments).map(Number).sort((a, b) => a - b);
                      const topCourt = Math.max(...courtNums);
                      const bottomCourt = Math.min(...courtNums);

                      return (
                        <div key={courtNum} className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                          <div className={`px-4 py-2 font-semibold text-white ${courtNum === topCourt ? 'bg-purple-600' : courtNum === bottomCourt ? 'bg-gray-500' : 'bg-blue-500'}`}>
                            Court {courtNum} {courtNum === topCourt ? '(Top)' : courtNum === bottomCourt ? '(Bottom)' : ''}
                          </div>
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left">Rank</th>
                                <th className="px-4 py-2 text-left">Player</th>
                                <th className="px-4 py-2 text-center">Points</th>
                                <th className="px-4 py-2 text-center">Movement</th>
                              </tr>
                            </thead>
                            <tbody>
                              {standings.map((player, idx) => {
                                const isTop = idx === 0;
                                const isBottom = idx === standings.length - 1;
                                const movesUp = isTop && courtNum < topCourt;
                                const movesDown = isBottom && courtNum > bottomCourt;

                                return (
                                  <tr key={player.id} className={movesUp ? 'bg-green-50' : movesDown ? 'bg-red-50' : ''}>
                                    <td className="px-4 py-2">#{idx + 1}</td>
                                    <td className="px-4 py-2 font-medium">{player.name}</td>
                                    <td className="px-4 py-2 text-center font-bold">{player.totalPoints}</td>
                                    <td className="px-4 py-2 text-center">
                                      {movesUp && (
                                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                                          <ArrowUp size={16} /> Up
                                        </span>
                                      )}
                                      {movesDown && (
                                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                                          <ArrowDown size={16} /> Down
                                        </span>
                                      )}
                                      {!movesUp && !movesDown && (
                                        <span className="text-gray-400">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}

                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => {
                          const newOrder = calculateLadderMovement();
                          generateLadderSession(newOrder);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                      >
                        <Shuffle size={20} />
                        Next Session
                      </button>
                      <button
                        onClick={() => setCurrentView('results')}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                      >
                        <Trophy size={20} />
                        End League
                      </button>
                    </div>
                  </div>
                ) : (
                  // Playing phase: show courts with match cards
                  Object.keys(courtAssignments).map(Number).sort((a, b) => b - a).map(courtNum => {
                    const courtMatches = matches.filter(m => m.court === courtNum && m.phase === 'ladder');
                    return (
                      <div key={courtNum} className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          Court {courtNum}
                          <span className="text-sm font-normal text-gray-500">
                            ({courtAssignments[courtNum]?.map(p => p.name).join(', ')})
                          </span>
                        </h3>
                        <div className="grid gap-3">
                          {courtMatches.map(match => (
                            <div key={match.id} className={`p-4 rounded-lg border-2 ${
                              match.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                            }`}>
                              <div className="text-xs text-gray-500 mb-1">Game {match.round}</div>
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">{getDisplayName(match.team1)}</span>
                                    {match.completed && <span className="font-bold text-lg">{match.score1}</span>}
                                  </div>
                                  <div className="text-gray-400 text-sm mb-2">vs</div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{getDisplayName(match.team2)}</span>
                                    {match.completed && <span className="font-bold text-lg">{match.score2}</span>}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  {match.completed ? (
                                    <span className="text-sm font-medium text-green-600">Done</span>
                                  ) : (
                                    <button
                                      onClick={() => startMatch(match)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                      <Play size={16} />
                                      Play
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )
              ) : tournamentType === 'roundrobin' ? (
                // Round Robin matches grouped by round
                Object.entries(
                  matches.reduce((acc, match) => {
                    if (!acc[match.round]) acc[match.round] = [];
                    acc[match.round].push(match);
                    return acc;
                  }, {})
                ).map(([round, roundMatches]) => (
                  <div key={round} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Round {round}</h3>
                    <div className="grid gap-3">
                      {roundMatches.map((match) => (
                        <div key={match.id} className={`p-4 rounded-lg border-2 ${
                          match.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                        }`}>
                          {match.court && roundMatches.length > 1 && (
                            <div className="text-xs font-semibold text-purple-600 mb-2">Court {match.court}</div>
                          )}
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{getDisplayName(match.team1)}</span>
                                {match.completed && (
                                  <span className="font-bold text-lg">{match.score1}</span>
                                )}
                              </div>
                              <div className="text-gray-400 text-sm mb-2">vs</div>
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{getDisplayName(match.team2)}</span>
                                {match.completed && (
                                  <span className="font-bold text-lg">{match.score2}</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="ml-4">
                              {match.completed ? (
                                <div className="flex items-center gap-2">
                                  <Crown className="text-yellow-500" size={20} />
                                  <span className="text-sm font-medium text-green-600">Complete</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startMatch(match)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                  <Play size={16} />
                                  Play
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                // Bracket tournament
                Object.entries(
                  matches.reduce((acc, match) => {
                    if (!acc[match.round]) acc[match.round] = [];
                    acc[match.round].push(match);
                    return acc;
                  }, {})
                ).map(([round, roundMatches]) => (
                  <div key={round} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      {round == 1 ? 'First Round' : 
                       round == Math.max(...matches.map(m => m.round)) ? 'Final' : 
                       round == Math.max(...matches.map(m => m.round)) - 1 ? 'Semi-Final' : 
                       `Round ${round}`}
                    </h3>
                    <div className="grid gap-3">
                      {roundMatches.map((match) => (
                        <div key={match.id} className={`p-4 rounded-lg border-2 ${
                          match.completed ? 'bg-green-50 border-green-200' : 
                          match.team1 && match.team2 ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-300'
                        }`}>
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{getDisplayName(match.team1)}</span>
                                {match.completed && (
                                  <span className="font-bold text-lg">{match.score1}</span>
                                )}
                              </div>
                              <div className="text-gray-400 text-sm mb-2">vs</div>
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{getDisplayName(match.team2)}</span>
                                {match.completed && (
                                  <span className="font-bold text-lg">{match.score2}</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="ml-4">
                              {match.completed ? (
                                <div className="flex items-center gap-2">
                                  <Crown className="text-yellow-500" size={20} />
                                  <span className="text-sm font-medium text-green-600">Complete</span>
                                </div>
                              ) : match.team1 && match.team2 ? (
                                <button
                                  onClick={() => startMatch(match)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                  <Play size={16} />
                                  Play
                                </button>
                              ) : (
                                <span className="text-gray-500 text-sm">Waiting for previous rounds</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* View Final Rankings Button */}
            {tournamentType === 'roundrobin' && matches.length > 0 && matches.every(m => m.completed) && (
              <div className="text-center">
                <button
                  onClick={() => setCurrentView('results')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg text-lg font-semibold flex items-center gap-2 mx-auto transition-colors"
                >
                  <Trophy size={20} />
                  View Final Rankings
                </button>
              </div>
            )}

            {/* Standings for Round Robin */}
            {tournamentType === 'roundrobin' && (
              <div className="bg-white rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold p-4 border-b border-gray-200">Standings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Rank</th>
                        <th className="px-4 py-2 text-left">{participantType === 'team' ? 'Team' : 'Player'}</th>
                        <th className="px-4 py-2 text-center">Wins</th>
                        <th className="px-4 py-2 text-center">Losses</th>
                        <th className="px-4 py-2 text-center">Win %</th>
                        <th className="px-4 py-2 text-center">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getStandings().map((participant, index) => (
                        <tr key={participant.id} className={index === 0 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              {index === 0 && <Crown className="text-yellow-500" size={16} />}
                              #{index + 1}
                            </div>
                          </td>
                          <td className="px-4 py-2 font-medium">{getDisplayName(participant)}</td>
                          <td className="px-4 py-2 text-center">{participant.wins}</td>
                          <td className="px-4 py-2 text-center">{participant.losses}</td>
                          <td className="px-4 py-2 text-center">{participant.winPercentage.toFixed(1)}%</td>
                          <td className="px-4 py-2 text-center">{participant.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results View */}
        {currentView === 'results' && (
          <div className="space-y-6">
            {/* Champion Banner */}
            {getStandings().length > 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 text-center">
                <Crown className="text-yellow-500 mx-auto mb-2" size={48} />
                <h2 className="text-3xl font-bold text-yellow-700 mb-1">Champion</h2>
                <p className="text-2xl font-semibold">{getDisplayName(getStandings()[0])}</p>
                <p className="text-gray-600 mt-1">
                  {getStandings()[0].wins}W - {getStandings()[0].losses}L ({getStandings()[0].winPercentage.toFixed(1)}%)
                </p>
              </div>
            )}

            {/* Final Rankings Table */}
            <div className="bg-white rounded-lg border border-gray-200">
              <h3 className="text-xl font-semibold p-4 border-b border-gray-200 flex items-center gap-2">
                <Trophy className="text-yellow-600" size={20} />
                Final Rankings
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Rank</th>
                      <th className="px-4 py-3 text-left">{participantType === 'team' ? 'Team' : 'Player'}</th>
                      <th className="px-4 py-3 text-center">Wins</th>
                      <th className="px-4 py-3 text-center">Losses</th>
                      <th className="px-4 py-3 text-center">Win %</th>
                      <th className="px-4 py-3 text-center">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getStandings().map((participant, index) => (
                      <tr key={participant.id} className={
                        index === 0 ? 'bg-yellow-50 font-semibold' :
                        index === 1 ? 'bg-gray-100' :
                        index === 2 ? 'bg-orange-50' :
                        'hover:bg-gray-50'
                      }>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {index === 0 && <Crown className="text-yellow-500" size={16} />}
                            #{index + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3">{getDisplayName(participant)}</td>
                        <td className="px-4 py-3 text-center">{participant.wins}</td>
                        <td className="px-4 py-3 text-center">{participant.losses}</td>
                        <td className="px-4 py-3 text-center">{participant.winPercentage.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-center">{participant.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setCurrentView('tournament')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                Back to Tournament
              </button>
              <button
                onClick={resetTournament}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                New Tournament
              </button>
            </div>
          </div>
        )}

        {/* Match Play View */}
        {currentView === 'match' && currentMatch && (
          <div className="space-y-6">
            
            {/* Match Header */}
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Match in Progress</h2>
              <div className="text-gray-600">
                Playing to {tournamentSettings.pointsToWin} points
                {tournamentSettings.winByTwo && ' (must win by 2)'}
              </div>
            </div>

            {/* Score Display */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-2 gap-6">
                
                {/* Team 1 */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">{getDisplayName(currentMatch.team1)}</h3>
                  <input
                    type="number"
                    min="0"
                    value={score.team1}
                    onChange={(e) => setScore({ ...score, team1: parseInt(e.target.value) || 0 })}
                    className="w-24 mx-auto text-6xl font-bold text-blue-600 text-center border-b-4 border-blue-300 focus:border-blue-600 focus:outline-none bg-transparent"
                  />
                </div>

                {/* Team 2 */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">{getDisplayName(currentMatch.team2)}</h3>
                  <input
                    type="number"
                    min="0"
                    value={score.team2}
                    onChange={(e) => setScore({ ...score, team2: parseInt(e.target.value) || 0 })}
                    className="w-24 mx-auto text-6xl font-bold text-red-600 text-center border-b-4 border-red-300 focus:border-red-600 focus:outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Match Controls */}
            <div className="flex justify-center gap-4">
              <button
                onClick={completeMatch}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Complete Match
              </button>
              <button
                onClick={() => {
                  setCurrentView('tournament');
                  setCurrentMatch(null);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Back to Tournament
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PickleballTournament;
