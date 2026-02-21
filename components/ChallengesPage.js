import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Swords, Loader2, Check, X as XIcon, Send, Users } from 'lucide-react';

export default function ChallengesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [settings, setSettings] = useState({
    pointsToWin: 11,
    winByTwo: true,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pickleball-user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        loadChallenges(u.email);
        loadFriends(u.email);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  const loadChallenges = async (email) => {
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', email }),
      });
      const data = await res.json();
      if (data.challenges) setChallenges(data.challenges);
    } catch (e) {
      console.error('Load challenges error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async (email) => {
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', email }),
      });
      const data = await res.json();
      if (data.friends) setFriends(data.friends);
    } catch {}
  };

  const toggleFriend = (f) => {
    setSelectedFriends(prev => {
      const exists = prev.some(s => s.emailHash === f.emailHash);
      if (exists) return prev.filter(s => s.emailHash !== f.emailHash);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, f];
    });
  };

  const validSelection = selectedFriends.length === 1 || selectedFriends.length === 3;

  const createChallenge = async () => {
    if (!validSelection) return;
    setActionLoading('create');
    try {
      const targets = selectedFriends.map(f => ({
        emailHash: f.emailHash,
        email: f.email,
        name: f.name,
      }));
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          email: user.email,
          targets,
          settings,
        }),
      });
      const data = await res.json();
      if (data.challenge) {
        setChallenges(prev => [data.challenge, ...prev]);
        setShowCreate(false);
        setSelectedFriends([]);
      }
    } catch (e) {
      console.error('Create challenge error:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const respondToChallenge = async (challengeId, accept) => {
    setActionLoading(challengeId);
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'respond', email: user.email, challengeId, accept }),
      });
      const data = await res.json();
      if (data.challenge) {
        setChallenges(prev => prev.map(c => c.id === challengeId ? data.challenge : c));

        // If accepted, navigate to tournament with pre-populated settings
        if (accept && data.challenge.settings) {
          const s = data.challenge.settings;
          // Build player list: sender + all targets
          const allPlayers = [data.challenge.fromName];
          if (data.challenge.targets) {
            data.challenge.targets.forEach(t => allPlayers.push(t.name));
          } else {
            allPlayers.push(data.challenge.toName);
          }
          const params = new URLSearchParams({
            type: 'roundrobin',
            participantType: 'individual',
            pointsToWin: String(s.pointsToWin || 11),
            winByTwo: String(s.winByTwo !== false),
            players: allPlayers.join(','),
            challenge: challengeId,
          });
          router.push(`/tournament?${params.toString()}`);
        }
      }
    } catch (e) {
      console.error('Respond error:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const getEmailHash = (email) => {
    // Simple client-side check — compare stored user email hash
    return null; // We use the stored emailHash from friends data
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'declined': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <Swords className="w-16 h-16 text-court mx-auto mb-4 opacity-50" />
        <h2 className="text-2xl font-display font-bold text-foreground mb-3">Challenges</h2>
        <p className="text-muted-foreground mb-6">Log in to challenge your friends</p>
        <Link href="/login">
          <span className="inline-flex items-center gap-2 bg-gradient-court text-white px-6 py-3 rounded-xl font-bold shadow-elevated hover:scale-105 transition-all duration-300 cursor-pointer">
            Log In
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-bold text-foreground">Challenges</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 bg-court text-white rounded-xl font-semibold text-sm hover:bg-court/90 transition-colors"
        >
          <Swords className="w-4 h-4" />
          New Challenge
        </button>
      </div>

      {/* Create Challenge */}
      {showCreate && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft mb-6 animate-fade-in-up">
          <h2 className="text-lg font-semibold text-foreground mb-4">Challenge a Friend</h2>

          {/* Select Friends */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Select friends ({selectedFriends.length === 0 ? 'pick 1 or 3' : `${selectedFriends.length} selected`})
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              1 friend = 1v1 game &middot; 3 friends = 2v2 game
            </p>
            {friends.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No friends yet.{' '}
                <Link href="/friends"><span className="text-court hover:underline cursor-pointer">Add friends first</span></Link>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {friends.map(f => {
                  const isSelected = selectedFriends.some(s => s.emailHash === f.emailHash);
                  return (
                    <button
                      key={f.emailHash}
                      onClick={() => toggleFriend(f)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-court text-white'
                          : 'bg-white/70 text-foreground hover:bg-court/10 border border-white/50'
                      }`}
                    >
                      {f.name}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedFriends.length === 2 && (
              <p className="text-xs text-orange-500 mt-2">Select 1 more friend for a 2v2 game, or remove one for a 1v1</p>
            )}
          </div>

          {/* Game Settings */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-muted-foreground mb-1">Points to Win</label>
            <select
              value={settings.pointsToWin}
              onChange={(e) => setSettings({ ...settings, pointsToWin: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-white/70 border border-white/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-court/50"
            >
              <option value={11}>11</option>
              <option value={15}>15</option>
              <option value={21}>21</option>
            </select>
          </div>

          <button
            onClick={createChallenge}
            disabled={!validSelection || actionLoading === 'create'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-court text-white rounded-xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {actionLoading === 'create' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Send Challenge
          </button>
        </div>
      )}

      {/* Challenges List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-court mx-auto animate-spin" />
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50">
          <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No challenges yet. Challenge a friend!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map(c => {
            const isReceived = c.targets
              ? c.targets.some(t => t.email === user.email)
              : c.toEmail === user.email;
            const isPending = c.status === 'pending';

            // Build display of other players
            const otherNames = [];
            if (isReceived) {
              otherNames.push(c.fromName);
              if (c.targets) {
                c.targets.forEach(t => { if (t.email !== user.email) otherNames.push(t.name); });
              }
            } else {
              if (c.targets) {
                c.targets.forEach(t => otherNames.push(t.name));
              } else {
                otherNames.push(c.toName);
              }
            }

            const gameLabel = c.gameType === '2v2' ? '2v2' : '1v1';

            return (
              <div
                key={c.id}
                className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-soft"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-court/20 flex items-center justify-center">
                      <Swords className="w-4 h-4 text-court" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {otherNames.join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isReceived ? 'Challenged you' : 'You challenged'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${getStatusBadge(c.status)}`}>
                    {c.status}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground mb-3">
                  {gameLabel}
                  {' '}&middot;{' '}
                  {c.settings.pointsToWin} pts
                  {' '}&middot;{' '}
                  {formatDate(c.createdAt)}
                </div>

                {isReceived && isPending && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToChallenge(c.id, true)}
                      disabled={actionLoading === c.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-court text-white rounded-lg font-semibold text-sm hover:bg-court/90 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Accept
                    </button>
                    <button
                      onClick={() => respondToChallenge(c.id, false)}
                      disabled={actionLoading === c.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/70 text-muted-foreground rounded-lg font-semibold text-sm hover:bg-red-50 hover:text-red-500 transition-colors border border-white/50 disabled:opacity-50"
                    >
                      <XIcon className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
