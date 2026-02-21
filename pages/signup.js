import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { UserPlus, Eye, EyeOff, Lock } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dob, setDob] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [level, setLevel] = useState('');
  const [timesPerWeek, setTimesPerWeek] = useState('');
  const [yearsPlaying, setYearsPlaying] = useState('');
  const [duprRating, setDuprRating] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync dropdowns into dob string (YYYY-MM-DD)
  useEffect(() => {
    if (dobMonth && dobDay && dobYear) {
      setDob(`${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`);
    } else {
      setDob('');
    }
  }, [dobMonth, dobDay, dobYear]);

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const daysInMonth = dobMonth && dobYear
    ? new Date(parseInt(dobYear), parseInt(dobMonth), 0).getDate()
    : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!dob || !level || !timesPerWeek || !yearsPlaying || !securityQuestion || !securityAnswer.trim()) {
      setError('Please fill out all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          name,
          email,
          password,
          dob,
          level,
          timesPerWeek,
          yearsPlaying,
          duprRating: duprRating ? parseFloat(duprRating) : null,
          securityQuestion,
          securityAnswer: securityAnswer.trim(),
        }),
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

  const inputClass = "w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-court/50 focus:border-court/30 text-foreground placeholder-muted-foreground font-body transition-all duration-200";
  const selectClass = "w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-court/50 focus:border-court/30 text-foreground font-body transition-all duration-200 appearance-none";

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
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Logo */}
        <div className="px-4 md:px-8 pt-5 pb-2 flex justify-center animate-fade-in-up">
          <Link href="/">
            <img src="/pickleball-vibes-logo.png" alt="Pickleball Vibes" className="h-36 w-36 md:h-48 md:w-48 object-contain drop-shadow-md cursor-pointer hover:scale-105 transition-transform duration-300" />
          </Link>
        </div>

        {/* Heading outside card */}
        <div className="text-center mb-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-1">
            Join <span className="text-gradient-court">Pickleball Vibes</span>
          </h1>
          <p className="text-muted-foreground font-body text-base">
            Create your account and start playing
          </p>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-start justify-center px-4 md:px-8 py-4 pb-8">
          <div className="w-full max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-body mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Section 1: Account Info */}
              <div className="relative bg-white/70 backdrop-blur-md rounded-2xl shadow-elevated p-6 md:p-8 border border-white/50 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-court opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-gradient-court p-2.5 rounded-xl shadow-soft">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-display font-bold text-foreground">Account Info</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">Date of Birth</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={dobMonth}
                      onChange={(e) => setDobMonth(e.target.value)}
                      className={selectClass}
                    >
                      <option value="" disabled>Month</option>
                      {months.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <select
                      value={dobDay}
                      onChange={(e) => setDobDay(e.target.value)}
                      className={selectClass}
                    >
                      <option value="" disabled>Day</option>
                      {days.map(d => (
                        <option key={d} value={String(d)}>{d}</option>
                      ))}
                    </select>
                    <select
                      value={dobYear}
                      onChange={(e) => setDobYear(e.target.value)}
                      className={selectClass}
                    >
                      <option value="" disabled>Year</option>
                      {years.map(y => (
                        <option key={y} value={String(y)}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Player Profile */}
              <div className="relative bg-white/70 backdrop-blur-md rounded-2xl shadow-elevated p-6 md:p-8 border border-white/50 overflow-hidden">
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-sunny opacity-8 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-gradient-sunny p-2.5 rounded-xl shadow-soft">
                    <span className="text-foreground text-lg">&#127955;</span>
                  </div>
                  <h2 className="text-lg font-display font-bold text-foreground">Player Profile</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">Skill Level</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      required
                      className={selectClass}
                    >
                      <option value="" disabled>Select your level</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
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
                    <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">How often do you play?</label>
                    <select
                      value={timesPerWeek}
                      onChange={(e) => setTimesPerWeek(e.target.value)}
                      required
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
                    <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">How long have you played?</label>
                    <select
                      value={yearsPlaying}
                      onChange={(e) => setYearsPlaying(e.target.value)}
                      required
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
              </div>

              {/* Section 3: Security */}
              <div className="relative bg-white/70 backdrop-blur-md rounded-2xl shadow-elevated p-6 md:p-8 border border-white/50 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-court opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-gradient-court p-2.5 rounded-xl shadow-soft">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-display font-bold text-foreground">Security</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          required
                          className={`${inputClass} pr-12`}
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
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">Confirm Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">Security Question</label>
                    <select
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                      required
                      className={selectClass}
                    >
                      <option value="" disabled>Select a security question</option>
                      <option value="What city were you born in?">What city were you born in?</option>
                      <option value="What is the name of your first pet?">What is the name of your first pet?</option>
                      <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                      <option value="What was the name of your first school?">What was the name of your first school?</option>
                      <option value="What is your favorite sports team?">What is your favorite sports team?</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">Security Answer</label>
                    <input
                      type="text"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      placeholder="Your answer"
                      required
                      className={inputClass}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Used to verify your identity when resetting your password</p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-court text-white py-4 rounded-2xl font-bold shadow-elevated hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 text-lg disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            {/* Login link */}
            <p className="text-center text-muted-foreground font-body text-sm mt-5">
              Already have an account?{' '}
              <Link href="/login">
                <span className="text-court font-semibold hover:underline cursor-pointer">Log In</span>
              </Link>
            </p>
          </div>
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
