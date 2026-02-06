import React, { useState, useEffect } from 'react';
import { Plus, Users, Trophy, Play, Edit3, Trash2, Shuffle, Target, Crown, MessageCircle, Send, Bot, Mic } from 'lucide-react';

const PickleballTournament = () => {
  const [currentView, setCurrentView] = useState('setup'); // setup, ai-setup, tournament, match, results
  const [tournamentType, setTournamentType] = useState('roundrobin'); // roundrobin, bracket
  const [participantType, setParticipantType] = useState('individual'); // individual, team
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [tournamentSettings, setTournamentSettings] = useState({
    rounds: 1,
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
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: messages,
        })
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
        id: Date.now() + index,
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
      id: Date.now(),
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
    if (participants.length < 2) {
      alert('Need at least 2 participants for a tournament');
      return;
    }

    const allMatches = [];
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);

    // Generate all possible combinations
    for (let i = 0; i < shuffledParticipants.length; i++) {
      for (let j = i + 1; j < shuffledParticipants.length; j++) {
        for (let round = 1; round <= tournamentSettings.rounds; round++) {
          allMatches.push({
            id: `${shuffledParticipants[i].id}-${shuffledParticipants[j].id}-${round}`,
            round,
            team1: shuffledParticipants[i],
            team2: shuffledParticipants[j],
            score1: null,
            score2: null,
            winner: null,
            completed: false
          });
        }
      }
    }

    // Shuffle matches within each round for variety
    const matchesByRound = {};
    allMatches.forEach(match => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = [];
      }
      matchesByRound[match.round].push(match);
    });

    const shuffledMatches = [];
    Object.keys(matchesByRound).forEach(round => {
      const roundMatches = matchesByRound[round].sort(() => Math.random() - 0.5);
      shuffledMatches.push(...roundMatches);
    });

    setMatches(shuffledMatches);
    setCurrentView('tournament');
  };

  // Generate Tournament Bracket
  const generateBracket = () => {
    if (participants.length < 2) {
      alert('Need at least 2 participants for a tournament');
      return;
    }

    // For simplicity, create a single elimination bracket
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);
    const bracketMatches = [];
    
    // First round
    for (let i = 0; i < shuffledParticipants.length; i += 2) {
      if (i + 1 < shuffledParticipants.length) {
        bracketMatches.push({
          id: `bracket-${i/2}-round-1`,
          round: 1,
          team1: shuffledParticipants[i],
          team2: shuffledParticipants[i + 1],
          score1: null,
          score2: null,
          winner: null,
          completed: false,
          bracketPosition: i / 2
        });
      }
    }

    // Generate subsequent rounds (placeholders)
    let currentRoundMatches = bracketMatches.length;
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

    setMatches(bracketMatches);
    setCurrentView('tournament');
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

    const winner = team1Score > team2Score ? currentMatch.team1 : currentMatch.team2;
    const loser = team1Score > team2Score ? currentMatch.team2 : currentMatch.team1;

    // Update match
    const updatedMatches = matches.map(m => {
      if (m.id === currentMatch.id) {
        return {
          ...m,
          score1: team1Score,
          score2: team2Score,
          winner: winner,
          completed: true
        };
      }
      return m;
    });

    // Update participant stats
    const updatedParticipants = participants.map(p => {
      if (p.id === winner.id) {
        return { ...p, wins: p.wins + 1, points: p.points + (team1Score > team2Score ? team1Score : team2Score) };
      }
      if (p.id === loser.id) {
        return { ...p, losses: p.losses + 1, points: p.points + (team1Score > team2Score ? team2Score : team1Score) };
      }
      return p;
    });

    setMatches(updatedMatches);
    setParticipants(updatedParticipants);

    // For bracket tournaments, advance winner
    if (tournamentType === 'bracket' && currentMatch.round < Math.max(...matches.map(m => m.round))) {
      const nextRoundMatch = matches.find(m => 
        m.round === currentMatch.round + 1 && 
        Math.floor(currentMatch.bracketPosition / 2) === m.bracketPosition
      );
      
      if (nextRoundMatch) {
        const updatedNextRoundMatches = updatedMatches.map(m => {
          if (m.id === nextRoundMatch.id) {
            return {
              ...m,
              team1: m.team1 ? m.team1 : winner,
              team2: m.team1 ? winner : m.team2
            };
          }
          return m;
        });
        setMatches(updatedNextRoundMatches);
      }
    }

    setCurrentView('tournament');
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
    setAiMessages([]);
    setExtractedData(null);
    setUserInput('');
    setCurrentView('setup');
  };

  const getDisplayName = (participant) => {
    if (!participant) return 'TBD';
    return participant.type === 'team' && participant.partner 
      ? `${participant.name} & ${participant.partner}`
      : participant.name;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Target className="text-green-600" />
            Pickleball Tournament Manager
          </h1>
          
          <div className="flex gap-2">
            {currentView === 'setup' && (
              <button
                onClick={() => setCurrentView('ai-setup')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Bot size={16} />
                AI Setup
              </button>
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
                
                {tournamentType === 'roundrobin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rounds</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={tournamentSettings.rounds}
                      onChange={(e) => setTournamentSettings({
                        ...tournamentSettings,
                        rounds: parseInt(e.target.value) || 1
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
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
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{getDisplayName(participant)}</span>
                      <button
                        onClick={() => removeParticipant(participant.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={tournamentType === 'roundrobin' ? generateRoundRobin : generateBracket}
                    disabled={participants.length < 2}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Shuffle size={20} />
                    Start {tournamentType === 'roundrobin' ? 'Round Robin' : 'Tournament Bracket'}
                  </button>
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
                {tournamentType === 'roundrobin' ? 'Round Robin' : 'Tournament Bracket'}
              </h2>
              
              <div className="text-sm text-gray-600">
                {matches.filter(m => m.completed).length} of {matches.length} matches completed
              </div>
            </div>

            {/* Matches */}
            <div className="grid gap-4">
              {tournamentType === 'roundrobin' ? (
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
                  <div className="text-6xl font-bold text-blue-600 mb-4">{score.team1}</div>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => updateScore('team1', 1)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateScore('team1', -1)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      -1
                    </button>
                  </div>
                </div>

                {/* Team 2 */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">{getDisplayName(currentMatch.team2)}</h3>
                  <div className="text-6xl font-bold text-red-600 mb-4">{score.team2}</div>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => updateScore('team2', 1)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateScore('team2', -1)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      -1
                    </button>
                  </div>
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
