import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email'); // 'email', 'password', 'success'
  const [securityQuestion, setSecurityQuestion] = useState(null);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      setSecurityQuestion(data.securityQuestion || null);
      setStep('password');
      setLoading(false);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (securityQuestion && !securityAnswer.trim()) {
      setError('Please answer the security question');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          email,
          newPassword,
          ...(securityQuestion && { securityAnswer: securityAnswer.trim() }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      setStep('success');
      setLoading(false);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-court/50 focus:border-court/30 text-foreground placeholder-muted-foreground font-body transition-all duration-200";

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
                <div className={`p-3.5 rounded-2xl shadow-soft ${step === 'success' ? 'bg-gradient-sunny' : 'bg-gradient-court'}`}>
                  {step === 'success' ? (
                    <CheckCircle className="w-6 h-6 text-foreground" />
                  ) : (
                    <KeyRound className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-body mb-4">
                  {error}
                </div>
              )}

              {step === 'success' && (
                <>
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-center text-foreground mb-3">
                    Password Reset
                  </h1>
                  <p className="text-center text-muted-foreground font-body text-sm mb-8 leading-relaxed">
                    Your password has been updated. You can now log in with your new password.
                  </p>
                  <Link href="/login">
                    <span className="block w-full bg-gradient-court text-white py-3.5 rounded-xl font-bold shadow-soft hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 text-lg text-center cursor-pointer">
                      Log In
                    </span>
                  </Link>
                </>
              )}

              {step === 'email' && (
                <>
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-center text-foreground mb-2">
                    Reset Password
                  </h1>
                  <p className="text-center text-muted-foreground font-body text-sm mb-8 leading-relaxed">
                    Enter your email to reset your password
                  </p>
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-court text-white py-3.5 rounded-xl font-bold shadow-soft hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 text-lg disabled:opacity-50"
                    >
                      {loading ? 'Checking...' : 'Continue'}
                    </button>
                  </form>
                  <p className="text-center text-muted-foreground font-body text-sm mt-6">
                    Remember your password?{' '}
                    <Link href="/login">
                      <span className="text-court font-semibold hover:underline cursor-pointer">Log In</span>
                    </Link>
                  </p>
                </>
              )}

              {step === 'password' && (
                <>
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-center text-foreground mb-2">
                    Reset Password
                  </h1>
                  <p className="text-center text-muted-foreground font-body text-sm mb-8 leading-relaxed">
                    {securityQuestion
                      ? <>Answer your security question and set a new password for <span className="font-semibold text-foreground">{email}</span></>
                      : <>Enter a new password for <span className="font-semibold text-foreground">{email}</span></>
                    }
                  </p>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {securityQuestion && (
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">{securityQuestion}</label>
                        <input
                          type="text"
                          value={securityAnswer}
                          onChange={(e) => setSecurityAnswer(e.target.value)}
                          placeholder="Your answer"
                          required
                          className={inputClass}
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5 font-body">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
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
                        placeholder="Confirm new password"
                        required
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-court text-white py-3.5 rounded-xl font-bold shadow-soft hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 text-lg disabled:opacity-50"
                    >
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </form>
                  <button
                    onClick={() => { setStep('email'); setError(''); }}
                    className="w-full mt-3 text-center text-sm text-court font-semibold hover:underline cursor-pointer py-2"
                  >
                    Use a different email
                  </button>
                </>
              )}
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
