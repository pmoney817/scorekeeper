import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Users, Search, UserPlus, Bell, Activity, X as XIcon, Check, Loader2, UserMinus } from 'lucide-react';

export default function FriendsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('friends'); // friends, find, requests, activity
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pickleball-user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        loadFriends(u.email);
        loadRequests(u.email);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  const loadFriends = async (email) => {
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', email }),
      });
      const data = await res.json();
      if (data.friends) setFriends(data.friends);
    } catch (e) {
      console.error('Load friends error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async (email) => {
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pending', email }),
      });
      const data = await res.json();
      if (data.requests) setRequests(data.requests);
    } catch (e) {
      console.error('Load requests error:', e);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setSearching(true);
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', email: user.email, query: searchQuery.trim() }),
      });
      const data = await res.json();
      if (data.results) setSearchResults(data.results);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (target) => {
    setActionLoading(target.emailHash);
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-request',
          email: user.email,
          targetEmailHash: target.emailHash,
          targetEmail: target.email,
          targetName: target.name,
        }),
      });
      const data = await res.json();
      if (data.status === 'sent' || data.status === 'auto-accepted') {
        // Remove from search results
        setSearchResults(prev => prev.filter(r => r.emailHash !== target.emailHash));
        if (data.status === 'auto-accepted') {
          loadFriends(user.email);
          loadRequests(user.email);
        }
      }
    } catch (e) {
      console.error('Send request error:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const respondToRequest = async (fromEmailHash, accept) => {
    setActionLoading(fromEmailHash);
    try {
      await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'respond-request', email: user.email, fromEmailHash, accept }),
      });
      setRequests(prev => prev.filter(r => r.fromEmailHash !== fromEmailHash));
      if (accept) loadFriends(user.email);
    } catch (e) {
      console.error('Respond error:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const removeFriend = async (targetEmailHash) => {
    if (!confirm('Remove this friend?')) return;
    setActionLoading(targetEmailHash);
    try {
      await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', email: user.email, targetEmailHash }),
      });
      setFriends(prev => prev.filter(f => f.emailHash !== targetEmailHash));
    } catch (e) {
      console.error('Remove error:', e);
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <Users className="w-16 h-16 text-court mx-auto mb-4 opacity-50" />
        <h2 className="text-2xl font-display font-bold text-foreground mb-3">Friends</h2>
        <p className="text-muted-foreground mb-6">Log in to connect with other players</p>
        <Link href="/login">
          <span className="inline-flex items-center gap-2 bg-gradient-court text-white px-6 py-3 rounded-xl font-bold shadow-elevated hover:scale-105 transition-all duration-300 cursor-pointer">
            Log In
          </span>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'friends', label: 'My Friends', icon: Users, count: friends.length },
    { id: 'find', label: 'Find Friends', icon: Search },
    { id: 'requests', label: 'Requests', icon: Bell, count: requests.length },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">Friends</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200 ${
              tab === t.id
                ? 'bg-court text-white shadow-md'
                : 'bg-white/60 text-foreground hover:bg-white/80 border border-white/50'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                tab === t.id ? 'bg-white/30 text-white' : 'bg-court/20 text-court'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* My Friends */}
      {tab === 'friends' && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-court mx-auto animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground mb-3">No friends yet</p>
              <button
                onClick={() => setTab('find')}
                className="text-court font-semibold hover:underline"
              >
                Find friends to add
              </button>
            </div>
          ) : (
            friends.map(friend => (
              <div
                key={friend.emailHash}
                className="flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-soft hover:shadow-elevated transition-all duration-200"
              >
                {friend.avatarUrl ? (
                  <img src={friend.avatarUrl} alt={friend.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-court/20 flex items-center justify-center text-court font-bold text-lg flex-shrink-0">
                    {friend.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/friends/${friend.emailHash}`}>
                    <span className="font-semibold text-foreground hover:text-court transition-colors cursor-pointer">
                      {friend.name}
                    </span>
                  </Link>
                  <p className="text-sm text-muted-foreground truncate">{friend.email}</p>
                </div>
                <button
                  onClick={() => removeFriend(friend.emailHash)}
                  disabled={actionLoading === friend.emailHash}
                  className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                  title="Remove friend"
                >
                  {actionLoading === friend.emailHash ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserMinus className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Find Friends */}
      {tab === 'find' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Search by name or email..."
              className="flex-1 px-4 py-3 bg-white/70 backdrop-blur-sm rounded-xl border border-white/50 focus:outline-none focus:ring-2 focus:ring-court/50 text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-5 py-3 bg-court text-white rounded-xl font-semibold hover:bg-court/90 transition-colors disabled:opacity-50"
            >
              {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3">
              {searchResults.map(result => {
                const isFriend = friends.some(f => f.emailHash === result.emailHash);
                return (
                  <div
                    key={result.emailHash}
                    className="flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50"
                  >
                    {result.avatarUrl ? (
                      <img src={result.avatarUrl} alt={result.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-ball/20 flex items-center justify-center text-foreground font-bold text-lg flex-shrink-0">
                        {result.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{result.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{result.email}</p>
                      {(result.level || result.duprRating) && (
                        <span className="text-xs text-court capitalize">
                          {result.level}{result.duprRating ? ` · DUPR ${Number(result.duprRating).toFixed(3)}` : ''}
                        </span>
                      )}
                    </div>
                    {isFriend ? (
                      <span className="text-sm text-court font-semibold">Friends</span>
                    ) : (
                      <button
                        onClick={() => sendRequest(result)}
                        disabled={actionLoading === result.emailHash}
                        className="flex items-center gap-1.5 px-4 py-2 bg-court text-white rounded-lg font-semibold text-sm hover:bg-court/90 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === result.emailHash ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !searching && (
            <div className="text-center py-8 text-muted-foreground">
              No results found. Try a different search term.
            </div>
          )}
        </div>
      )}

      {/* Requests */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No pending friend requests</p>
            </div>
          ) : (
            requests.map(req => (
              <div
                key={req.fromEmailHash}
                className="flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50"
              >
                <div className="w-10 h-10 rounded-full bg-court/20 flex items-center justify-center text-court font-bold text-lg flex-shrink-0">
                  {req.fromName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{req.fromName}</p>
                  <p className="text-sm text-muted-foreground truncate">{req.fromEmail}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondToRequest(req.fromEmailHash, true)}
                    disabled={actionLoading === req.fromEmailHash}
                    className="p-2.5 bg-court text-white rounded-lg hover:bg-court/90 transition-colors disabled:opacity-50"
                    title="Accept"
                  >
                    {actionLoading === req.fromEmailHash ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => respondToRequest(req.fromEmailHash, false)}
                    disabled={actionLoading === req.fromEmailHash}
                    className="p-2.5 bg-white/70 text-muted-foreground rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors border border-white/50 disabled:opacity-50"
                    title="Decline"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
