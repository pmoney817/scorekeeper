import { useState, useRef, useEffect } from 'react';
import { Trophy, Zap, ArrowRight, Sparkles, Target, Menu, X } from 'lucide-react';
import Link from 'next/link';
import AffirmationCard from './AffirmationCard';
import DrillCard from './DrillCard';

export default function HomePage() {
  const [activeSection, setActiveSection] = useState('affirmation');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/pickleball-hero.jpg"
          alt="Pickleball court"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Menu */}
        <div ref={menuRef} className="absolute top-5 left-5 z-20 animate-fade-in-up">
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
              <button
                onClick={() => { setActiveSection('affirmation'); setMenuOpen(false); document.getElementById('daily-content')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="flex items-center gap-3 px-5 py-3 hover:bg-ball/10 transition-colors w-full"
              >
                <Sparkles className="w-5 h-5 text-ball" />
                <span className="font-semibold text-foreground text-sm">Affirmations</span>
              </button>
              <button
                onClick={() => { setActiveSection('drill'); setMenuOpen(false); document.getElementById('daily-content')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="flex items-center gap-3 px-5 py-3 hover:bg-court/10 transition-colors w-full"
              >
                <Target className="w-5 h-5 text-court" />
                <span className="font-semibold text-foreground text-sm">Practice Drills</span>
              </button>
            </div>
          )}
        </div>

        {/* Hero Section */}
        <section className="px-4 md:px-8 pt-6 pb-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center">
              {/* Logo centered */}
              <div className="animate-fade-in-up mb-4">
                <img src="/pickleball-vibes-logo.png" alt="Pickleball Vibes logo" className="h-56 w-56 md:h-72 md:w-72 object-contain drop-shadow-md" />
              </div>

              {/* Hero text */}
              <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="inline-flex items-center gap-2 bg-ball/20 text-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-ball/30">
                  <Zap className="w-4 h-4 text-ball" />
                  Daily motivation for players
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-5 leading-tight">
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
                  <button
                    onClick={() => {
                      document.getElementById('daily-content')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center justify-center gap-2 bg-white/70 backdrop-blur-sm text-foreground px-8 py-4 rounded-2xl font-semibold shadow-soft hover:bg-white/90 transition-all duration-300 border border-white/50 text-lg"
                  >
                    <Sparkles className="w-5 h-5 text-ball" />
                    Daily Vibes
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="px-4 md:px-8 pb-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Trophy, title: 'Tournament Manager', desc: 'Round robin, brackets, pool play, ladder leagues', color: 'court', href: '/tournament' },
              { icon: Sparkles, title: 'Daily Affirmations', desc: 'Start every session with the right mindset', color: 'ball', action: () => { setActiveSection('affirmation'); document.getElementById('daily-content')?.scrollIntoView({ behavior: 'smooth' }); } },
              { icon: Target, title: 'Practice Drills', desc: 'Beginner to advanced drills with step-by-step guides', color: 'court', action: () => { setActiveSection('drill'); document.getElementById('daily-content')?.scrollIntoView({ behavior: 'smooth' }); } },
            ].map((feature, i) => {
              const inner = (
                <div
                  key={i}
                  className="group bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-soft hover:shadow-elevated hover:bg-white/80 transition-all duration-300 cursor-pointer hover:-translate-y-1 animate-fade-in-up"
                  style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                  onClick={feature.action || undefined}
                >
                  <div className={`inline-flex p-3 rounded-xl mb-3 ${feature.color === 'ball' ? 'bg-ball/20' : 'bg-court/10'}`}>
                    <feature.icon className={`w-6 h-6 ${feature.color === 'ball' ? 'text-foreground' : 'text-court'}`} />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground font-body">{feature.desc}</p>
                </div>
              );
              return feature.href ? <Link key={i} href={feature.href}>{inner}</Link> : <div key={i}>{inner}</div>;
            })}
          </div>
        </section>

        {/* Daily Content Section */}
        <section id="daily-content" className="px-4 md:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-8 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                Your Daily <span className="text-gradient-court">Vibes</span>
              </h2>
              <p className="text-muted-foreground font-body max-w-md mx-auto">
                Fuel your mindset and sharpen your game every single day
              </p>
            </div>

            {/* Toggle tabs */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-white/60 backdrop-blur-md rounded-2xl p-1.5 border border-white/50 shadow-soft">
                <button
                  onClick={() => setActiveSection('affirmation')}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    activeSection === 'affirmation'
                      ? 'bg-gradient-court text-white shadow-soft'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Affirmation
                  </span>
                </button>
                <button
                  onClick={() => setActiveSection('drill')}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    activeSection === 'drill'
                      ? 'bg-gradient-court text-white shadow-soft'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Practice Drill
                  </span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto">
              <div className={`transition-all duration-500 ${activeSection === 'affirmation' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'}`}>
                <AffirmationCard />
              </div>
              <div className={`transition-all duration-500 ${activeSection === 'drill' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'}`}>
                <DrillCard />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/pickleball-vibes-logo.png" alt="Logo" className="h-8 w-8 object-contain opacity-60" />
              <p className="text-sm text-muted-foreground font-body">
                Made with love for pickleball enthusiasts
              </p>
            </div>
            <Link href="/tournament">
              <span className="text-sm text-court font-semibold hover:underline cursor-pointer">
                Launch Tournament Manager
              </span>
            </Link>
          </div>
        </footer>
      </div>

      {/* Decorative floating elements */}
      <div className="absolute top-32 left-[8%] w-5 h-5 bg-ball rounded-full opacity-40 animate-float" />
      <div className="absolute top-60 right-[12%] w-3 h-3 bg-court rounded-full opacity-30 animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-60 left-[15%] w-4 h-4 bg-ball rounded-full opacity-35 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-32 right-[10%] w-2 h-2 bg-court rounded-full opacity-25 animate-float" style={{ animationDelay: '3s' }} />
      <div className="absolute top-[45%] left-[5%] w-3 h-3 bg-ball/60 rounded-full opacity-30 animate-float" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-[55%] right-[6%] w-4 h-4 bg-court/40 rounded-full opacity-20 animate-float" style={{ animationDelay: '2.5s' }} />
    </div>
  );
}
