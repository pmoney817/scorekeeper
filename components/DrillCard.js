import { useState, useEffect } from 'react';
import { Shuffle, Clock, Target, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import { getRandomDrill, getDrillsByLevel } from '../data/drills';

export default function DrillCard() {
  const [drill, setDrill] = useState(null);
  const [activeLevel, setActiveLevel] = useState('beginner');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    setDrill(getRandomDrill('beginner'));
  }, []);

  const handleNewDrill = () => {
    setIsAnimating(true);
    setShowSteps(false);
    setTimeout(() => {
      setDrill(getRandomDrill(activeLevel));
      setIsAnimating(false);
    }, 300);
  };

  const handleLevelChange = (level) => {
    setActiveLevel(level);
    setIsAnimating(true);
    setShowSteps(false);
    setTimeout(() => {
      setDrill(getRandomDrill(level));
      setIsAnimating(false);
    }, 300);
  };

  const levels = ['beginner', 'intermediate', 'advanced'];
  const levelColors = {
    beginner: 'bg-emerald-500',
    intermediate: 'bg-amber-500',
    advanced: 'bg-rose-500',
  };

  if (!drill) return null;

  return (
    <div className="w-full">
      {/* Level tabs */}
      <div className="flex bg-white/50 backdrop-blur-sm rounded-2xl p-1.5 mb-4 border border-white/40 shadow-soft">
        {levels.map(level => (
          <button
            key={level}
            onClick={() => handleLevelChange(level)}
            className={`flex-1 text-xs md:text-sm font-semibold py-2.5 px-3 rounded-xl transition-all duration-300 capitalize ${
              activeLevel === level
                ? 'bg-white text-foreground shadow-elevated'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${levelColors[level]}`} />
              {level}
            </span>
          </button>
        ))}
      </div>

      <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-elevated p-6 md:p-8 border border-white/50 overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 left-0 w-28 h-28 bg-gradient-court opacity-5 rounded-full -translate-y-1/2 -translate-x-1/2" />

        {/* Header icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-court p-3.5 rounded-2xl shadow-soft">
            <Target className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Drill content */}
        <div
          className={`transition-all duration-300 ${
            isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          <h3 className="text-xl md:text-2xl font-display font-bold text-center text-foreground mb-3">
            {drill.name}
          </h3>

          {/* Tags */}
          <div className="flex justify-center gap-2 mb-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-court/10 text-court rounded-xl text-xs font-semibold border border-court/20">
              <Dumbbell className="w-3 h-3" />
              {drill.focus}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ball/15 text-foreground rounded-xl text-xs font-semibold border border-ball/25">
              <Clock className="w-3 h-3" />
              {drill.duration}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold capitalize ${
              drill.level === 'beginner' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              drill.level === 'intermediate' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {drill.level}
            </span>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-center font-body leading-relaxed mb-4 text-sm">
            {drill.description}
          </p>

          {/* Steps toggle */}
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-court hover:opacity-80 transition-colors font-semibold text-sm rounded-xl hover:bg-court/5"
          >
            {showSteps ? (
              <>Hide Directions <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>Show Directions <ChevronDown className="w-4 h-4" /></>
            )}
          </button>

          {/* Steps list */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
              showSteps ? 'max-h-[600px] opacity-100 mt-3' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="bg-white/60 rounded-2xl p-5 border border-border/20">
              <ol className="space-y-3">
                {drill.steps.map((step, index) => (
                  <li key={index} className="flex gap-3 text-sm font-body">
                    <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-gradient-court text-white flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-foreground/85 pt-0.5 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleNewDrill}
            disabled={isAnimating}
            className="group inline-flex items-center gap-2 bg-gradient-court text-white px-6 py-3 rounded-xl font-semibold shadow-soft hover:shadow-elevated hover:scale-105 transition-all duration-300 disabled:opacity-50"
          >
            <Shuffle
              className={`w-4 h-4 transition-transform duration-300 ${
                isAnimating ? 'animate-spin' : 'group-hover:rotate-180'
              }`}
            />
            Random Drill
          </button>
        </div>
      </div>

      <p className="text-center text-muted-foreground mt-4 text-sm font-body">
        Never wonder what to practice again
      </p>
    </div>
  );
}
