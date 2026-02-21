import { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, Quote } from 'lucide-react';
import { getRandomAffirmation, getDailyAffirmation } from '../data/affirmations';

export default function AffirmationCard() {
  const [affirmation, setAffirmation] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setAffirmation(getDailyAffirmation());
  }, []);

  const handleNewAffirmation = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setAffirmation(getRandomAffirmation());
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="w-full">
      <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-elevated p-8 md:p-10 border border-white/50 overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-sunny opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-court opacity-5 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Quote icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-sunny p-3.5 rounded-2xl shadow-glow">
            <Sparkles className="w-6 h-6 text-foreground" />
          </div>
        </div>

        {/* Affirmation text */}
        <div className="min-h-[100px] flex items-center justify-center relative">
          <Quote className="absolute top-0 left-2 w-8 h-8 text-court/10" />
          <p
            className={`text-xl md:text-2xl lg:text-3xl font-display font-semibold text-center text-foreground leading-relaxed transition-all duration-300 px-4 ${
              isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            {affirmation}
          </p>
        </div>

        {/* Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleNewAffirmation}
            disabled={isAnimating}
            className="group inline-flex items-center gap-2 bg-gradient-court text-white px-6 py-3 rounded-xl font-semibold shadow-soft hover:shadow-elevated hover:scale-105 transition-all duration-300 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 transition-transform duration-500 ${
                isAnimating ? 'animate-spin' : 'group-hover:rotate-180'
              }`}
            />
            New Affirmation
          </button>
        </div>
      </div>

      <p className="text-center text-muted-foreground mt-4 text-sm font-body">
        Your dose of pickleball positivity
      </p>
    </div>
  );
}
