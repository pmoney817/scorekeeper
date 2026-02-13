import { useState, useEffect, useCallback } from 'react';
import { Shuffle, Clock, Target, ChevronDown, ChevronUp, Dumbbell, Heart, ChevronLeft, ChevronRight, List, CheckCircle, Calendar } from 'lucide-react';
import { getRandomDrill, getDrillsByLevel, pickleballDrills } from '../data/drills';

const FAVORITES_KEY = 'pickleball-drill-favorites';
const COMPLETIONS_KEY = 'pickleball-drill-completions';

function loadFavorites() {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

// completions = { drillId: ["2026-02-12", "2026-02-10", ...] }
function loadCompletions() {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(COMPLETIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveCompletions(completions) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DrillCard() {
  const [drill, setDrill] = useState(null);
  const [activeLevel, setActiveLevel] = useState('beginner');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [completions, setCompletions] = useState({});
  const [viewMode, setViewMode] = useState('random'); // 'random', 'browse', 'favorites', 'history'
  const [browseIndex, setBrowseIndex] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setFavorites(loadFavorites());
    setCompletions(loadCompletions());
    setDrill(getRandomDrill('beginner'));
  }, []);

  const getCurrentDrillList = useCallback(() => {
    if (viewMode === 'favorites') {
      return pickleballDrills.filter(d => favorites.includes(d.id));
    }
    if (viewMode === 'history') {
      return pickleballDrills.filter(d => completions[d.id] && completions[d.id].length > 0);
    }
    return getDrillsByLevel(activeLevel);
  }, [viewMode, activeLevel, favorites, completions]);

  const toggleFavorite = (drillId) => {
    setFavorites(prev => {
      const updated = prev.includes(drillId)
        ? prev.filter(id => id !== drillId)
        : [...prev, drillId];
      saveFavorites(updated);
      return updated;
    });
  };

  const isFavorited = drill ? favorites.includes(drill.id) : false;

  const markDone = (drillId) => {
    const today = getTodayStr();
    setCompletions(prev => {
      const dates = prev[drillId] || [];
      const updated = { ...prev, [drillId]: [today, ...dates] };
      saveCompletions(updated);
      return updated;
    });
    setJustCompleted(true);
    setTimeout(() => setJustCompleted(false), 2000);
  };

  const getDrillCompletions = (drillId) => {
    return completions[drillId] || [];
  };

  const handleNewDrill = () => {
    setIsAnimating(true);
    setShowSteps(false);
    setTimeout(() => {
      if (viewMode === 'favorites') {
        const favDrills = pickleballDrills.filter(d => favorites.includes(d.id));
        if (favDrills.length > 0) {
          setDrill(favDrills[Math.floor(Math.random() * favDrills.length)]);
        }
      } else {
        setDrill(getRandomDrill(activeLevel));
      }
      setIsAnimating(false);
    }, 300);
  };

  const handleLevelChange = (level) => {
    setActiveLevel(level);
    setViewMode('random');
    setIsAnimating(true);
    setShowSteps(false);
    setTimeout(() => {
      setDrill(getRandomDrill(level));
      setIsAnimating(false);
    }, 300);
  };

  const handleViewModeChange = (mode) => {
    if (mode === viewMode) return;
    setViewMode(mode);
    setIsAnimating(true);
    setShowSteps(false);
    setShowHistory(false);

    setTimeout(() => {
      if (mode === 'favorites') {
        const favDrills = pickleballDrills.filter(d => favorites.includes(d.id));
        if (favDrills.length > 0) {
          setBrowseIndex(0);
          setDrill(favDrills[0]);
        } else {
          setDrill(null);
        }
      } else if (mode === 'history') {
        const doneDrills = pickleballDrills.filter(d => completions[d.id] && completions[d.id].length > 0);
        if (doneDrills.length > 0) {
          setBrowseIndex(0);
          setDrill(doneDrills[0]);
        } else {
          setDrill(null);
        }
      } else if (mode === 'browse') {
        const drills = getDrillsByLevel(activeLevel);
        setBrowseIndex(0);
        setDrill(drills[0]);
      } else {
        setDrill(getRandomDrill(activeLevel));
      }
      setIsAnimating(false);
    }, 300);
  };

  const handleBrowse = (direction) => {
    const drills = getCurrentDrillList();
    if (drills.length === 0) return;

    setIsAnimating(true);
    setShowSteps(false);
    setTimeout(() => {
      let newIndex;
      if (direction === 'next') {
        newIndex = (browseIndex + 1) % drills.length;
      } else {
        newIndex = (browseIndex - 1 + drills.length) % drills.length;
      }
      setBrowseIndex(newIndex);
      setDrill(drills[newIndex]);
      setIsAnimating(false);
    }, 300);
  };

  const levels = ['beginner', 'intermediate', 'advanced'];
  const levelColors = {
    beginner: 'bg-emerald-500',
    intermediate: 'bg-amber-500',
    advanced: 'bg-rose-500',
  };

  const currentList = getCurrentDrillList();
  const favCount = favorites.length;
  const completedCount = Object.keys(completions).filter(id => completions[id].length > 0).length;

  return (
    <div className="w-full">
      {/* Level tabs */}
      <div className="flex bg-white/50 backdrop-blur-sm rounded-2xl p-1.5 mb-3 border border-white/40 shadow-soft">
        {levels.map(level => (
          <button
            key={level}
            onClick={() => handleLevelChange(level)}
            className={`flex-1 text-xs md:text-sm font-semibold py-2.5 px-3 rounded-xl transition-all duration-300 capitalize ${
              activeLevel === level && viewMode !== 'favorites' && viewMode !== 'history'
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

      {/* View mode tabs */}
      <div className="flex bg-white/50 backdrop-blur-sm rounded-2xl p-1.5 mb-4 border border-white/40 shadow-soft">
        <button
          onClick={() => handleViewModeChange('random')}
          className={`flex-1 text-xs font-semibold py-2 px-2 rounded-xl transition-all duration-300 ${
            viewMode === 'random'
              ? 'bg-white text-foreground shadow-elevated'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Shuffle className="w-3 h-3" />
            Random
          </span>
        </button>
        <button
          onClick={() => handleViewModeChange('browse')}
          className={`flex-1 text-xs font-semibold py-2 px-2 rounded-xl transition-all duration-300 ${
            viewMode === 'browse'
              ? 'bg-white text-foreground shadow-elevated'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <List className="w-3 h-3" />
            Browse
          </span>
        </button>
        <button
          onClick={() => handleViewModeChange('favorites')}
          className={`flex-1 text-xs font-semibold py-2 px-2 rounded-xl transition-all duration-300 ${
            viewMode === 'favorites'
              ? 'bg-white text-foreground shadow-elevated'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Heart className={`w-3 h-3 ${favCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
            Saved{favCount > 0 ? ` (${favCount})` : ''}
          </span>
        </button>
        <button
          onClick={() => handleViewModeChange('history')}
          className={`flex-1 text-xs font-semibold py-2 px-2 rounded-xl transition-all duration-300 ${
            viewMode === 'history'
              ? 'bg-white text-foreground shadow-elevated'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Calendar className={`w-3 h-3 ${completedCount > 0 ? 'text-emerald-500' : ''}`} />
            Done{completedCount > 0 ? ` (${completedCount})` : ''}
          </span>
        </button>
      </div>

      {/* Empty favorites state */}
      {viewMode === 'favorites' && favCount === 0 && (
        <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-elevated p-8 border border-white/50 text-center">
          <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-display font-bold text-foreground mb-2">No Saved Drills</h3>
          <p className="text-muted-foreground text-sm font-body">
            Tap the heart on any drill to save it here for quick access.
          </p>
        </div>
      )}

      {/* Empty history state */}
      {viewMode === 'history' && completedCount === 0 && (
        <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-elevated p-8 border border-white/50 text-center">
          <CheckCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-display font-bold text-foreground mb-2">No Completed Drills</h3>
          <p className="text-muted-foreground text-sm font-body">
            Tap &quot;Mark Done&quot; after finishing a drill to track your progress.
          </p>
        </div>
      )}

      {/* Drill card */}
      {drill && (
        <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-elevated p-6 md:p-8 border border-white/50 overflow-hidden">
          {/* Background accent */}
          <div className="absolute top-0 left-0 w-28 h-28 bg-gradient-court opacity-5 rounded-full -translate-y-1/2 -translate-x-1/2" />

          {/* Header icon + favorite */}
          <div className="flex justify-center mb-4 relative">
            <div className="bg-gradient-court p-3.5 rounded-2xl shadow-soft">
              <Target className="w-6 h-6 text-white" />
            </div>
            <button
              onClick={() => toggleFavorite(drill.id)}
              className="absolute right-0 top-0 p-2 rounded-xl hover:bg-rose-50 transition-all duration-200"
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-6 h-6 transition-all duration-300 ${
                  isFavorited
                    ? 'fill-rose-500 text-rose-500 scale-110'
                    : 'text-muted-foreground/40 hover:text-rose-400'
                }`}
              />
            </button>
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

          {/* Completion info & Mark Done */}
          <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            {getDrillCompletions(drill.id).length > 0 && (
              <div className="mt-4 mb-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-center gap-2 text-emerald-600 text-xs font-semibold hover:bg-emerald-50 rounded-xl py-1.5 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Done {getDrillCompletions(drill.id).length} time{getDrillCompletions(drill.id).length !== 1 ? 's' : ''}
                  {' - '}Last: {formatDate(getDrillCompletions(drill.id)[0])}
                  {getDrillCompletions(drill.id).length > 1 && (
                    showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
                {showHistory && getDrillCompletions(drill.id).length > 1 && (
                  <div className="mt-2 bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-700 mb-2">Completion History</p>
                    <div className="flex flex-wrap gap-1.5">
                      {getDrillCompletions(drill.id).map((date, i) => (
                        <span key={i} className="text-xs bg-white px-2 py-1 rounded-lg text-emerald-600 border border-emerald-100">
                          {formatDate(date)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-center mt-3">
              <button
                onClick={() => markDone(drill.id)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-105 shadow-soft active:scale-95"
              >
                <CheckCircle className={`w-4 h-4 ${justCompleted ? 'animate-bounce' : ''}`} />
                Mark Done{getDrillCompletions(drill.id).length > 0 ? ` (${getDrillCompletions(drill.id).length})` : ''}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center items-center gap-3 mt-6">
            {(viewMode === 'browse' || viewMode === 'favorites' || viewMode === 'history') && currentList.length > 1 && (
              <button
                onClick={() => handleBrowse('prev')}
                disabled={isAnimating}
                className="p-3 rounded-xl bg-white/80 border border-border/30 text-foreground hover:bg-white hover:shadow-soft transition-all duration-300 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {viewMode === 'random' && (
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
            )}

            {(viewMode === 'browse' || viewMode === 'favorites' || viewMode === 'history') && currentList.length > 0 && (
              <span className="text-sm text-muted-foreground font-body tabular-nums">
                {browseIndex + 1} / {currentList.length}
              </span>
            )}

            {(viewMode === 'browse' || viewMode === 'favorites' || viewMode === 'history') && currentList.length > 1 && (
              <button
                onClick={() => handleBrowse('next')}
                disabled={isAnimating}
                className="p-3 rounded-xl bg-white/80 border border-border/30 text-foreground hover:bg-white hover:shadow-soft transition-all duration-300 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      <p className="text-center text-muted-foreground mt-4 text-sm font-body">
        {viewMode === 'favorites'
          ? favCount > 0
            ? `${favCount} saved drill${favCount !== 1 ? 's' : ''}`
            : ''
          : viewMode === 'history'
            ? completedCount > 0
              ? `${completedCount} drill${completedCount !== 1 ? 's' : ''} completed`
              : ''
            : `${getDrillsByLevel(activeLevel).length} ${activeLevel} drills available`}
      </p>
    </div>
  );
}
