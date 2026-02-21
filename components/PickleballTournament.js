import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Users, Trophy, Play, Edit3, Trash2, Shuffle, Target, Crown, MessageCircle, Send, Bot, Mic, ChevronUp, ChevronDown, ArrowUp, ArrowDown, Home, Save, History, Eye, ArrowLeft, X as XIcon, UserPlus, Share2, Loader2 as Loader2Icon, StopCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import TournamentInviteModal from './TournamentInviteModal';
import ShareGameModal from './ShareGameModal';

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
  const msgIdRef = useRef(0);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const [newParticipant, setNewParticipant] = useState({
    name: '',
    partner: ''
  });

  const [score, setScore] = useState({
    team1: 0,
    team2: 0
  });

  const [tournamentName, setTournamentName] = useState('');
  const [savedGames, setSavedGames] = useState([]);
  const [viewingSavedGame, setViewingSavedGame] = useState(null);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [playerRoster, setPlayerRoster] = useState([]);
  const [friends, setFriends] = useState([]);

  const [hydrated, setHydrated] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCode, setShareCode] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const router = useRouter();

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pickleball-tournament');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.currentView === 'tournament' || data.currentView === 'results' || data.currentView === 'match') {
          // Only restore active views if matches exist
          if (data.matches && data.matches.length > 0) {
            setCurrentView(data.currentView);
          } else {
            setCurrentView('setup');
          }
        } else if (data.currentView && data.currentView !== 'setup') {
          setCurrentView(data.currentView);
        }
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
        if (data.tournamentName) setTournamentName(data.tournamentName);
      }
      try {
        const games = localStorage.getItem('pickleball-saved-games');
        if (games) setSavedGames(JSON.parse(games));
      } catch (e) {
        console.error('Failed to restore saved games:', e);
      }
      try {
        const roster = localStorage.getItem('pickleball-player-roster');
        if (roster) setPlayerRoster(JSON.parse(roster));
      } catch (e) {
        console.error('Failed to restore player roster:', e);
      }
      try {
        const stored = localStorage.getItem('pickleball-user');
        if (stored) {
          const u = JSON.parse(stored);
          fetch('/api/friends', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'list', email: u.email }),
          }).then(r => r.json()).then(d => { if (d.friends) setFriends(d.friends); }).catch(() => {});
        }
      } catch (e) {
        // ignore friends load failure
      }
    } catch (e) {
      console.error('Failed to restore tournament state:', e);
    }
    setHydrated(true);
  }, []);

  // Save state to localStorage on changes (debounced to avoid thrashing on rapid score updates)
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
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
          tournamentName,
        }));
      } catch (e) {
        console.error('Failed to save tournament state:', e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [hydrated, currentView, tournamentType, tournamentPhase, participantType, participants, matches, currentMatch, tournamentSettings, score, ladderSession, courtAssignments, tournamentName]);

  // Load shared game from ?code= query param
  useEffect(() => {
    if (!hydrated || !router.isReady) return;
    const { code } = router.query;
    if (!code) return;
    (async () => {
      try {
        const res = await fetch(`/api/games?code=${code}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.state) {
          const s = data.state;
          if (s.currentView) setCurrentView(s.currentView);
          if (s.tournamentType) setTournamentType(s.tournamentType);
          if (s.participantType) setParticipantType(s.participantType);
          if (s.participants) setParticipants(s.participants);
          if (s.matches) setMatches(s.matches);
          if (s.currentMatch) setCurrentMatch(s.currentMatch);
          if (s.tournamentSettings) setTournamentSettings(s.tournamentSettings);
          if (s.score) setScore(s.score);
          if (s.tournamentPhase) setTournamentPhase(s.tournamentPhase);
          if (s.ladderSession) setLadderSession(s.ladderSession);
          if (s.courtAssignments) setCourtAssignments(s.courtAssignments);
          if (s.tournamentName) setTournamentName(s.tournamentName);
          setShareCode(code);
        }
      } catch (e) {
        console.error('Failed to load shared game:', e);
      }
      // Clean up the URL
      router.replace('/tournament', undefined, { shallow: true });
    })();
  }, [hydrated, router.isReady]);

  // Load challenge from query params
  useEffect(() => {
    if (!hydrated || !router.isReady) return;
    const { challenge, type, participantType: pType, pointsToWin, winByTwo, players } = router.query;
    if (!challenge || !players) return;

    // Reset state for the challenge
    const playerNames = players.split(',').map(n => n.trim()).filter(Boolean);
    const newParticipants = playerNames.map((name, i) => ({
      id: Date.now() + i,
      name,
      wins: 0,
      losses: 0,
      points: 0,
    }));

    setTournamentType(type || 'roundrobin');
    setParticipantType(pType || 'individual');
    setTournamentSettings(prev => ({
      ...prev,
      pointsToWin: parseInt(pointsToWin) || 11,
      winByTwo: winByTwo !== 'false',
    }));
    setParticipants(newParticipants);
    setMatches([]);
    setCurrentMatch(null);
    setTournamentName(`Challenge: ${playerNames.join(' vs ')}`);
    setCurrentView('setup');

    // Clean up the URL
    router.replace('/tournament', undefined, { shallow: true });
  }, [hydrated, router.isReady]);

  // Auto-save game when tournament completes (view transitions to results)
  const [autoSaved, setAutoSaved] = useState(false);
  useEffect(() => {
    if (currentView === 'results' && matches.length > 0 && !autoSaved) {
      saveGame();
      setAutoSaved(true);
    }
  }, [currentView]);

  // AI Setup functionality
  const abortControllerRef = useRef(null);
  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  const processAISetup = async (userMessage) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
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
        signal: controller.signal,
      });

      const data = await response.json();
      const aiResponse = data.content[0]?.text || "";
      
      // Add messages to chat
      setAiMessages(prev => [
        ...prev,
        { id: ++msgIdRef.current, role: "user", content: userMessage },
        { id: ++msgIdRef.current, role: "assistant", content: "I'll help you set up the tournament! Let me extract the details..." }
      ]);

      // Try to parse JSON from the response
      try {
        // Clean the response to extract just the JSON
        // Find the first balanced JSON object in the response
        let jsonMatch = null;
        const startIdx = aiResponse.indexOf('{');
        if (startIdx !== -1) {
          let depth = 0;
          for (let i = startIdx; i < aiResponse.length; i++) {
            if (aiResponse[i] === '{') depth++;
            else if (aiResponse[i] === '}') depth--;
            if (depth === 0) {
              jsonMatch = [aiResponse.substring(startIdx, i + 1)];
              break;
            }
          }
        }
        if (jsonMatch) {
          const extractedInfo = JSON.parse(jsonMatch[0]);
          setExtractedData(extractedInfo);
          
          setAiMessages(prev => [
            ...prev,
            { id: ++msgIdRef.current, role: "assistant", content: "Perfect! I extracted your tournament setup. Please review the details below and click 'Apply Settings' if everything looks good, or continue chatting to make adjustments." }
          ]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        setAiMessages(prev => [
          ...prev,
          { id: ++msgIdRef.current, role: "assistant", content: "I had trouble understanding the tournament details. Could you please be more specific? For example: 'I want a round robin tournament with 6 individual players: John, Mary, Bob, Alice, Carol, and Dave. Play to 11 points.'" }
        ]);
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error("AI API error:", error);
      setAiMessages(prev => [
        ...prev,
        { id: ++msgIdRef.current, role: "user", content: userMessage },
        { id: ++msgIdRef.current, role: "assistant", content: "Sorry, I'm having trouble connecting right now. You can still set up your tournament manually using the regular setup form." }
      ]);
    }
    
    setIsProcessing(false);
  };

  const handleAISubmit = () => {
    if (!userInput.trim()) return;

    processAISetup(userInput.trim());
    setUserInput('');
  };

  const toggleSpeechToText = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Try Chrome or Safari.');
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (!transcript) return;
      setUserInput(prev => prev ? prev + ' ' + transcript : transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
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

  // Save player to roster (deduplicates by name + partner)
  const saveToRoster = (name, partner, type) => {
    setPlayerRoster(prev => {
      const exists = prev.some(p =>
        p.name.toLowerCase() === name.toLowerCase() &&
        (p.partner || '').toLowerCase() === (partner || '').toLowerCase() &&
        p.type === type
      );
      if (exists) return prev;
      const updated = [...prev, { id: crypto.randomUUID(), name, partner: partner || null, type }];
      localStorage.setItem('pickleball-player-roster', JSON.stringify(updated));
      return updated;
    });
  };

  // Add player from roster to current game
  const addFromRoster = (rosterPlayer) => {
    const alreadyIn = participants.some(p =>
      p.name.toLowerCase() === rosterPlayer.name.toLowerCase() &&
      (p.partner || '').toLowerCase() === (rosterPlayer.partner || '').toLowerCase()
    );
    if (alreadyIn) return;
    const participant = {
      id: crypto.randomUUID(),
      type: rosterPlayer.type,
      name: rosterPlayer.name,
      partner: rosterPlayer.partner,
      wins: 0,
      losses: 0,
      points: 0
    };
    setParticipants(prev => [...prev, participant]);
  };

  // Add friend as participant
  const addFriendAsParticipant = (friend) => {
    const alreadyIn = participants.some(p => p.name.toLowerCase() === friend.name.toLowerCase());
    if (alreadyIn) return;
    const participant = {
      id: crypto.randomUUID(),
      type: participantType,
      name: friend.name,
      partner: null,
      wins: 0,
      losses: 0,
      points: 0,
    };
    setParticipants(prev => [...prev, participant]);
    saveToRoster(friend.name, null, participantType);
  };

  // Remove player from roster
  const removeFromRoster = (rosterId) => {
    setPlayerRoster(prev => {
      const updated = prev.filter(p => p.id !== rosterId);
      localStorage.setItem('pickleball-player-roster', JSON.stringify(updated));
      return updated;
    });
  };

  // Add participant
  const addParticipant = () => {
    if (!newParticipant.name.trim()) return;

    const name = newParticipant.name.trim();
    const partner = participantType === 'team' ? newParticipant.partner.trim() : null;

    const participant = {
      id: crypto.randomUUID(),
      type: participantType,
      name,
      partner,
      wins: 0,
      losses: 0,
      points: 0
    };

    setParticipants([...participants, participant]);
    saveToRoster(name, partner, participantType);
    setNewParticipant({ name: '', partner: '' });
  };

  const removeParticipant = (id) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const startEditingParticipant = (participant) => {
    setEditingParticipant({ id: participant.id, name: participant.name, partner: participant.partner || '' });
  };

  const saveEditingParticipant = () => {
    if (!editingParticipant || !editingParticipant.name.trim()) return;
    setParticipants(participants.map(p =>
      p.id === editingParticipant.id
        ? { ...p, name: editingParticipant.name.trim(), partner: p.type === 'team' ? editingParticipant.partner.trim() : p.partner }
        : p
    ));
    setEditingParticipant(null);
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

  // Generate Single Elimination
  const generateBracket = () => {
    if (participants.length < 4) {
      alert('Need at least 4 participants for single elimination');
      return;
    }

    // Calculate team count to check for byes before generating
    const teamCount = participantType === 'individual' ? Math.ceil(participants.length / 2) : participants.length;
    const nextPow2 = Math.pow(2, Math.ceil(Math.log2(teamCount)));
    const byesNeeded = nextPow2 - teamCount;

    if (byesNeeded > 0) {
      const prevPow2 = nextPow2 / 2;
      const playersForPerfect = participantType === 'individual' ? nextPow2 * 2 : nextPow2;
      const playersForSmaller = participantType === 'individual' ? prevPow2 * 2 : prevPow2;
      const byeTeamWord = byesNeeded === 1 ? 'team' : 'teams';
      const unit = participantType === 'individual' ? 'players' : 'teams';

      if (!confirm(
        `Heads up: With ${participants.length} ${unit}, ${byesNeeded} ${byeTeamWord} will get a bye (sit out round 1).\n\n` +
        `For no byes, you need ${playersForPerfect} ${unit}` +
        (prevPow2 >= 2 ? ` or ${playersForSmaller} ${unit}` : '') +
        `.\n\nContinue anyway?`
      )) {
        return;
      }
    }

    // Create a single elimination bracket with bye support
    const shuffled = [...participants].sort(() => Math.random() - 0.5);

    // Auto-pair individuals into doubles teams (2 players per side)
    let shuffledParticipants;
    if (participantType === 'individual') {
      shuffledParticipants = [];
      for (let i = 0; i < shuffled.length - 1; i += 2) {
        shuffledParticipants.push([shuffled[i], shuffled[i + 1]]);
      }
      // If odd number, last player gets a bye partner-less (solo entry)
      if (shuffled.length % 2 !== 0) {
        shuffledParticipants.push([shuffled[shuffled.length - 1]]);
      }
    } else {
      shuffledParticipants = shuffled;
    }

    const bracketMatches = [];

    // Pad to next power of 2 for balanced bracket
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(shuffledParticipants.length)));
    const byeCount = bracketSize - shuffledParticipants.length;

    // First round
    const firstRoundMatchCount = bracketSize / 2;
    for (let i = 0; i < firstRoundMatchCount; i++) {
      const team1 = i < shuffledParticipants.length ? shuffledParticipants[i] : null;
      const team2 = (bracketSize - 1 - i) < shuffledParticipants.length ? shuffledParticipants[bracketSize - 1 - i] : null;

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

  // Generate Double Elimination Bracket
  const generateDoubleElim = () => {
    if (participants.length < 4) {
      alert('Need at least 4 participants for double elimination');
      return;
    }

    // Calculate team count to check for byes before generating
    const teamCount = participantType === 'individual' ? Math.ceil(participants.length / 2) : participants.length;
    const nextPow2 = Math.pow(2, Math.ceil(Math.log2(teamCount)));
    const byesNeeded = nextPow2 - teamCount;

    if (byesNeeded > 0) {
      const prevPow2 = nextPow2 / 2;
      const playersForPerfect = participantType === 'individual' ? nextPow2 * 2 : nextPow2;
      const playersForSmaller = participantType === 'individual' ? prevPow2 * 2 : prevPow2;
      const byeTeamWord = byesNeeded === 1 ? 'team' : 'teams';
      const unit = participantType === 'individual' ? 'players' : 'teams';

      if (!confirm(
        `Heads up: With ${participants.length} ${unit}, ${byesNeeded} ${byeTeamWord} will get a bye (sit out round 1).\n\n` +
        `For no byes, you need ${playersForPerfect} ${unit}` +
        (prevPow2 >= 2 ? ` or ${playersForSmaller} ${unit}` : '') +
        `.\n\nContinue anyway?`
      )) {
        return;
      }
    }

    const rawShuffled = [...participants].sort(() => Math.random() - 0.5);

    // Auto-pair individuals into doubles teams (2 players per side)
    let shuffled;
    if (participantType === 'individual') {
      shuffled = [];
      for (let i = 0; i < rawShuffled.length - 1; i += 2) {
        shuffled.push([rawShuffled[i], rawShuffled[i + 1]]);
      }
      if (rawShuffled.length % 2 !== 0) {
        shuffled.push([rawShuffled[rawShuffled.length - 1]]);
      }
    } else {
      shuffled = rawShuffled;
    }

    const allMatches = [];

    // --- Winners Bracket ---
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(shuffled.length)));
    const winnersRounds = Math.log2(bracketSize);

    // Winners R1
    const firstRoundCount = bracketSize / 2;
    for (let i = 0; i < firstRoundCount; i++) {
      const p1 = i < shuffled.length ? shuffled[i] : null;
      const p2 = (bracketSize - 1 - i) < shuffled.length ? shuffled[bracketSize - 1 - i] : null;

      if (p1 && p2) {
        allMatches.push({
          id: `winners-${i}-round-1`, round: 1, bracket: 'winners',
          team1: p1, team2: p2, score1: null, score2: null,
          winner: null, completed: false, bracketPosition: i
        });
      } else if (p1) {
        allMatches.push({
          id: `winners-${i}-round-1`, round: 1, bracket: 'winners',
          team1: p1, team2: null, score1: null, score2: null,
          winner: p1, completed: true, bracketPosition: i, isBye: true
        });
      }
    }

    // Winners subsequent rounds
    let wMatchCount = firstRoundCount;
    for (let r = 2; r <= winnersRounds; r++) {
      wMatchCount = Math.ceil(wMatchCount / 2);
      for (let i = 0; i < wMatchCount; i++) {
        allMatches.push({
          id: `winners-${i}-round-${r}`, round: r, bracket: 'winners',
          team1: null, team2: null, score1: null, score2: null,
          winner: null, completed: false, bracketPosition: i
        });
      }
    }

    // Advance bye winners in winners bracket
    allMatches.filter(m => m.bracket === 'winners' && m.isBye && m.winner).forEach(byeMatch => {
      const next = allMatches.find(m =>
        m.bracket === 'winners' && m.round === 2 &&
        Math.floor(byeMatch.bracketPosition / 2) === m.bracketPosition
      );
      if (next) {
        if (!next.team1) next.team1 = byeMatch.winner;
        else next.team2 = byeMatch.winner;
      }
    });

    // --- Losers Bracket ---
    // Losers has (winnersRounds - 1) * 2 rounds
    // Odd losers rounds: winners-bracket losers drop in and face losers-bracket survivors
    // Even losers rounds: losers-bracket survivors play each other
    const losersRounds = (winnersRounds - 1) * 2;

    // Calculate matches per losers round
    // LR1: firstRoundCount/2 matches (R1 losers paired up)
    // LR2: same count (survivors play each other) -> halves
    // LR3: new drop-ins from winners R2 face LR2 survivors
    // etc.
    let losersMatchCount = Math.ceil(firstRoundCount / 2);
    for (let lr = 1; lr <= losersRounds; lr++) {
      for (let i = 0; i < losersMatchCount; i++) {
        allMatches.push({
          id: `losers-${i}-round-${lr}`, round: lr, bracket: 'losers',
          team1: null, team2: null, score1: null, score2: null,
          winner: null, completed: false, bracketPosition: i
        });
      }
      // Even rounds halve the count (survivors play each other, then halve)
      if (lr % 2 === 0) {
        losersMatchCount = Math.ceil(losersMatchCount / 2);
      }
    }

    // --- Grand Final ---
    allMatches.push({
      id: 'grand-final', round: 1, bracket: 'grand-final',
      team1: null, team2: null, score1: null, score2: null,
      winner: null, completed: false, bracketPosition: 0
    });

    // --- Reset Match (placeholder, only activated if needed) ---
    allMatches.push({
      id: 'reset-match', round: 1, bracket: 'reset',
      team1: null, team2: null, score1: null, score2: null,
      winner: null, completed: false, bracketPosition: 0, isReset: true
    });

    setMatches(allMatches);
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

  // Complete match — can be called inline (with matchObj and scores) or from the match view
  const completeMatch = (inlineMatch, inlineScore1, inlineScore2) => {
    const matchToComplete = inlineMatch || currentMatch;
    if (!matchToComplete) return;

    const { pointsToWin, winByTwo } = tournamentSettings;

    // Check if match is actually complete
    const team1Score = inlineMatch ? inlineScore1 : score.team1;
    const team2Score = inlineMatch ? inlineScore2 : score.team2;
    const scoreDiff = Math.abs(team1Score - team2Score);

    if ((team1Score < pointsToWin && team2Score < pointsToWin) ||
        (winByTwo && scoreDiff < 2 && (team1Score >= pointsToWin || team2Score >= pointsToWin)) ||
        team1Score === team2Score) {
      return false;
    }

    // Save currentMatch temporarily for the rest of the logic
    const savedCurrentMatch = currentMatch;
    const activeMatch = matchToComplete;

    const winnerTeam = team1Score > team2Score ? activeMatch.team1 : activeMatch.team2;
    const loserTeam = team1Score > team2Score ? activeMatch.team2 : activeMatch.team1;
    const winScore = Math.max(team1Score, team2Score);
    const loseScore = Math.min(team1Score, team2Score);

    // Update match
    let updatedMatches = matches.map(m => {
      if (m.id === activeMatch.id) {
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
    if (isBracketMatch && activeMatch.bracketPosition !== undefined) {
      const bracketMatches = updatedMatches.filter(m => m.phase === 'bracket' || (tournamentType === 'bracket' && !m.phase));
      if (bracketMatches.length === 0) return;
      const maxRound = Math.max(...bracketMatches.map(m => m.round));
      if (activeMatch.round < maxRound) {
        const nextRoundMatch = updatedMatches.find(m =>
          (m.phase === 'bracket' || (tournamentType === 'bracket' && !m.phase)) &&
          m.round === activeMatch.round + 1 &&
          Math.floor(activeMatch.bracketPosition / 2) === m.bracketPosition
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

    // Double elimination: advance winner + send loser to losers bracket
    if (tournamentType === 'doubleelim' && activeMatch.bracket) {
      const loserTeam = winnerTeam === activeMatch.team1 ? activeMatch.team2 : activeMatch.team1;
      const winnersMatches = updatedMatches.filter(m => m.bracket === 'winners');
      const losersMatches = updatedMatches.filter(m => m.bracket === 'losers');
      const winnersMaxRound = winnersMatches.length > 0 ? Math.max(...winnersMatches.map(m => m.round)) : 0;
      const losersMaxRound = losersMatches.length > 0 ? Math.max(...losersMatches.map(m => m.round)) : 0;

      if (activeMatch.bracket === 'winners') {
        // Advance winner in winners bracket
        if (activeMatch.round < winnersMaxRound) {
          const nextWinners = updatedMatches.find(m =>
            m.bracket === 'winners' &&
            m.round === activeMatch.round + 1 &&
            Math.floor(activeMatch.bracketPosition / 2) === m.bracketPosition
          );
          if (nextWinners) {
            updatedMatches = updatedMatches.map(m => {
              if (m.id === nextWinners.id) {
                return { ...m, team1: m.team1 ? m.team1 : winnerTeam, team2: m.team1 ? winnerTeam : m.team2 };
              }
              return m;
            });
          }
        } else {
          // Winners bracket champion → grand final team1
          updatedMatches = updatedMatches.map(m => {
            if (m.bracket === 'grand-final') {
              return { ...m, team1: winnerTeam };
            }
            return m;
          });
        }

        // Send loser to losers bracket
        // Winners round N losers drop into losers round (N-1)*2 + 1
        const losersDropRound = (activeMatch.round - 1) * 2 + 1;
        const losersDropMatch = updatedMatches.find(m =>
          m.bracket === 'losers' &&
          m.round === losersDropRound &&
          (!m.team1 || !m.team2)
        );
        if (losersDropMatch) {
          updatedMatches = updatedMatches.map(m => {
            if (m.id === losersDropMatch.id) {
              return { ...m, team1: m.team1 ? m.team1 : loserTeam, team2: m.team1 ? loserTeam : m.team2 };
            }
            return m;
          });
        }
      } else if (activeMatch.bracket === 'losers') {
        // Advance winner in losers bracket
        if (activeMatch.round < losersMaxRound) {
          const nextLosers = updatedMatches.find(m =>
            m.bracket === 'losers' &&
            m.round === activeMatch.round + 1 &&
            (!m.team1 || !m.team2)
          );
          if (nextLosers) {
            updatedMatches = updatedMatches.map(m => {
              if (m.id === nextLosers.id) {
                return { ...m, team1: m.team1 ? m.team1 : winnerTeam, team2: m.team1 ? winnerTeam : m.team2 };
              }
              return m;
            });
          }
        } else {
          // Losers bracket champion → grand final team2
          updatedMatches = updatedMatches.map(m => {
            if (m.bracket === 'grand-final') {
              return { ...m, team2: winnerTeam };
            }
            return m;
          });
        }
      } else if (activeMatch.bracket === 'grand-final') {
        const grandFinal = updatedMatches.find(m => m.id === 'grand-final');
        if (grandFinal) {
          // If losers bracket champion won, activate reset match
          if (winnerTeam === grandFinal.team2) {
            updatedMatches = updatedMatches.map(m => {
              if (m.id === 'reset-match') {
                return { ...m, team1: grandFinal.team1, team2: grandFinal.team2 };
              }
              return m;
            });
          }
          // If winners bracket champion won, tournament is over
        }
      }
      // Reset match: winner is champion, no further advancement needed
    }

    setMatches(updatedMatches);
    setParticipants(updatedParticipants);

    // Double elimination: stay on tournament view
    if (tournamentType === 'doubleelim') {
      setCurrentView('tournament');
      setCurrentMatch(null);
      return true;
    }

    // Pool play: check if pool phase is done → advance to bracket
    if (tournamentType === 'poolplay' && tournamentPhase === 'pools') {
      const poolMatches = updatedMatches.filter(m => m.phase === 'pool');
      if (poolMatches.every(m => m.completed)) {
        setCurrentMatch(null);
        setTimeout(() => advanceToBracket(), 100);
        return true;
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
      return true;
    }

    // Stay on tournament view — user clicks "View Results" when ready
    if (!inlineMatch) {
      setCurrentView('tournament');
    }
    setCurrentMatch(null);
    return true;
  };

  // Get standings with tiebreakers: wins → head-to-head → point differential → win % → total points (memoized)
  const getStandings = useMemo(() => () => {
    // Calculate point differential for each participant
    const pointDiffs = {};
    participants.forEach(p => { pointDiffs[p.id] = 0; });
    matches.filter(m => m.completed).forEach(m => {
      const t1Ids = Array.isArray(m.team1) ? m.team1.map(x => x.id) : [m.team1?.id];
      const t2Ids = Array.isArray(m.team2) ? m.team2.map(x => x.id) : [m.team2?.id];
      t1Ids.forEach(id => { if (id && pointDiffs[id] !== undefined) pointDiffs[id] += (m.score1 || 0) - (m.score2 || 0); });
      t2Ids.forEach(id => { if (id && pointDiffs[id] !== undefined) pointDiffs[id] += (m.score2 || 0) - (m.score1 || 0); });
    });

    // Head-to-head: did A beat B directly?
    const getHeadToHead = (aId, bId) => {
      const h2h = matches.filter(m => {
        if (!m.completed) return false;
        const t1Ids = Array.isArray(m.team1) ? m.team1.map(x => x.id) : [m.team1?.id];
        const t2Ids = Array.isArray(m.team2) ? m.team2.map(x => x.id) : [m.team2?.id];
        return (t1Ids.includes(aId) && t2Ids.includes(bId)) || (t1Ids.includes(bId) && t2Ids.includes(aId));
      });
      let aWins = 0, bWins = 0;
      h2h.forEach(m => {
        const winnerId = Array.isArray(m.winner) ? m.winner[0]?.id : m.winner?.id;
        const t1Ids = Array.isArray(m.team1) ? m.team1.map(x => x.id) : [m.team1?.id];
        if (t1Ids.includes(aId)) {
          if (winnerId && t1Ids.includes(winnerId)) aWins++; else bWins++;
        } else {
          if (winnerId && t1Ids.includes(winnerId)) bWins++; else aWins++;
        }
      });
      if (aWins > bWins) return -1; // A wins h2h
      if (bWins > aWins) return 1;  // B wins h2h
      return 0; // tied or never played
    };

    return [...participants]
      .map(p => ({
        ...p,
        winPercentage: p.wins + p.losses > 0 ? (p.wins / (p.wins + p.losses)) * 100 : 0,
        pointDiff: pointDiffs[p.id] || 0,
      }))
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        const h2h = getHeadToHead(a.id, b.id);
        if (h2h !== 0) return h2h;
        if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
        if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
        return b.points - a.points;
      });
  }, [participants, matches]);

  const saveGame = () => {
    const gameName = tournamentName || 'Untitled Game';
    const participantIds = participants.map(p => p.id).sort().join(',');

    // Check if this tournament was already saved (same name + same participants)
    const existingIndex = savedGames.findIndex(g =>
      g.name === gameName && g.participantIds === participantIds
    );

    const game = {
      id: existingIndex >= 0 ? savedGames[existingIndex].id : Date.now(),
      name: gameName,
      participantIds,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      type: tournamentType,
      participantType,
      participants: participants.map(p => ({ ...p })),
      matches: matches.map(m => ({ ...m })),
      standings: getStandings(),
    };

    let updated;
    if (existingIndex >= 0) {
      // Update existing save
      updated = [...savedGames];
      updated[existingIndex] = game;
    } else {
      // New save — most recent first
      updated = [game, ...savedGames];
    }
    setSavedGames(updated);
    localStorage.setItem('pickleball-saved-games', JSON.stringify(updated));

    // Publish activity event (fire-and-forget)
    try {
      const stored = localStorage.getItem('pickleball-user');
      if (stored) {
        const u = JSON.parse(stored);
        const standings = game.standings || [];
        const winner = standings.length > 0 ? standings[0].name : null;
        fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'publish',
            email: u.email,
            event: {
              type: 'game-complete',
              userName: u.name,
              message: `completed a ${game.type === 'roundrobin' ? 'round robin' : game.type === 'bracket' ? 'single elimination' : 'double elimination'} game "${game.name}"`,
              details: winner ? `Winner: ${winner} (${standings.length} players)` : `${standings.length} players`,
              gameName: game.name,
              gameType: game.type,
            },
          }),
        }).catch(() => {});
      }
    } catch {}

    return game;
  };

  const shareGame = async () => {
    setIsSharing(true);
    try {
      const state = {
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
        tournamentName,
      };
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: shareCode || undefined, state }),
      });
      const data = await res.json();
      if (data.code) {
        setShareCode(data.code);
        const url = `${window.location.origin}/tournament?code=${data.code}`;
        setShareUrl(url);
        setShowShareModal(true);
      }
    } catch (e) {
      console.error('Share game error:', e);
    } finally {
      setIsSharing(false);
    }
  };

  const resetTournament = () => {
    setMatches([]);
    setCurrentMatch(null);
    setParticipants([]);
    setTournamentPhase(null);
    setLadderSession(0);
    setCourtAssignments({});
    setAiMessages([]);
    setExtractedData(null);
    setUserInput('');
    setTournamentName('');
    setAutoSaved(false);
    setCurrentView('format-select');
    localStorage.removeItem('pickleball-tournament');
  };

  const deleteSavedGame = (gameId) => {
    const updated = savedGames.filter(g => g.id !== gameId);
    setSavedGames(updated);
    localStorage.setItem('pickleball-saved-games', JSON.stringify(updated));
    if (viewingSavedGame && viewingSavedGame.id === gameId) {
      setViewingSavedGame(null);
    }
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

  // Auto-score: update match score and auto-complete/uncomplete based on rules
  const handleScoreChange = (matchId, field, value) => {
    const parsed = value === '' ? null : Math.max(0, parseInt(value) || 0);
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    let s1 = field === 'score1' ? parsed : match.score1;
    let s2 = field === 'score2' ? parsed : match.score2;
    const { pointsToWin, winByTwo } = tournamentSettings;

    // Cap only the field being typed in (never change the other field mid-typing)
    if (s1 !== null && s2 !== null) {
      const otherScore = field === 'score1' ? s2 : s1;
      if (winByTwo) {
        const maxScore = otherScore >= pointsToWin - 1 ? otherScore + 2 : pointsToWin;
        if (field === 'score1') s1 = Math.min(s1, maxScore);
        else s2 = Math.min(s2, maxScore);
      } else {
        if (field === 'score1') s1 = Math.min(s1, pointsToWin);
        else s2 = Math.min(s2, pointsToWin);
      }
    }

    // Only auto-complete when both scores form a valid finished game
    const bothEntered = s1 !== null && s2 !== null;
    const scoreDiff = bothEntered ? Math.abs(s1 - s2) : 0;
    const highScore = bothEntered ? Math.max(s1, s2) : 0;
    const lowScore = bothEntered ? Math.min(s1, s2) : 0;
    // Valid game: winner has exactly pointsToWin, or exactly loser+2 in deuce
    const validGame = bothEntered && (winByTwo
      ? (lowScore < pointsToWin - 1 ? highScore === pointsToWin : highScore === lowScore + 2)
      : highScore === pointsToWin);
    const isComplete = bothEntered && s1 !== s2 &&
      (s1 >= pointsToWin || s2 >= pointsToWin) &&
      (!winByTwo || scoreDiff >= 2) &&
      validGame;

    // If match was previously completed, reverse old stats
    if (match.completed && match.winner) {
      const oldWinnerIds = Array.isArray(match.winner) ? match.winner.map(p => p.id) : [match.winner.id];
      const oldLoserTeam = (match.winner === match.team1 || match.winner?.id === match.team1?.id) ? match.team2 : match.team1;
      const oldLoserIds = Array.isArray(oldLoserTeam) ? oldLoserTeam.map(p => p.id) : [oldLoserTeam?.id].filter(Boolean);
      const oldWinScore = Math.max(match.score1 || 0, match.score2 || 0);
      const oldLoseScore = Math.min(match.score1 || 0, match.score2 || 0);
      setParticipants(prev => prev.map(p => {
        if (oldWinnerIds.includes(p.id)) return { ...p, wins: Math.max(0, p.wins - 1), points: Math.max(0, p.points - oldWinScore) };
        if (oldLoserIds.includes(p.id)) return { ...p, losses: Math.max(0, p.losses - 1), points: Math.max(0, p.points - oldLoseScore) };
        return p;
      }));
    }

    if (isComplete) {
      // Use completeMatch to handle all advancement logic
      // First update the match scores so completeMatch can read them
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, score1: s1, score2: s2, completed: false, winner: null } : m));
      // Run completion on next tick so state is updated
      setTimeout(() => completeMatch({ ...match, score1: s1, score2: s2 }, s1, s2), 0);
    } else {
      // Just update scores, mark uncompleted
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, score1: s1, score2: s2, completed: false, winner: null } : m));
    }
  };

  // Render a score input next to a team name — always editable
  const renderScoreInput = (match, teamNum, size = 'normal') => {
    if (!match.team1 || !match.team2) return null;
    const val = match[teamNum] ?? '';
    const isSmall = size === 'small';
    const inputClass = isSmall
      ? 'w-12 text-center text-sm font-bold border rounded-md py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
      : 'w-14 text-center text-lg font-bold border rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
    const borderColor = match.completed ? 'border-green-400 bg-green-50' : 'border-gray-300';
    return (
      <input
        type="number"
        min="0"
        value={val === null || val === '' ? '' : val}
        onChange={(e) => handleScoreChange(match.id, teamNum, e.target.value)}
        className={`${inputClass} ${borderColor}`}
        placeholder="-"
      />
    );
  };

  // Render match status indicator (no buttons needed)
  const renderMatchAction = (match, size = 'normal') => {
    if (match.completed) {
      return (
        <div className="flex items-center gap-1">
          <Crown className="text-yellow-500" size={size === 'small' ? 14 : 20} />
          <span className={`font-medium text-green-600 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>Done</span>
        </div>
      );
    }
    if (!match.team1 || !match.team2) return <span className="text-gray-500 text-sm">Waiting</span>;
    return null;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient matching home page */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-court/10 via-background to-ball/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-court/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-ball/10 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src="/pickleball-vibes-logo.png" alt="Pickleball Vibes" className="h-32 w-32 md:h-36 md:w-36 object-contain drop-shadow-md cursor-pointer hover:scale-105 transition-transform duration-300" />
            </Link>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Tournament <span className="text-gradient-court">Manager</span>
            </h1>
          </div>

          <div className="flex gap-2">
            {currentView === 'format-select' && null}

            {currentView === 'setup' && (
              <>
                <button
                  onClick={() => setCurrentView('format-select')}
                  className="bg-white/70 backdrop-blur-md hover:bg-white/90 text-foreground px-4 py-2 rounded-xl shadow-soft border border-white/40 transition-all duration-300 font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentView('ai-setup')}
                  className="bg-gradient-court hover:shadow-elevated text-white px-4 py-2 rounded-xl shadow-soft flex items-center gap-2 transition-all duration-300 font-semibold"
                >
                  <Bot size={16} />
                  AI Setup
                </button>
              </>
            )}

            {currentView === 'ai-setup' && (
              <button
                onClick={() => setCurrentView('setup')}
                className="bg-white/70 backdrop-blur-md hover:bg-white/90 text-foreground px-4 py-2 rounded-xl shadow-soft border border-white/40 transition-all duration-300 font-semibold"
              >
                Manual Setup
              </button>
            )}

            {currentView !== 'setup' && currentView !== 'ai-setup' && currentView !== 'format-select' && (
              <div className="flex gap-2">
                <button
                  onClick={shareGame}
                  disabled={isSharing}
                  className="bg-gradient-court hover:shadow-elevated text-white px-4 py-2 rounded-xl shadow-soft flex items-center gap-2 transition-all duration-300 font-semibold disabled:opacity-50"
                >
                  {isSharing ? <Loader2Icon size={16} className="animate-spin" /> : <Share2 size={16} />}
                  Share
                </button>
                <button
                  onClick={() => resetTournament()}
                  className="bg-white/70 backdrop-blur-md hover:bg-white/90 text-foreground px-4 py-2 rounded-xl shadow-soft border border-white/40 flex items-center gap-2 transition-all duration-300 font-semibold"
                >
                  <Home size={16} />
                  New Game
                </button>
                {(matches.length > 0 && matches.filter(m => !m.isReset || (m.team1 && m.team2)).every(m => m.completed)) || (tournamentType === 'ladder' && tournamentPhase === 'session-results') ? (
                  <button
                    onClick={() => setCurrentView('results')}
                    className="bg-gradient-sunny hover:shadow-elevated text-foreground px-4 py-2 rounded-xl shadow-soft transition-all duration-300 font-semibold"
                  >
                    Results
                  </button>
                ) : matches.length > 0 && matches.some(m => m.completed) ? (
                  <button
                    onClick={() => {
                      if (confirm('End this game early? Results will be based on completed matches only.')) {
                        saveGame();
                        setCurrentView('results');
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl shadow-soft flex items-center gap-2 transition-all duration-300 font-semibold"
                  >
                    <StopCircle size={16} />
                    End Game
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Format Selection View */}
        {currentView === 'format-select' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Game Format</h2>
              <p className="text-muted-foreground font-body">Select a format to get started</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => { setTournamentType('roundrobin'); setCurrentView('setup'); }}
                className="text-left p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-soft hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-court/10 group-hover:bg-court/20 transition-colors">
                    <Shuffle size={32} className="text-court" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Round Robin</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Every player/team plays against every other. Best for smaller groups wanting maximum play time.</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => { setTournamentType('bracket'); setCurrentView('setup'); }}
                className="text-left p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-soft hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-ball/10 group-hover:bg-ball/20 transition-colors">
                    <Trophy size={32} className="text-ball" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Single Elimination</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Single elimination bracket. Win or go home — perfect for competitive events.</p>
                  </div>
                </div>
              </button>

              {/* Pool Play — hidden for now
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
              */}

              {/* Ladder League — hidden for now
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
              */}

              <button
                onClick={() => { setTournamentType('doubleelim'); setCurrentView('setup'); }}
                className="text-left p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-soft hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-red-50 group-hover:bg-red-100 transition-colors">
                    <Trophy size={32} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Double Elimination</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Lose twice and you're out. Winners and losers brackets lead to a grand final.</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Saved Game Detail Modal */}
            {viewingSavedGame && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingSavedGame(null)}>
                <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-elevated w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-white/50" onClick={(e) => e.stopPropagation()}>
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-white/40 p-5 rounded-t-3xl flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-display font-bold text-foreground">{viewingSavedGame.name}</h2>
                      <p className="text-sm text-muted-foreground font-body">
                        {viewingSavedGame.date} &middot; {
                          viewingSavedGame.type === 'roundrobin' ? 'Round Robin' :
                          viewingSavedGame.type === 'bracket' ? 'Bracket' :
                          viewingSavedGame.type === 'poolplay' ? 'Pool Play' :
                          viewingSavedGame.type === 'ladder' ? 'Ladder' :
                          viewingSavedGame.type === 'doubleelim' ? 'Double Elim' :
                          viewingSavedGame.type
                        }
                      </p>
                    </div>
                    <button onClick={() => setViewingSavedGame(null)} className="p-2 hover:bg-court/10 rounded-xl transition-colors">
                      <XIcon size={20} className="text-muted-foreground" />
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Champion Banner */}
                    {viewingSavedGame.standings && viewingSavedGame.standings.length > 0 && (
                      <div className="bg-gradient-sunny rounded-2xl p-5 text-center shadow-soft">
                        <Crown className="text-white mx-auto mb-1 drop-shadow" size={36} />
                        <h3 className="text-2xl font-display font-bold text-foreground mb-1">Champion</h3>
                        <p className="text-xl font-semibold text-foreground">{getDisplayName(viewingSavedGame.standings[0])}</p>
                        <p className="text-foreground/70 text-sm mt-1 font-body">
                          {viewingSavedGame.standings[0].wins}W - {viewingSavedGame.standings[0].losses}L ({viewingSavedGame.standings[0].winPercentage?.toFixed(1) || '0.0'}%)
                        </p>
                      </div>
                    )}

                    {/* Final Rankings */}
                    {viewingSavedGame.standings && viewingSavedGame.standings.length > 0 && (
                      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden">
                        <h3 className="text-lg font-display font-semibold p-4 border-b border-white/40 flex items-center gap-2">
                          <Trophy className="text-ball" size={18} />
                          Final Rankings
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-court/5">
                              <tr>
                                <th className="px-3 py-2.5 text-left text-sm font-semibold text-foreground">Rank</th>
                                <th className="px-3 py-2.5 text-left text-sm font-semibold text-foreground">{viewingSavedGame.participantType === 'team' ? 'Team' : 'Player'}</th>
                                <th className="px-3 py-2.5 text-center text-sm font-semibold text-foreground">W</th>
                                <th className="px-3 py-2.5 text-center text-sm font-semibold text-foreground">L</th>
                                <th className="px-3 py-2.5 text-center text-sm font-semibold text-foreground">Win %</th>
                                <th className="px-3 py-2.5 text-center text-sm font-semibold text-foreground">Pts</th>
                              </tr>
                            </thead>
                            <tbody>
                              {viewingSavedGame.standings.map((p, index) => (
                                <tr key={p.id || index} className={
                                  index === 0 ? 'bg-ball/10 font-semibold' :
                                  index === 1 ? 'bg-court/5' :
                                  index === 2 ? 'bg-ball/5' :
                                  'hover:bg-court/5'
                                }>
                                  <td className="px-3 py-2.5 text-sm text-foreground">
                                    <div className="flex items-center gap-1">
                                      {index === 0 && <Crown className="text-ball" size={14} />}
                                      #{index + 1}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 text-sm text-foreground">{getDisplayName(p)}</td>
                                  <td className="px-3 py-2.5 text-center text-sm text-foreground">{p.wins}</td>
                                  <td className="px-3 py-2.5 text-center text-sm text-foreground">{p.losses}</td>
                                  <td className="px-3 py-2.5 text-center text-sm text-foreground">{p.winPercentage?.toFixed(1) || '0.0'}%</td>
                                  <td className="px-3 py-2.5 text-center text-sm text-foreground">{p.points}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Match Scores */}
                    {viewingSavedGame.matches && viewingSavedGame.matches.length > 0 && (
                      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden">
                        <h3 className="text-lg font-display font-semibold p-4 border-b border-white/40 flex items-center gap-2">
                          <Play className="text-court" size={18} />
                          Match Scores
                        </h3>
                        <div className="divide-y divide-white/40">
                          {viewingSavedGame.matches
                            .filter(m => m.completed)
                            .map((m, i) => (
                              <div key={m.id || i} className="p-3.5 flex items-center justify-between hover:bg-court/5 transition-colors">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${m.winner && ((m.winner.id || m.winner) === (m.team1?.id || m.team1)) ? 'text-court font-bold' : 'text-foreground'}`}>
                                      {getDisplayName(m.team1)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">vs</span>
                                    <span className={`text-sm font-medium ${m.winner && ((m.winner.id || m.winner) === (m.team2?.id || m.team2)) ? 'text-court font-bold' : 'text-foreground'}`}>
                                      {getDisplayName(m.team2)}
                                    </span>
                                  </div>
                                  {m.bracket && (
                                    <span className="text-xs text-muted-foreground mt-0.5 block capitalize">{m.bracket.replace('-', ' ')}{m.round ? ` R${m.round}` : ''}</span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-bold text-foreground">
                                    {m.score1 ?? '?'} - {m.score2 ?? '?'}
                                  </span>
                                </div>
                              </div>
                          ))}
                          {viewingSavedGame.matches.filter(m => m.completed).length === 0 && (
                            <p className="p-3.5 text-sm text-muted-foreground text-center font-body">No completed matches</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Game History */}
            {savedGames.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="bg-gradient-court p-2 rounded-xl shadow-soft">
                    <History size={18} className="text-white" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-foreground">Game History</h3>
                </div>
                <div className="space-y-3">
                  {savedGames.map((game) => {
                    const typeLabel = game.type === 'roundrobin' ? 'Round Robin' : game.type === 'bracket' ? 'Bracket' : game.type === 'poolplay' ? 'Pool Play' : game.type === 'ladder' ? 'Ladder' : game.type === 'doubleelim' ? 'Double Elim' : game.type;
                    const champion = game.standings && game.standings[0];
                    return (
                      <div key={game.id} className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-white/50 shadow-soft hover:shadow-elevated transition-all duration-300">
                        <div className="flex-1 cursor-pointer" onClick={() => setViewingSavedGame(game)}>
                          <p className="font-semibold text-foreground">{game.name}</p>
                          <p className="text-sm text-muted-foreground font-body">{game.date} &middot; {typeLabel} &middot; {game.participants?.length || 0} {game.participantType === 'team' ? 'teams' : 'players'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {champion && (
                            <div className="flex items-center gap-1 text-sm text-ball font-semibold">
                              <Crown size={14} className="text-ball" />
                              <span className="hidden sm:inline">{champion.name}{champion.partner ? ` & ${champion.partner}` : ''}</span>
                            </div>
                          )}
                          <button
                            onClick={() => setViewingSavedGame(game)}
                            className="p-2 text-court hover:bg-court/10 rounded-xl transition-colors"
                            title="View scores"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this saved game?')) deleteSavedGame(game.id); }}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                            title="Delete game"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                  aiMessages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                    onClick={toggleSpeechToText}
                    disabled={isProcessing}
                    className={`px-3 py-2 rounded-lg flex items-center transition-colors ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    title={isListening ? 'Stop listening' : 'Speak'}
                  >
                    <Mic size={16} />
                  </button>
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
            
            {/* Game Name */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Game Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder="e.g. Saturday Night Showdown"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
            </div>

            {/* Invite Friends */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm transition-colors"
              >
                <UserPlus size={16} />
                Invite Friends
              </button>
            </div>

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
                    <option value="bracket">Single Elimination</option>
                    {/* <option value="poolplay">Pool Play into Bracket</option> */}
                    {/* <option value="ladder">Ladder League</option> */}
                    <option value="doubleelim">Double Elimination</option>
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
                
                {(tournamentType === 'roundrobin' || tournamentType === 'poolplay' || tournamentType === 'bracket' || tournamentType === 'doubleelim') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Courts</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={tournamentSettings.courts}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTournamentSettings({
                          ...tournamentSettings,
                          courts: val === '' ? '' : parseInt(val)
                        });
                      }}
                      onBlur={() => {
                        const val = tournamentSettings.courts;
                        if (!val || val < 1) setTournamentSettings({ ...tournamentSettings, courts: 1 });
                        else if (val > 12) setTournamentSettings({ ...tournamentSettings, courts: 12 });
                      }}
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
                        onChange={(e) => {
                          const val = e.target.value;
                          setTournamentSettings({
                            ...tournamentSettings,
                            rounds: val === '' ? '' : parseInt(val)
                          });
                        }}
                        onBlur={() => {
                          const val = tournamentSettings.rounds;
                          if (!val || val < 1) setTournamentSettings({ ...tournamentSettings, rounds: 1 });
                          else if (val > 10) setTournamentSettings({ ...tournamentSettings, rounds: 10 });
                        }}
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
                        onChange={(e) => {
                          const val = e.target.value;
                          setTournamentSettings({
                            ...tournamentSettings,
                            numPools: val === '' ? '' : parseInt(val)
                          });
                        }}
                        onBlur={() => {
                          const val = tournamentSettings.numPools;
                          if (!val || val < 1) setTournamentSettings({ ...tournamentSettings, numPools: 1 });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Teams per Pool</label>
                      <input
                        type="number"
                        min="2"
                        value={tournamentSettings.poolSize}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTournamentSettings({
                            ...tournamentSettings,
                            poolSize: val === '' ? '' : parseInt(val)
                          });
                        }}
                        onBlur={() => {
                          const val = tournamentSettings.poolSize;
                          if (!val || val < 2) setTournamentSettings({ ...tournamentSettings, poolSize: 2 });
                        }}
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
                  onKeyDown={(e) => { if (e.key === 'Enter') { if (participantType !== 'team' || newParticipant.partner.trim()) addParticipant(); } }}
                  placeholder={participantType === 'team' ? 'Player 1 name' : 'Player name'}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {participantType === 'team' && (
                  <input
                    type="text"
                    value={newParticipant.partner}
                    onChange={(e) => setNewParticipant({...newParticipant, partner: e.target.value})}
                    onKeyDown={(e) => { if (e.key === 'Enter') addParticipant(); }}
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

              {/* Friends — quick-add from friends list */}
              {friends.length > 0 && (() => {
                const available = friends.filter(f => !participants.some(p => p.name.toLowerCase() === f.name.toLowerCase()));
                return available.length > 0 ? (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <Users size={14} />
                      Friends
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {available.map(f => (
                        <button
                          key={f.emailHash || f.email}
                          onClick={() => addFriendAsParticipant(f)}
                          className="px-3 py-1.5 rounded-full text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer transition-colors"
                        >
                          + {f.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Player Roster — pick from previously used players */}
              {playerRoster.filter(r => r.type === participantType).length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Player Roster — tap to add</h3>
                  <div className="flex flex-wrap gap-2">
                    {playerRoster.filter(r => r.type === participantType).map(rp => {
                      const alreadyIn = participants.some(p =>
                        p.name.toLowerCase() === rp.name.toLowerCase() &&
                        (p.partner || '').toLowerCase() === (rp.partner || '').toLowerCase()
                      );
                      return (
                        <div key={rp.id} className="flex items-center gap-1">
                          <button
                            onClick={() => !alreadyIn && addFromRoster(rp)}
                            disabled={alreadyIn}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              alreadyIn
                                ? 'bg-green-100 text-green-700 cursor-default'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer'
                            }`}
                          >
                            {alreadyIn ? '✓ ' : '+ '}
                            {rp.name}{rp.partner ? ` & ${rp.partner}` : ''}
                          </button>
                          <button
                            onClick={() => removeFromRoster(rp.id)}
                            className="text-gray-400 hover:text-red-500 p-0.5 transition-colors"
                            title="Remove from roster"
                          >
                            <XIcon size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Current Game Players */}
            {participants.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200">
                <h2 className="text-xl font-semibold p-4 border-b border-gray-200">
                  Current Game — {participantType === 'team' ? 'Teams' : 'Players'} ({participants.length})
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
                        {editingParticipant && editingParticipant.id === participant.id ? (
                          <div className="flex-1 flex gap-2 items-center">
                            <input
                              type="text"
                              value={editingParticipant.name}
                              onChange={(e) => setEditingParticipant({ ...editingParticipant, name: e.target.value })}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveEditingParticipant(); if (e.key === 'Escape') setEditingParticipant(null); }}
                              className="flex-1 px-2 py-1 border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              autoFocus
                            />
                            {participant.type === 'team' && (
                              <input
                                type="text"
                                value={editingParticipant.partner}
                                onChange={(e) => setEditingParticipant({ ...editingParticipant, partner: e.target.value })}
                                onKeyDown={(e) => { if (e.key === 'Enter') saveEditingParticipant(); if (e.key === 'Escape') setEditingParticipant(null); }}
                                className="flex-1 px-2 py-1 border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            )}
                            <button onClick={saveEditingParticipant} className="text-green-600 hover:text-green-800 p-1" title="Save">
                              <Save size={16} />
                            </button>
                            <button onClick={() => setEditingParticipant(null)} className="text-gray-500 hover:text-gray-700 p-1" title="Cancel">
                              <XIcon size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
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
                                onClick={() => startEditingParticipant(participant)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Edit name"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => removeParticipant(participant.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </>
                        )}
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
                      else if (tournamentType === 'doubleelim') generateDoubleElim();
                      else generateBracket();
                    }}
                    disabled={!tournamentName.trim() || (tournamentType === 'ladder' ? (participants.length < 4 || participants.length % 4 !== 0) : (tournamentType === 'bracket' || tournamentType === 'doubleelim') ? participants.length < 4 : participants.length < 2)}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Shuffle size={20} />
                    Start {tournamentType === 'roundrobin' ? 'Round Robin' : tournamentType === 'poolplay' ? 'Pool Play' : tournamentType === 'ladder' ? 'Ladder League' : tournamentType === 'doubleelim' ? 'Double Elimination' : 'Single Elimination'}
                  </button>
                  {!tournamentName.trim() && (
                    <p className="text-sm text-red-500 mt-2 text-center">
                      Please enter a game name to start
                    </p>
                  )}
                  {tournamentType === 'ladder' && participants.length > 0 && participants.length % 4 !== 0 && (
                    <p className="text-sm text-red-500 mt-2 text-center">
                      Need a multiple of 4 players for ladder league (currently {participants.length})
                    </p>
                  )}
                  {(tournamentType === 'bracket' || tournamentType === 'doubleelim') && participants.length > 0 && participants.length < 4 && (
                    <p className="text-sm text-red-500 mt-2 text-center">
                      Need at least 4 {participantType === 'team' ? 'teams' : 'players'} for {tournamentType === 'doubleelim' ? 'double' : 'single'} elimination (currently {participants.length})
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
              <div>
                {tournamentName && <h2 className="text-2xl font-bold text-gray-800">{tournamentName}</h2>}
                <h3 className={`${tournamentName ? 'text-lg text-gray-500' : 'text-2xl'} font-semibold flex items-center gap-2`}>
                  <Trophy className="text-yellow-600" />
                  {tournamentType === 'roundrobin' ? 'Round Robin' : tournamentType === 'poolplay' ? (tournamentPhase === 'bracket' ? 'Bracket Play' : 'Pool Play') : tournamentType === 'ladder' ? `Ladder League — Session ${ladderSession}` : tournamentType === 'doubleelim' ? 'Double Elimination' : 'Single Elimination'}
                </h3>
              </div>

              <div className="text-sm text-gray-600">
                {(() => {
                  if (tournamentType === 'ladder' && tournamentPhase === 'session-results') {
                    return 'Session complete';
                  }
                  const relevant = tournamentType === 'poolplay'
                    ? matches.filter(m => m.phase === tournamentPhase)
                    : tournamentType === 'doubleelim'
                    ? matches.filter(m => !m.isBye && !m.isReset)
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
                                        {renderScoreInput(match, 'score1', 'small')}
                                      </div>
                                      <div className="text-gray-400 text-xs mb-1">vs</div>
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium text-sm">{getDisplayName(match.team2)}</span>
                                        {renderScoreInput(match, 'score2', 'small')}
                                      </div>
                                    </div>
                                    <div className="ml-2">
                                      {renderMatchAction(match, 'small')}
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
                                    {renderScoreInput(match, 'score1')}
                                  </div>
                                  <div className="text-gray-400 text-sm mb-2">vs</div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{getDisplayName(match.team2)}</span>
                                    {renderScoreInput(match, 'score2')}
                                  </div>
                                </div>
                                <div className="ml-3">
                                  {renderMatchAction(match)}
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
                                    {renderScoreInput(match, 'score1')}
                                  </div>
                                  <div className="text-gray-400 text-sm mb-2">vs</div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{getDisplayName(match.team2)}</span>
                                    {renderScoreInput(match, 'score2')}
                                  </div>
                                </div>
                                <div className="ml-3">
                                  {renderMatchAction(match)}
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
                                {renderScoreInput(match, 'score1')}
                              </div>
                              <div className="text-gray-400 text-sm mb-2">vs</div>
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{getDisplayName(match.team2)}</span>
                                {renderScoreInput(match, 'score2')}
                              </div>
                            </div>
                            <div className="ml-3">
                              {renderMatchAction(match)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : tournamentType === 'doubleelim' ? (
                // Double Elimination display
                <>
                  {/* Render a bracket section */}
                  {(() => {
                    const renderBracketSection = (title, bracketType, colorClass) => {
                      const sectionMatches = matches.filter(m => m.bracket === bracketType && !m.isReset);
                      if (sectionMatches.length === 0) return null;
                      const rounds = {};
                      sectionMatches.forEach(m => {
                        if (!rounds[m.round]) rounds[m.round] = [];
                        rounds[m.round].push(m);
                      });
                      const maxRound = Math.max(...sectionMatches.map(m => m.round));
                      return (
                        <div className={`border-2 ${colorClass} rounded-lg p-4`}>
                          <h3 className="text-lg font-bold mb-3">{title}</h3>
                          <div className="space-y-4">
                            {Object.entries(rounds).sort(([a], [b]) => a - b).map(([round, roundMatches]) => (
                              <div key={round}>
                                <h4 className="text-sm font-semibold text-gray-500 mb-2">
                                  {bracketType === 'winners'
                                    ? (round == 1 ? 'Round 1' : round == maxRound ? 'Winners Final' : `Round ${round}`)
                                    : `Round ${round}`}
                                </h4>
                                <div className="grid gap-2">
                                  {roundMatches.map(match => (
                                    <div key={match.id} className={`p-3 rounded-lg border ${
                                      match.isBye ? 'bg-gray-50 border-gray-200' :
                                      match.completed ? 'bg-green-50 border-green-200' :
                                      match.team1 && match.team2 ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'
                                    }`}>
                                      {match.isBye ? (
                                        <div className="text-sm text-gray-500">{getDisplayName(match.team1)} — BYE</div>
                                      ) : (
                                        <div className="flex justify-between items-center">
                                          <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                              <span className="font-medium text-sm">{getDisplayName(match.team1)}</span>
                                              {renderScoreInput(match, 'score1', 'small')}
                                            </div>
                                            <div className="text-gray-400 text-xs mb-1">vs</div>
                                            <div className="flex justify-between items-center">
                                              <span className="font-medium text-sm">{getDisplayName(match.team2)}</span>
                                              {renderScoreInput(match, 'score2', 'small')}
                                            </div>
                                          </div>
                                          <div className="ml-2">
                                            {renderMatchAction(match, 'small')}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    };

                    const grandFinal = matches.find(m => m.bracket === 'grand-final');
                    const resetMatch = matches.find(m => m.bracket === 'reset');

                    return (
                      <>
                        {renderBracketSection('Winners Bracket', 'winners', 'border-blue-200 bg-blue-50/50')}
                        {renderBracketSection('Losers Bracket', 'losers', 'border-red-200 bg-red-50/50')}

                        {/* Grand Final */}
                        {grandFinal && (
                          <div className="border-2 border-yellow-300 bg-yellow-50/50 rounded-lg p-4">
                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                              <Crown className="text-yellow-500" size={20} />
                              Grand Final
                            </h3>
                            <div className={`p-4 rounded-lg border-2 ${
                              grandFinal.completed ? 'bg-green-50 border-green-200' :
                              grandFinal.team1 && grandFinal.team2 ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">{getDisplayName(grandFinal.team1)}{grandFinal.team1 ? ' (W)' : ''}</span>
                                    {renderScoreInput(grandFinal, 'score1')}
                                  </div>
                                  <div className="text-gray-400 text-sm mb-2">vs</div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{getDisplayName(grandFinal.team2)}{grandFinal.team2 ? ' (L)' : ''}</span>
                                    {renderScoreInput(grandFinal, 'score2')}
                                  </div>
                                </div>
                                <div className="ml-3">
                                  {renderMatchAction(grandFinal)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Reset Match */}
                        {resetMatch && resetMatch.team1 && resetMatch.team2 && (
                          <div className="border-2 border-purple-300 bg-purple-50/50 rounded-lg p-4">
                            <h3 className="text-lg font-bold mb-3">Reset Match</h3>
                            <p className="text-sm text-gray-600 mb-3">Losers bracket champion won the Grand Final — one more match to decide the champion!</p>
                            <div className={`p-4 rounded-lg border-2 ${
                              resetMatch.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                            }`}>
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">{getDisplayName(resetMatch.team1)}</span>
                                    {renderScoreInput(resetMatch, 'score1')}
                                  </div>
                                  <div className="text-gray-400 text-sm mb-2">vs</div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{getDisplayName(resetMatch.team2)}</span>
                                    {renderScoreInput(resetMatch, 'score2')}
                                  </div>
                                </div>
                                <div className="ml-3">
                                  {renderMatchAction(resetMatch)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              ) : (
                // Single Elimination Bracket tournament
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
                        match.isBye ? (
                          <div key={match.id} className="p-3 rounded-lg border-2 bg-blue-50 border-blue-200 flex items-center justify-between">
                            <span className="font-medium text-blue-800">{getDisplayName(match.team1)}</span>
                            <span className="text-sm text-blue-600 font-medium">BYE — auto-advances</span>
                          </div>
                        ) : !match.team1 && !match.team2 ? (
                          <div key={match.id} className="p-4 rounded-lg border-2 bg-gray-50 border-dashed border-gray-300 text-center text-gray-400 text-sm">
                            Waiting for previous round
                          </div>
                        ) : (
                          <div key={match.id} className={`p-4 rounded-lg border-2 ${
                            match.completed ? 'bg-green-50 border-green-200' :
                            match.team1 && match.team2 ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-300'
                          }`}>
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium">{getDisplayName(match.team1)}</span>
                                  {renderScoreInput(match, 'score1')}
                                </div>
                                <div className="text-gray-400 text-sm mb-2">vs</div>
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{getDisplayName(match.team2)}</span>
                                  {renderScoreInput(match, 'score2')}
                                </div>
                              </div>
                              <div className="ml-3">
                                {renderMatchAction(match)}
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* View Final Rankings Button — shown for all formats when all matches are done */}
            {matches.length > 0 &&
             tournamentType !== 'ladder' &&
             !(tournamentType === 'poolplay' && tournamentPhase === 'pools') &&
             matches.filter(m => !m.isReset || (m.team1 && m.team2)).every(m => m.completed) && (
              <div className="text-center mt-4">
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
            {/* Game Title */}
            {tournamentName && (
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800">{tournamentName}</h2>
                <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            )}

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
                      <th className="px-4 py-3 text-center">+/-</th>
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
                        <td className={`px-4 py-3 text-center font-medium ${participant.pointDiff > 0 ? 'text-green-600' : participant.pointDiff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {participant.pointDiff > 0 ? '+' : ''}{participant.pointDiff}
                        </td>
                        <td className="px-4 py-3 text-center">{participant.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Auto-saved indicator */}
            {autoSaved && (
              <p className="text-center text-green-600 text-sm font-medium flex items-center justify-center gap-1">
                <Save size={14} />
                Game automatically saved
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={shareGame}
                disabled={isSharing}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSharing ? <Loader2Icon size={16} className="animate-spin" /> : <Share2 size={16} />}
                Share Results
              </button>
              <button
                onClick={() => setCurrentView('tournament')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                Back to Tournament
              </button>
              <button
                onClick={() => resetTournament()}
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

      {showInviteModal && (
        <TournamentInviteModal
          onClose={() => setShowInviteModal(false)}
          tournamentName={tournamentName}
        />
      )}

      {showShareModal && shareCode && (
        <ShareGameModal
          onClose={() => setShowShareModal(false)}
          shareCode={shareCode}
          shareUrl={shareUrl}
        />
      )}
    </div>
  );
};

export default PickleballTournament;
