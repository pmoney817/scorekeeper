import { useState, useEffect } from 'react';
import { Trophy, Swords, Users, Loader2, Activity } from 'lucide-react';

export default function ActivityFeed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pickleball-user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        loadFeed(u.email);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  const loadFeed = async (email) => {
    try {
      const res = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'feed', email }),
      });
      const data = await res.json();
      if (data.feed) setFeed(data.feed);
    } catch (e) {
      console.error('Load feed error:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'game-complete': return Trophy;
      case 'challenge': return Swords;
      case 'friend-added': return Users;
      default: return Activity;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'game-complete': return 'text-court bg-court/10';
      case 'challenge': return 'text-ball bg-ball/20';
      case 'friend-added': return 'text-blue-500 bg-blue-50';
      default: return 'text-muted-foreground bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-6 h-6 text-court mx-auto animate-spin" />
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="text-center py-8 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50">
        <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground text-sm">No activity yet. Play some games or add friends!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {feed.map(event => {
        const Icon = getEventIcon(event.type);
        const colorClass = getEventColor(event.type);
        return (
          <div
            key={event.id}
            className="flex items-start gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50"
          >
            <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{event.userName}</span>{' '}
                {event.message}
              </p>
              {event.details && (
                <p className="text-xs text-muted-foreground mt-1">{event.details}</p>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
              {formatTime(event.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
