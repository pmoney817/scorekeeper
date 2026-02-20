import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Trophy, Calendar, Loader2, Star } from 'lucide-react';

export default function FriendProfile({ emailHash }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!emailHash) return;
    loadProfile();
  }, [emailHash]);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', emailHash }),
      });
      if (!res.ok) {
        setError('Profile not found');
        return;
      }
      const data = await res.json();
      setProfile(data.profile);
    } catch (e) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const formatYearsPlaying = (val) => {
    const map = {
      'less-than-6-months': 'Less than 6 months',
      '6-months-to-1-year': '6 months - 1 year',
      '1-2-years': '1-2 years',
      '2-5-years': '2-5 years',
      '5-plus-years': '5+ years',
    };
    return map[val] || val;
  };

  const formatTimesPerWeek = (val) => {
    if (val === '5+') return '5+ times/week';
    return `${val} time${val === '1' ? '' : 's'}/week`;
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <Loader2 className="w-8 h-8 text-court mx-auto animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <User className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground mb-4">{error || 'Profile not found'}</p>
        <Link href="/friends">
          <span className="text-court font-semibold hover:underline cursor-pointer">Back to Friends</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/friends">
        <span className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Friends
        </span>
      </Link>

      {/* Profile Header */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft mb-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-court/20 flex items-center justify-center text-court font-bold text-2xl flex-shrink-0">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{profile.name}</h1>
            <p className="text-muted-foreground">{profile.email}</p>
            {profile.bio && (
              <p className="text-foreground mt-2">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {profile.duprRating && (
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 text-center">
            <Star className="w-6 h-6 text-ball mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">DUPR Rating</p>
            <p className="font-bold text-foreground text-lg">{Number(profile.duprRating).toFixed(3)}</p>
          </div>
        )}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 text-center">
          <Trophy className="w-6 h-6 text-court mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Level</p>
          <p className="font-semibold text-foreground capitalize">{profile.level}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 text-center">
          <Calendar className="w-6 h-6 text-court mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Experience</p>
          <p className="font-semibold text-foreground">{formatYearsPlaying(profile.yearsPlaying)}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 text-center">
          <User className="w-6 h-6 text-court mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Play Frequency</p>
          <p className="font-semibold text-foreground">{formatTimesPerWeek(profile.timesPerWeek)}</p>
        </div>
      </div>

      {/* Member Since */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
        <p className="text-sm text-muted-foreground">
          Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
