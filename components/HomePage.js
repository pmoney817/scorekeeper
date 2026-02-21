import { useState, useRef, useEffect } from 'react';
import { Trophy, ArrowRight, Sparkles, Target, Menu, X, LogIn, LogOut, Users, Settings } from 'lucide-react';
import FriendRequestBadge from './FriendRequestBadge';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function HomePage() {
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

  // Pickleball SVG component - wiffle ball with holes
  const Pickleball = ({ size = 60, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="48" fill="hsl(var(--ball-yellow))" stroke="hsl(var(--ball-yellow))" strokeWidth="1" opacity="0.9" />
      <circle cx="35" cy="30" r="5" fill="hsl(var(--ball-yellow))" stroke="hsl(var(--foreground))" strokeWidth="0.8" opacity="0.3" />
      <circle cx="55" cy="25" r="4.5" fill="hsl(var(--ball-yellow))" stroke="hsl(var(--foreground))" strokeWidth="0.8" opacity="0.3" />
      <circle cx="70" cy="38" r="5" fill="hsl(var(--ball-yellow))" stroke="hsl(var(--foreground))" strokeWidth="0.8" opacity="0.3" />
      <circle cx="28" cy="50" r="4.5" fill="hsl(var(--ball-yellow))" stroke="hsl(var(--foreground))" strokeWidth="0.8" opacity="0.3" />
      <circle cx="50" cy="48" r="5.5" fill="hsl(var(--ball-yellow))" stroke="hsl(var(--foreground))" strokeWidth="0.8" opacity="0.3" />
      <circle cx="72" cy="55" r="4.5" fill="hsl(var(--ball-yellow))" stroke="hsl(var(--foreground))" strokeWidth="0.8" opacity="0.3" />
      <circle cx="38" cy="68" r="5" fill="hsl(var(--ball-yellow))" stroke="hsl(var(--foreground))" strokeWidth="0.8" opacity="0.3" />
      <circle cx="58" cy="70" r="4.5" fill="hsl(var(--ball-yellow))" stroke="hsl(var(--foreground))" strokeWidth="0.8" opacity="0.3" />
      <circle cx="45" cy="85" r="4" fill="hsl(var(--ball-yellow))" stroke="hsl(var(--foreground))" strokeWidth="0.8" opacity="0.3" />
    </svg>
  );

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
          <Pickleball size={70} className="opacity-20 rotate-12" />
        </div>
        <div className="absolute top-[15%] right-[8%] animate-float" style={{ animationDelay: '1.5s' }}>
          <Pickleball size={50} className="opacity-15 -rotate-6" />
        </div>
        <div className="absolute top-[40%] left-[3%] animate-float" style={{ animationDelay: '0.8s' }}>
          <Pickleball size={40} className="opacity-10 rotate-45" />
        </div>
        <div className="absolute top-[55%] right-[4%] animate-float" style={{ animationDelay: '2.2s' }}>
          <Pickleball size={55} className="opacity-15 -rotate-20" />
        </div>
        <div className="absolute top-[75%] left-[10%] animate-float" style={{ animationDelay: '3s' }}>
          <Pickleball size={45} className="opacity-12 rotate-30" />
        </div>
        <div className="absolute top-[70%] right-[15%] animate-float" style={{ animationDelay: '1s' }}>
          <Pickleball size={35} className="opacity-10 -rotate-45" />
        </div>
        <div className="absolute top-[30%] right-[20%] animate-float" style={{ animationDelay: '2.5s' }}>
          <Pickleball size={30} className="opacity-8 rotate-15" />
        </div>
        <div className="absolute top-[88%] left-[40%] animate-float" style={{ animationDelay: '0.5s' }}>
          <Pickleball size={60} className="opacity-10 -rotate-12" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top bar: Menu + Login/Logout */}
        <div className="px-4 md:px-8 pt-5 pb-4 animate-fade-in-up">
          <div className="flex items-center justify-between">
            {/* Menu */}
            <div ref={menuRef} className="relative z-20">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-3 bg-white/70 backdrop-blur-md rounded-xl shadow-soft border border-white/40 hover:bg-white/90 transition-all duration-300"
              >
                {menuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
              </button>

              {menuOpen && (
                <div className="absolute top-14 left-0 bg-white/90 backdrop-blur-md rounded-2xl shadow-elevated border border-white/40 py-2 min-w-[200px] animate-scale-in">
                  <Link href="/tournament" onClick={() => setMenuOpen(false)}>
                    <div className="flex items-center gap-3 px-5 py-3 hover:bg-court/10 transition-colors cursor-pointer">
                      <Trophy className="w-5 h-5 text-court" />
                      <span className="font-semibold text-foreground text-sm">Create Game</span>
                    </div>
                  </Link>
                  <Link href="/affirmations" onClick={() => setMenuOpen(false)}>
                    <div className="flex items-center gap-3 px-5 py-3 hover:bg-ball/10 transition-colors cursor-pointer">
                      <Sparkles className="w-5 h-5 text-ball" />
                      <span className="font-semibold text-foreground text-sm">Vibes</span>
                    </div>
                  </Link>
                  <Link href="/drills" onClick={() => setMenuOpen(false)}>
                    <div className="flex items-center gap-3 px-5 py-3 hover:bg-court/10 transition-colors cursor-pointer">
                      <Target className="w-5 h-5 text-court" />
                      <span className="font-semibold text-foreground text-sm">Practice Drills</span>
                    </div>
                  </Link>
                  <Link href="/friends" onClick={() => setMenuOpen(false)}>
                    <div className="flex items-center gap-3 px-5 py-3 hover:bg-court/10 transition-colors cursor-pointer relative">
                      <div className="relative">
                        <Users className="w-5 h-5 text-court" />
                        <FriendRequestBadge />
                      </div>
                      <span className="font-semibold text-foreground text-sm">Friends</span>
                    </div>
                  </Link>
                  {user && (
                    <Link href="/settings" onClick={() => setMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-5 py-3 hover:bg-court/10 transition-colors cursor-pointer">
                        <Settings className="w-5 h-5 text-court" />
                        <span className="font-semibold text-foreground text-sm">Settings</span>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Login/Logout button */}
            {user ? (
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white/50"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-court/20 flex items-center justify-center text-court font-bold text-sm border-2 border-white/50">
                    {user.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md px-5 py-2.5 rounded-xl shadow-soft border border-white/40 hover:bg-white/90 transition-all duration-300 cursor-pointer font-semibold text-foreground text-sm"
                >
                  <LogOut className="w-4 h-4 text-court" />
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

        {/* Hero Section with Logo */}
        <section className="px-4 md:px-8 pt-2 pb-10">
          <div className="max-w-6xl mx-auto flex flex-col items-center">
            {/* Logo with glow effect */}
            <div className="relative animate-fade-in-up mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-court/30 via-ball/20 to-court/30 rounded-full blur-2xl scale-110" />
              <div className="relative bg-white/40 backdrop-blur-sm rounded-full p-4 shadow-elevated border border-white/50">
                <img src="/pickleball-vibes-logo.png" alt="Pickleball Vibes logo" className="h-44 w-44 md:h-56 md:w-56 object-contain drop-shadow-lg" />
              </div>
            </div>

            {/* Hero text */}
            <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4 leading-tight">
                Elevate Your
                <br />
                <span className="text-gradient-court">Pickleball</span> Game
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto font-body leading-relaxed mb-8">
                Daily affirmations to fuel your mindset, curated drills to sharpen your skills, and tools to run your tournaments.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/tournament">
                  <span className="inline-flex items-center justify-center gap-2 bg-gradient-court text-white px-8 py-4 rounded-2xl font-bold shadow-elevated hover:scale-105 transition-all duration-300 cursor-pointer text-lg w-full sm:w-auto">
                    <Trophy className="w-5 h-5" />
                    Create Game
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </Link>
                <Link href="/affirmations">
                  <span className="inline-flex items-center justify-center gap-2 bg-white/70 backdrop-blur-sm text-foreground px-8 py-4 rounded-2xl font-semibold shadow-soft hover:bg-white/90 transition-all duration-300 border border-white/50 text-lg w-full sm:w-auto cursor-pointer">
                    <Sparkles className="w-5 h-5 text-ball" />
                    Daily Vibes
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="px-4 md:px-8 pb-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Trophy, title: 'Tournament Manager', desc: 'Round robin, brackets, pool play, ladder leagues', color: 'court', href: '/tournament' },
              { icon: Users, title: 'Friends', desc: 'Connect with players and track activity', color: 'court', href: '/friends' },
              { icon: Sparkles, title: 'Positive Vibes', desc: 'Fuel your mindset', color: 'ball', href: '/affirmations' },
              { icon: Target, title: 'Practice Drills', desc: 'Beginner to advanced drills with step-by-step guides', color: 'court', href: '/drills' },
            ].map((feature, i) => (
              <Link key={i} href={feature.href}>
                <div
                  className="group bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-soft hover:shadow-elevated hover:bg-white/80 transition-all duration-300 cursor-pointer hover:-translate-y-1 animate-fade-in-up"
                  style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                >
                  <div className={`inline-flex p-3 rounded-xl mb-3 ${feature.color === 'ball' ? 'bg-ball/20' : 'bg-court/10'}`}>
                    <feature.icon className={`w-6 h-6 ${feature.color === 'ball' ? 'text-foreground' : 'text-court'}`} />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground font-body">{feature.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

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
