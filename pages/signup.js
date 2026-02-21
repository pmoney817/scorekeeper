import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

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
        {/* Header */}
        <div className="px-4 md:px-8 pt-5 pb-4 flex justify-center">
          <Link href="/">
            <img src="/pickleball-vibes-logo.png" alt="Pickleball Vibes" className="h-64 w-64 md:h-80 md:w-80 object-contain drop-shadow-md cursor-pointer hover:scale-105 transition-transform duration-300" />
          </Link>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-4 md:px-8 py-8">
          <div className="w-full max-w-md animate-fade-in-up">
            <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-elevated p-8 md:p-10 border border-white/50 overflow-hidden">
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-sunny opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-court opacity-5 rounded-full translate-y-1/2 -translate-x-1/2" />

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-court p-3.5 rounded-2xl shadow-soft">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Heading */}
              <h1 className="text-2xl md:text-3xl font-display font-bold text-center text-foreground mb-2">
                Create Account
              </h1>
              <p className="text-center text-muted-foreground font-body text-sm mb-8">
                Join the pickleball community
              </p>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-body mb-4">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div>
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
                  <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">How long have you been playing?</label>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-court text-white py-3.5 rounded-xl font-bold shadow-soft hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 text-lg disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>

              {/* Login link */}
              <p className="text-center text-muted-foreground font-body text-sm mt-6">
                Already have an account?{' '}
                <Link href="/login">
                  <span className="text-court font-semibold hover:underline cursor-pointer">Log In</span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative floating elements */}
      <div className="absolute top-32 left-[8%] w-5 h-5 bg-ball rounded-full opacity-40 animate-float" />
      <div className="absolute top-60 right-[12%] w-3 h-3 bg-court rounded-full opacity-30 animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-60 left-[15%] w-4 h-4 bg-ball rounded-full opacity-35 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-32 right-[10%] w-2 h-2 bg-court rounded-full opacity-25 animate-float" style={{ animationDelay: '3s' }} />
    </div>
  );
}
