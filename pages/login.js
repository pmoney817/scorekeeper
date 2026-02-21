import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      localStorage.setItem('pickleball-user', JSON.stringify(data.user));
      router.push('/');
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const Pickleball = ({ size = 60, color = 'yellow', className = '' }) => {
    const colors = color === 'green'
      ? { base: '#4CAF50', light: '#81C784', dark: '#2E7D32', edge: '#388E3C' }
      : { base: '#FFD740', light: '#FFED80', dark: '#F9A825', edge: '#FFC107' };
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
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo + Heading */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link href="/">
              <img src="/pickleball-vibes-logo.png" alt="Pickleball Vibes" className="h-32 w-32 md:h-36 md:w-36 object-contain drop-shadow-md cursor-pointer hover:scale-105 transition-transform duration-300" />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Welcome <span className="text-gradient-court">Back</span>
              </h1>
              <p className="text-muted-foreground font-body text-sm">
                Sign in to your account
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-elevated p-8 md:p-10 border border-white/50 overflow-hidden">
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-court opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-sunny opacity-10 rounded-full translate-y-1/2 -translate-x-1/2" />

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-body mb-4">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-court/50 focus:border-court/30 text-foreground placeholder-muted-foreground font-body transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 pr-12 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-court/50 focus:border-court/30 text-foreground placeholder-muted-foreground font-body transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/reset-password">
                  <span className="text-sm text-court font-semibold hover:underline cursor-pointer">
                    Forgot Password?
                  </span>
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-court text-white py-3.5 rounded-xl font-bold shadow-soft hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 text-lg disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? 'Logging In...' : 'Log In'}
              </button>
            </form>

            {/* Sign up link */}
            <p className="text-center text-muted-foreground font-body text-sm mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/signup">
                <span className="text-court font-semibold hover:underline cursor-pointer">Sign Up</span>
              </Link>
            </p>
          </div>

          {/* Footer inline */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <img src="/pickleball-vibes-logo.png" alt="Logo" className="h-10 w-10 object-contain opacity-60" />
            <p className="text-sm text-muted-foreground font-body">
              Made with love for pickleball enthusiasts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
