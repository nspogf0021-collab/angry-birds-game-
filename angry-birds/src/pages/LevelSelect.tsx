import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Lock, Star } from "lucide-react";
import { useGetProgress } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

const LEVELS_PER_WORLD = 25;
const TOTAL_WORLDS = 20;

export default function LevelSelect() {
  const [, setLocation] = useLocation();
  const { data: progress } = useGetProgress();
  const [currentWorld, setCurrentWorld] = useState(1);

  const highestLevel = progress?.highestLevel || 1;
  const levelScores = progress?.levelScores || [];

  const getLevelScore = (lvl: number) => levelScores.find(s => s.level === lvl)?.stars || 0;

  const renderLevels = () => {
    const levels = [];
    const startLvl = (currentWorld - 1) * LEVELS_PER_WORLD + 1;
    
    for (let i = 0; i < LEVELS_PER_WORLD; i++) {
      const lvlNum = startLvl + i;
      const isUnlocked = lvlNum <= highestLevel;
      const stars = getLevelScore(lvlNum);

      levels.push(
        <motion.div 
          key={lvlNum}
          whileHover={isUnlocked ? { scale: 1.1 } : {}}
          whileTap={isUnlocked ? { scale: 0.9 } : {}}
          onClick={() => isUnlocked && setLocation(`/play/${lvlNum}`)}
          className={`
            relative w-20 h-20 md:w-24 md:h-24 rounded-2xl flex flex-col items-center justify-center cursor-pointer shadow-lg border-4
            ${isUnlocked 
              ? 'bg-gradient-to-b from-sky-300 to-sky-500 border-white text-white hover:shadow-xl' 
              : 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'}
          `}
        >
          {isUnlocked ? (
            <>
              <span className="font-display font-bold text-3xl text-stroke">{lvlNum}</span>
              <div className="flex gap-1 absolute -bottom-3">
                {[1, 2, 3].map(s => (
                  <Star 
                    key={s} 
                    className={`w-4 h-4 md:w-5 md:h-5 ${s <= stars ? 'fill-secondary text-secondary drop-shadow-md' : 'fill-black/20 text-transparent'}`} 
                  />
                ))}
              </div>
            </>
          ) : (
            <Lock className="w-8 h-8 opacity-50" />
          )}
        </motion.div>
      );
    }
    return levels;
  };

  return (
    <div className="min-h-screen bg-sky-100 p-4 md:p-8 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <Link href="/menu">
          <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
            <ChevronLeft className="w-8 h-8" />
          </Button>
        </Link>
        <div className="bg-white border-4 border-slate-200 px-8 py-2 rounded-full font-display font-bold text-2xl text-slate-700 shadow-sm">
          WORLD {currentWorld}
        </div>
        <div className="w-12" /> {/* Spacer for centering */}
      </div>

      <div className="flex-1 flex items-center justify-center max-w-6xl mx-auto w-full relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-0 md:-left-12 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/50 hover:bg-white border-4 border-slate-200 rounded-full z-10"
          onClick={() => setCurrentWorld(p => Math.max(1, p - 1))}
          disabled={currentWorld === 1}
        >
          <ChevronLeft className="w-10 h-10" />
        </Button>

        <div className="grid grid-cols-5 gap-4 md:gap-6 lg:gap-8 p-4">
          {renderLevels()}
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-0 md:-right-12 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/50 hover:bg-white border-4 border-slate-200 rounded-full z-10"
          onClick={() => setCurrentWorld(p => Math.min(TOTAL_WORLDS, p + 1))}
          disabled={currentWorld === TOTAL_WORLDS}
        >
          <ChevronRight className="w-10 h-10" />
        </Button>
      </div>
    </div>
  );
}
