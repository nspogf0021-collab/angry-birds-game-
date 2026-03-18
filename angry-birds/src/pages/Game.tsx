import { useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { GameEngine } from "@/lib/physics";
import { useGetProgress, updateProgress } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Pause, RotateCcw, Play, Star, ChevronRight } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

export default function Game() {
  const [, params] = useRoute("/play/:id");
  const [, setLocation] = useLocation();
  const levelNum = parseInt(params?.id || "1", 10);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [stars, setStars] = useState(0);
  
  const { data: progress } = useGetProgress();

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Set exact size for crisp rendering
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const engine = new GameEngine(canvas.width, canvas.height, canvas.height - 100);
    engineRef.current = engine;

    // Generate procedural level
    const blocks = [];
    const pigs = [];
    const numBlocks = Math.min(20, 5 + levelNum);
    const numPigs = Math.min(10, 1 + Math.floor(levelNum / 5));
    
    // Base x for structure
    const baseStrX = canvas.width * 0.6;
    
    for(let i=0; i<numBlocks; i++) {
      blocks.push({
        x: baseStrX + Math.random() * 300,
        y: canvas.height - 150 - (Math.random() * 200),
        w: 40 + Math.random() * 20,
        h: 40 + Math.random() * 60,
        material: Math.random() > 0.7 ? 'stone' : Math.random() > 0.4 ? 'wood' : 'ice'
      });
    }
    
    for(let i=0; i<numPigs; i++) {
      pigs.push({
        x: baseStrX + 50 + Math.random() * 200,
        y: canvas.height - 150 - (Math.random() * 100),
        r: 15 + Math.random() * 10
      });
    }
    
    // Birds available: basic red, plus unlocked ones if higher level
    const availableBirds = progress?.unlockedBirds || ['red'];
    const birds = Array(Math.min(5, 3 + Math.floor(levelNum/10))).fill('red');
    if (availableBirds.includes('blue') && levelNum > 5) birds[1] = 'blue';
    if (availableBirds.includes('yellow') && levelNum > 10) birds[2] = 'yellow';
    if (availableBirds.includes('black') && levelNum > 15) birds[3] = 'black';

    engine.loadLevel(birds, blocks, pigs);

    engine.onScore = (pts) => setScore(s => s + pts);
    engine.onWin = (finalScore, starsEarned) => {
      setScore(finalScore);
      setStars(starsEarned);
      setGameState('won');
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      
      // Save progress
      updateProgress({
        level: levelNum,
        score: finalScore,
        stars: starsEarned,
        coinsEarned: starsEarned * 10
      }).catch(console.error);
    };
    engine.onLose = () => {
      setGameState('lost');
    };

    let animationId: number;
    const loop = () => {
      if (!isPaused && engine.state !== 'finished') {
        engine.update();
      }
      
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw sky
      const grad = ctx.createLinearGradient(0,0,0,canvas.height);
      grad.addColorStop(0, '#87CEEB');
      grad.addColorStop(1, '#E0F6FF');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,canvas.width, canvas.height);

      // Draw ground
      ctx.fillStyle = '#8FBC8F';
      ctx.fillRect(0, engine.groundY, canvas.width, canvas.height - engine.groundY);
      ctx.fillStyle = '#228B22';
      ctx.fillRect(0, engine.groundY, canvas.width, 10);

      // Draw slingshot
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(engine.slingshotPos.x - 10, engine.slingshotPos.y, 20, engine.groundY - engine.slingshotPos.y);
      
      // Draw slingshot bands if aiming
      if (engine.isDragging) {
        ctx.strokeStyle = '#301505';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(engine.slingshotPos.x, engine.slingshotPos.y);
        ctx.lineTo(engine.dragCurrent.x, engine.dragCurrent.y);
        ctx.stroke();
      }

      // Draw entities
      engine.entities.forEach(e => {
        ctx.save();
        ctx.translate(e.x + (e.w||e.radius!*2)/2, e.y + (e.h||e.radius!*2)/2);
        ctx.rotate(e.rotation);
        
        if (e.type === 'block') {
          ctx.fillStyle = e.material === 'stone' ? '#808080' : e.material === 'wood' ? '#D2B48C' : '#ADD8E6';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h);
          ctx.strokeRect(-e.w/2, -e.h/2, e.w, e.h);
          
          // damage cracks
          if (e.hp < e.maxHp * 0.5) {
            ctx.beginPath(); ctx.moveTo(-e.w/2, -e.h/2); ctx.lineTo(e.w/4, e.h/4); ctx.stroke();
          }
        } else if (e.type === 'pig') {
          ctx.fillStyle = '#32CD32';
          ctx.beginPath(); ctx.arc(0, 0, e.radius!, 0, Math.PI*2); ctx.fill();
          ctx.stroke();
          // Face
          ctx.fillStyle = '#000';
          ctx.beginPath(); ctx.arc(-e.radius!/3, -e.radius!/4, 2, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(e.radius!/3, -e.radius!/4, 2, 0, Math.PI*2); ctx.fill();
          // Snout
          ctx.fillStyle = '#90EE90';
          ctx.beginPath(); ctx.arc(0, e.radius!/4, e.radius!/2.5, 0, Math.PI*2); ctx.fill();
          ctx.stroke();
        } else if (e.type === 'bird') {
          ctx.fillStyle = e.birdType === 'blue' ? '#4169E1' : e.birdType === 'yellow' ? '#FFD700' : e.birdType === 'black' ? '#2F4F4F' : '#FF0000';
          ctx.beginPath(); ctx.arc(0, 0, e.radius!, 0, Math.PI*2); ctx.fill();
          ctx.stroke();
          // Eyes
          ctx.fillStyle = '#FFF';
          ctx.beginPath(); ctx.arc(-e.radius!/3, -e.radius!/4, e.radius!/4, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(e.radius!/3, -e.radius!/4, e.radius!/4, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#000';
          ctx.beginPath(); ctx.arc(-e.radius!/3, -e.radius!/4, 2, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(e.radius!/3, -e.radius!/4, 2, 0, Math.PI*2); ctx.fill();
          // Beak
          ctx.fillStyle = '#FFA500';
          ctx.beginPath(); ctx.moveTo(-e.radius!/2, 0); ctx.lineTo(e.radius!/2, 0); ctx.lineTo(0, e.radius!/2); ctx.fill();
        }
        ctx.restore();
      });

      animationId = requestAnimationFrame(loop);
    };
    loop();

    const handleDown = (e: PointerEvent) => engine.handlePointerDown(e.clientX, e.clientY);
    const handleMove = (e: PointerEvent) => engine.handlePointerMove(e.clientX, e.clientY);
    const handleUp = () => engine.handlePointerUp();
    const handleClick = () => {
      if (engine.state === 'flying') engine.activateSpecialAbility();
    };

    canvas.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    canvas.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      canvas.removeEventListener('click', handleClick);
    };
  }, [levelNum, isPaused, progress]);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-black touch-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 flex gap-2">
        <Button variant="outline" size="icon" onClick={() => setIsPaused(true)} className="bg-white/80 rounded-full">
          <Pause className="w-6 h-6" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => window.location.reload()} className="bg-white/80 rounded-full">
          <RotateCcw className="w-6 h-6" />
        </Button>
      </div>
      
      <div className="absolute top-4 right-4 bg-black/50 text-white px-6 py-2 rounded-full font-display text-2xl font-bold border-2 border-white/20">
        SCORE: {score}
      </div>

      {/* Paused Menu */}
      <AnimatePresence>
        {isPaused && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-white p-8 rounded-3xl border-8 border-slate-200 flex flex-col gap-4 text-center min-w-[300px]">
              <h2 className="text-4xl font-display font-bold text-slate-800 mb-4">PAUSED</h2>
              <Button size="lg" onClick={() => setIsPaused(false)}><Play className="mr-2"/> Resume</Button>
              <Button variant="secondary" size="lg" onClick={() => window.location.reload()}><RotateCcw className="mr-2"/> Restart</Button>
              <Button variant="outline" size="lg" onClick={() => setLocation('/levels')}>Exit to Map</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win/Lose Modals */}
      <AnimatePresence>
        {gameState !== 'playing' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-white p-8 rounded-3xl border-8 border-slate-200 flex flex-col gap-6 text-center max-w-md w-full relative">
              {/* Stars decoration */}
              {gameState === 'won' && (
                <div className="flex justify-center gap-2 -mt-16 mb-4">
                  {[1, 2, 3].map(s => (
                    <motion.div 
                      key={s} 
                      initial={{ scale: 0, rotate: -30 }} 
                      animate={{ scale: 1, rotate: 0 }} 
                      transition={{ delay: s * 0.3, type: 'spring' }}
                    >
                      <Star className={`w-20 h-20 ${s <= stars ? 'fill-secondary text-secondary drop-shadow-xl' : 'fill-slate-200 text-slate-300'}`} />
                    </motion.div>
                  ))}
                </div>
              )}

              <h2 className={`text-5xl font-display font-bold text-stroke text-white ${gameState === 'won' ? 'text-green-500' : 'text-red-500'}`}>
                {gameState === 'won' ? 'LEVEL CLEARED!' : 'LEVEL FAILED'}
              </h2>
              
              <div className="text-2xl font-bold text-slate-600 bg-slate-100 py-4 rounded-xl">
                SCORE: <span className="text-primary">{score}</span>
                {gameState === 'won' && <div className="text-lg text-secondary mt-1">+{stars * 10} Coins</div>}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setLocation('/levels')}>Map</Button>
                <Button variant="secondary" size="lg" className="flex-1" onClick={() => window.location.reload()}>
                  <RotateCcw className="w-6 h-6"/>
                </Button>
                {gameState === 'won' && (
                  <Button size="lg" className="flex-1" onClick={() => {
                    setLocation(`/play/${levelNum + 1}`);
                    window.location.reload();
                  }}>
                    <ChevronRight className="w-8 h-8"/>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
