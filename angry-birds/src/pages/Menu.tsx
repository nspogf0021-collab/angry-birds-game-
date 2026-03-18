import { Link } from "wouter";
import { motion } from "framer-motion";
import { Play, ShoppingCart, Trophy, LogOut } from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth";
import { useGetProgress } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export default function Menu() {
  const { user, logout } = useAuthStore();
  const { data: progress } = useGetProgress();

  return (
    <div 
      className="min-h-screen w-full flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}images/splash-bg.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Top Bar */}
      <div className="p-4 flex justify-between items-center z-20">
        <div className="bg-white/90 backdrop-blur rounded-full px-6 py-2 border-4 border-white shadow-lg flex items-center gap-4">
          <span className="font-display font-bold text-xl text-slate-700">{user?.username}</span>
          <div className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full font-bold">
            <span className="text-xl">🪙</span>
            {progress?.coins || 0}
          </div>
        </div>
        <Button variant="destructive" size="icon" onClick={() => logout()} title="Logout">
          <LogOut className="h-6 w-6" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 p-4">
        <motion.img 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
          src={`${import.meta.env.BASE_URL}images/logo.png`} 
          alt="Angry Birds" 
          className="w-72 md:w-96 mb-12 drop-shadow-2xl"
        />

        <div className="flex flex-col gap-6 w-full max-w-sm">
          <Link href="/levels" className="block w-full">
            <Button size="lg" className="w-full text-3xl py-10">
              <Play className="mr-3 h-8 w-8 fill-current" /> PLAY
            </Button>
          </Link>
          
          <div className="flex gap-4">
            <Link href="/shop" className="flex-1">
              <Button variant="accent" size="lg" className="w-full text-2xl py-8">
                <ShoppingCart className="mr-2 h-6 w-6" /> SHOP
              </Button>
            </Link>
            <Link href="/leaderboard" className="flex-1">
              <Button variant="secondary" size="lg" className="w-full text-2xl py-8">
                <Trophy className="mr-2 h-6 w-6" /> RANKS
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
