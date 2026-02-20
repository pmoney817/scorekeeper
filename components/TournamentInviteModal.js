import { useState, useEffect } from 'react';
import { X as XIcon, Send, Loader2, Users, Check } from 'lucide-react';

export default function TournamentInviteModal({ onClose, tournamentName, shareCode }) {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [sent, setSent] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pickleball-user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        loadFriends(u.email);
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

  const sendInvite = async (friend) => {
    setSending(friend.emailHash);
    try {
      await fetch('/api/tournament-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          email: user.email,
          targetEmailHash: friend.emailHash,
          targetEmail: friend.email,
          targetName: friend.name,
          tournamentName,
          shareCode,
        }),
      });
      setSent(prev => [...prev, friend.emailHash]);
    } catch (e) {
      console.error('Send invite error:', e);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md max-h-[80vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-display font-bold text-foreground">Invite Friends</h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {!user ? (
            <p className="text-center text-muted-foreground py-6">Log in to invite friends</p>
          ) : loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 text-court mx-auto animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">No friends to invite yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map(friend => {
                const isSent = sent.includes(friend.emailHash);
                return (
                  <div
                    key={friend.emailHash}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-court/20 flex items-center justify-center text-court font-bold text-sm flex-shrink-0">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{friend.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{friend.email}</p>
                    </div>
                    {isSent ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-court">
                        <Check className="w-3.5 h-3.5" />
                        Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => sendInvite(friend)}
                        disabled={sending === friend.emailHash}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-court text-white rounded-lg font-semibold text-xs hover:bg-court/90 transition-colors disabled:opacity-50"
                      >
                        {sending === friend.emailHash ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        Invite
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
