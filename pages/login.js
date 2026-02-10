import { useState } from 'react';
import Link from 'next/link';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Login coming soon!');
  };

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
        <div className="px-4 md:px-8 pt-5 pb-4">
          <Link href="/">
            <img src="/pickleball-vibes-logo.png" alt="Pickleball Vibes" className="h-64 w-64 md:h-80 md:w-80 object-contain drop-shadow-md cursor-pointer hover:scale-105 transition-transform duration-300" />
          </Link>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-4 md:px-8 py-8">
          <div className="w-full max-w-md animate-fade-in-up">
            <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-elevated p-8 md:p-10 border border-white/50 overflow-hidden">
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-court opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-sunny opacity-10 rounded-full translate-y-1/2 -translate-x-1/2" />

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-court p-3.5 rounded-2xl shadow-soft">
                  <Lock className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Heading */}
              <h1 className="text-2xl md:text-3xl font-display font-bold text-center text-foreground mb-2">
                Welcome Back
              </h1>
              <p className="text-center text-muted-foreground font-body text-sm mb-8">
                Sign in to your account
              </p>

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
                  className="w-full bg-gradient-court text-white py-3.5 rounded-xl font-bold shadow-soft hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 text-lg"
                >
                  Log In
                </button>
              </form>

              {/* Sign up link */}
              <p className="text-center text-muted-foreground font-body text-sm mt-6">
                Don't have an account?{' '}
                <Link href="/signup">
                  <span className="text-court font-semibold hover:underline cursor-pointer">Sign Up</span>
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
