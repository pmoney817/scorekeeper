import { useState, useRef, useEffect } from 'react';
import { Users, Menu, X, LogIn, LogOut, Trophy, Sparkles, Target, Settings } from 'lucide-react';
import FriendRequestBadge from '../../components/FriendRequestBadge';
import FriendsPage from '../../components/FriendsPage';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Friends() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pickleball-user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleScroll = () => { if (menuOpen) setMenuOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('pickleball-user');
    setUser(null);
    router.push('/');
  };

  const Pickleball = ({ size = 60, color = 'yellow', className = '' }) => {
    const colors = color === 'green'
      ? { base: '#4CAF50', light: '#81C784', dark: '#2E7D32', hole: '#1B5E20', edge: '#388E3C' }
      : { base: '#FFD740', light: '#FFED80', dark: '#F9A825', hole: '#E65100', edge: '#FFC107' };
    const id = `pb-${color}-${size}`;
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
        <defs>
          <radialGradient id={`${id}-body`} cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor={colors.light} />
            <stop offset="50%" stopColor={colors.base} />
            <stop offset="100%" stopColor={colors.dark} />
          </radialGradient>
          <radialGradient id={`${id}-highlight`} cx="35%" cy="30%" r="30%">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <filter id={`${id}-shadow`}>
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor={colors.dark} floodOpacity="0.3" />
          </filter>
        </defs>
        <circle cx="50" cy="50" r="47" fill={`url(#${id}-body)`} stroke={colors.edge} strokeWidth="1.5" filter={`url(#${id}-shadow)`} />
        <circle cx="38" cy="22" r="3.8" fill={colors.dark} opacity="0.45" />
        <circle cx="50" cy="18" r="3.5" fill={colors.dark} opacity="0.4" />
        <circle cx="62" cy="22" r="3.8" fill={colors.dark} opacity="0.45" />
        <circle cx="26" cy="33" r="4" fill={colors.dark} opacity="0.5" />
        <circle cx="40" cy="34" r="4.2" fill={colors.dark} opacity="0.5" />
        <circle cx="54" cy="32" r="4" fill={colors.dark} opacity="0.5" />
        <circle cx="68" cy="34" r="3.8" fill={colors.dark} opacity="0.45" />
        <circle cx="20" cy="48" r="3.8" fill={colors.dark} opacity="0.5" />
        <circle cx="34" cy="47" r="4.2" fill={colors.dark} opacity="0.55" />
        <circle cx="50" cy="48" r="4.5" fill={colors.dark} opacity="0.55" />
        <circle cx="66" cy="47" r="4.2" fill={colors.dark} opacity="0.5" />
        <circle cx="78" cy="48" r="3.5" fill={colors.dark} opacity="0.4" />
        <circle cx="24" cy="62" r="4" fill={colors.dark} opacity="0.5" />
        <circle cx="38" cy="61" r="4.2" fill={colors.dark} opacity="0.55" />
        <circle cx="54" cy="62" r="4.2" fill={colors.dark} opacity="0.55" />
        <circle cx="70" cy="61" r="3.8" fill={colors.dark} opacity="0.45" />
        <circle cx="32" cy="74" r="3.8" fill={colors.dark} opacity="0.45" />
        <circle cx="46" cy="75" r="4" fill={colors.dark} opacity="0.5" />
        <circle cx="60" cy="74" r="3.8" fill={colors.dark} opacity="0.45" />
        <circle cx="42" cy="85" r="3.2" fill={colors.dark} opacity="0.35" />
        <circle cx="56" cy="84" r="3" fill={colors.dark} opacity="0.3" />
        <circle cx="50" cy="50" r="46" fill={`url(#${id}-highlight)`} />
        <ellipse cx="55" cy="82" rx="18" ry="5" fill="white" opacity="0.08" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient with court colors */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-court/10 via-background to-ball/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-court/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-ball/10 rounded-full blur-3xl" />
      </div>

      {/* Floating pickleballs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[8%] left-[5%] animate-float" style={{ animationDelay: '0s' }}>
          <Pickleball size={70} color="yellow" className="opacity-25 rotate-12" />
        </div>
        <div className="absolute top-[12%] right-[8%] animate-float" style={{ animationDelay: '1.5s' }}>
          <Pickleball size={55} color="green" className="opacity-20 -rotate-6" />
        </div>
        <div className="absolute top-[38%] left-[3%] animate-float" style={{ animationDelay: '0.8s' }}>
          <Pickleball size={42} color="green" className="opacity-15 rotate-45" />
        </div>
        <div className="absolute top-[52%] right-[4%] animate-float" style={{ animationDelay: '2.2s' }}>
          <Pickleball size={58} color="yellow" className="opacity-20 -rotate-[20deg]" />
        </div>
        <div className="absolute top-[72%] left-[8%] animate-float" style={{ animationDelay: '3s' }}>
          <Pickleball size={48} color="yellow" className="opacity-18 rotate-[30deg]" />
        </div>
        <div className="absolute top-[68%] right-[12%] animate-float" style={{ animationDelay: '1s' }}>
          <Pickleball size={38} color="green" className="opacity-15 -rotate-45" />
        </div>
        <div className="absolute top-[28%] right-[18%] animate-float" style={{ animationDelay: '2.5s' }}>
          <Pickleball size={32} color="yellow" className="opacity-12 rotate-[15deg]" />
        </div>
        <div className="absolute top-[85%] left-[35%] animate-float" style={{ animationDelay: '0.5s' }}>
          <Pickleball size={50} color="green" className="opacity-15 -rotate-12" />
        </div>
        <div className="absolute top-[45%] left-[85%] animate-float" style={{ animationDelay: '1.8s' }}>
          <Pickleball size={44} color="green" className="opacity-12 rotate-[60deg]" />
        </div>
        <div className="absolute top-[5%] left-[45%] animate-float" style={{ animationDelay: '3.5s' }}>
          <Pickleball size={36} color="yellow" className="opacity-15 -rotate-[35deg]" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top bar: Menu + Login/Logout */}
        <div className="px-4 md:px-8 pt-5 pb-4 animate-fade-in-up relative z-50">
          <div className="flex items-center justify-between">
            <div ref={menuRef} className="relative z-20">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-4 bg-white/70 backdrop-blur-md rounded-xl shadow-soft border border-white/40 hover:bg-white/90 transition-all duration-300"
              >
                {menuOpen ? <X className="w-8 h-8 text-foreground" /> : <Menu className="w-8 h-8 text-foreground" />}
              </button>

              {menuOpen && (
                <div className="absolute top-14 left-0 bg-white/90 backdrop-blur-md rounded-2xl shadow-elevated border border-white/40 py-2 min-w-[200px] animate-scale-in">
                  <div onClick={() => { setMenuOpen(false); router.push('/'); }} className="flex items-center gap-3 px-5 py-3 hover:bg-court/10 transition-colors cursor-pointer">
                    <Sparkles className="w-5 h-5 text-ball" />
                    <span className="font-semibold text-foreground text-sm">Home</span>
                  </div>
                  <div onClick={() => { setMenuOpen(false); router.push('/tournament'); }} className="flex items-center gap-3 px-5 py-3 hover:bg-court/10 transition-colors cursor-pointer">
                    <Trophy className="w-5 h-5 text-court" />
                    <span className="font-semibold text-foreground text-sm">Create Game</span>
                  </div>
                  <div onClick={() => { setMenuOpen(false); router.push('/affirmations'); }} className="flex items-center gap-3 px-5 py-3 hover:bg-ball/10 transition-colors cursor-pointer">
                    <Sparkles className="w-5 h-5 text-ball" />
                    <span className="font-semibold text-foreground text-sm">Pickleball Positivity</span>
                  </div>
                  <div onClick={() => { setMenuOpen(false); router.push('/drills'); }} className="flex items-center gap-3 px-5 py-3 hover:bg-court/10 transition-colors cursor-pointer">
                    <Target className="w-5 h-5 text-court" />
                    <span className="font-semibold text-foreground text-sm">Practice Drills</span>
                  </div>
                  {user && (
                    <div onClick={() => { setMenuOpen(false); router.push('/settings'); }} className="flex items-center gap-3 px-5 py-3 hover:bg-court/10 transition-colors cursor-pointer">
                      <Settings className="w-5 h-5 text-court" />
                      <span className="font-semibold text-foreground text-sm">Settings</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/50"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-court/20 flex items-center justify-center text-court font-bold text-base border-2 border-white/50">
                    {user.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md px-6 py-3 rounded-xl shadow-soft border border-white/40 hover:bg-white/90 transition-all duration-300 cursor-pointer font-semibold text-foreground text-base"
                >
                  <LogOut className="w-5 h-5 text-court" />
                  Log Out
                </button>
              </div>
            ) : (
              <Link href="/login">
                <span className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md px-5 py-2.5 rounded-xl shadow-soft border border-white/40 hover:bg-white/90 transition-all duration-300 cursor-pointer font-semibold text-foreground text-sm">
                  <LogIn className="w-4 h-4 text-court" />
                  Log In
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Logo */}
        <div className="px-4 md:px-8 pt-2 pb-4 flex justify-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Link href="/">
            <img src="/pickleball-vibes-logo.png" alt="Pickleball Vibes" className="h-48 w-48 md:h-64 md:w-64 object-contain drop-shadow-md cursor-pointer hover:scale-105 transition-transform duration-300" />
          </Link>
        </div>

        {/* Page title */}
        <div className="text-center mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 leading-tight">
            Your <span className="text-gradient-court">Friends</span>
          </h1>
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-md text-foreground px-6 py-3 rounded-2xl text-base md:text-lg font-semibold border border-white/50 shadow-soft">
              <Users className="w-5 h-5 text-court" />
              Connect with fellow players
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 px-4 md:px-8 py-4 pb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <FriendsPage />
        </div>

        {/* Footer */}
        <footer className="py-12 px-6 mt-auto">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-4">
            <img src="/pickleball-vibes-logo.png" alt="Logo" className="h-16 w-16 object-contain opacity-60" />
            <p className="text-lg text-muted-foreground font-body">
              Made with love for pickleball enthusiasts
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
