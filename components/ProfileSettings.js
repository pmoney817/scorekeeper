import { useState, useEffect, useRef } from 'react';
import { Camera, Loader2, Save } from 'lucide-react';

async function hashEmail(email) {
  const msgBuffer = new TextEncoder().encode(email.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function ProfileSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Editable fields
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [duprRating, setDuprRating] = useState('');
  const [level, setLevel] = useState('');
  const [timesPerWeek, setTimesPerWeek] = useState('');
  const [yearsPlaying, setYearsPlaying] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pickleball-user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        setName(u.name || '');
        setDuprRating(u.duprRating ? String(u.duprRating) : '');
        setLevel(u.level || '');
        setTimesPerWeek(u.timesPerWeek || '');
        setYearsPlaying(u.yearsPlaying || '');
        setAvatarUrl(u.avatarUrl || null);
        loadProfile(u.email);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  const loadProfile = async (email) => {
    try {
      const emailHash = await hashEmail(email);
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', emailHash }),
      });
      if (res.ok) {
        const data = await res.json();
        setBio(data.profile.bio || '');
        if (data.profile.avatarUrl) setAvatarUrl(data.profile.avatarUrl);
      }
    } catch (e) {
      console.error('Load profile error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please select a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate size
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.');
      return;
    }

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setError('');
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('email', user.email);
      formData.append('avatar', file);

      const res = await fetch('/api/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed');
        setAvatarPreview(null);
        return;
      }

      setAvatarUrl(data.avatarUrl);
      setAvatarPreview(null);

      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('pickleball-user') || '{}');
      stored.avatarUrl = data.avatarUrl;
      localStorage.setItem('pickleball-user', JSON.stringify(stored));
      setUser(stored);
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError('Failed to upload avatar. Please try again.');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          email: user.email,
          name,
          bio,
          duprRating: duprRating ? parseFloat(duprRating) : null,
          level,
          timesPerWeek,
          yearsPlaying,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Save failed');
        return;
      }

      // Update localStorage with new user fields
      const stored = JSON.parse(localStorage.getItem('pickleball-user') || '{}');
      stored.name = name;
      stored.duprRating = duprRating ? parseFloat(duprRating) : null;
      stored.level = level;
      stored.timesPerWeek = timesPerWeek;
      stored.yearsPlaying = yearsPlaying;
      localStorage.setItem('pickleball-user', JSON.stringify(stored));
      setUser(stored);

      setSuccess('Profile saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <Loader2 className="w-8 h-8 text-court mx-auto animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const displayAvatar = avatarPreview || avatarUrl;
  const inputClass = "w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-court/50 focus:border-court/30 text-foreground placeholder-muted-foreground font-body transition-all duration-200";
  const selectClass = "w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-court/50 focus:border-court/30 text-foreground font-body transition-all duration-200 appearance-none";

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">Profile Settings</h1>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-body mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-body mb-4">
          {success}
        </div>
      )}

      {/* Avatar Section */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft mb-6">
        <div className="flex flex-col items-center">
          <div
            onClick={handleAvatarClick}
            className="relative w-24 h-24 rounded-full cursor-pointer group"
          >
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-white/50"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-court/20 flex items-center justify-center text-court font-bold text-3xl border-2 border-white/50">
                {name.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {uploadingAvatar ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <p className="text-sm text-muted-foreground mt-2">Click to upload photo</p>
        </div>
      </div>

      {/* Editable Fields */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft mb-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 500))}
            placeholder="Tell others about yourself..."
            rows={3}
            className={`${inputClass} resize-none`}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/500</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">
            DUPR Rating <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            type="number"
            step="0.001"
            min="2.000"
            max="8.000"
            value={duprRating}
            onChange={(e) => setDuprRating(e.target.value)}
            placeholder="e.g. 3.500"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">Skill Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className={selectClass}
          >
            <option value="" disabled>Select your level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">How often do you play?</label>
          <select
            value={timesPerWeek}
            onChange={(e) => setTimesPerWeek(e.target.value)}
            className={selectClass}
          >
            <option value="" disabled>Times per week</option>
            <option value="1">1 time per week</option>
            <option value="2">2 times per week</option>
            <option value="3">3 times per week</option>
            <option value="4">4 times per week</option>
            <option value="5+">5+ times per week</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">How long have you been playing?</label>
          <select
            value={yearsPlaying}
            onChange={(e) => setYearsPlaying(e.target.value)}
            className={selectClass}
          >
            <option value="" disabled>Select experience</option>
            <option value="less-than-6-months">Less than 6 months</option>
            <option value="6-months-to-1-year">6 months - 1 year</option>
            <option value="1-2-years">1 - 2 years</option>
            <option value="2-5-years">2 - 5 years</option>
            <option value="5-plus-years">5+ years</option>
          </select>
        </div>
      </div>

      {/* Read-only Fields */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft mb-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">Email</label>
          <input
            type="email"
            value={user.email}
            disabled
            className={`${inputClass} opacity-60 cursor-not-allowed`}
          />
        </div>

        {user.createdAt && (
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">Member Since</label>
            <input
              type="text"
              value={new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              disabled
              className={`${inputClass} opacity-60 cursor-not-allowed`}
            />
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gradient-court text-white py-3.5 rounded-xl font-bold shadow-soft hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 text-lg disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Changes
          </>
        )}
      </button>
    </div>
  );
}
