import { Link } from "wouter";
import { ChevronLeft, Trophy, Medal } from "lucide-react";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { useAuthStore } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function Leaderboard() {
  const { data, isLoading } = useGetLeaderboard();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 relative overflow-hidden flex flex-col items-center">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary rounded-full blur-3xl mix-blend-screen"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl mix-blend-screen"></div>
      </div>

      <div className="w-full max-w-3xl z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/menu">
            <Button variant="outline" size="icon" className="rounded-full w-12 h-12 bg-white/10 text-white border-white/20 hover:bg-white/20">
              <ChevronLeft className="w-8 h-8" />
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white flex items-center gap-4 text-stroke">
            <Trophy className="w-10 h-10 text-secondary fill-secondary" /> 
            GLOBAL RANKS
          </h1>
          <div className="w-12" />
        </div>

        {/* Board */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-2 md:p-6 flex-1 shadow-2xl">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-white text-2xl font-bold">Loading scores...</div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-slate-300 font-bold uppercase tracking-wider text-sm border-b border-white/10">
                <div className="col-span-2 md:col-span-1 text-center">Rank</div>
                <div className="col-span-6 md:col-span-7">Player</div>
                <div className="col-span-4 text-right">Score</div>
              </div>
              
              {data?.entries.map((entry) => {
                const isMe = entry.username === user?.username;
                let rankStyle = "bg-white/5 text-white";
                let rankIcon = <span className="font-display text-xl">{entry.rank}</span>;
                
                if (entry.rank === 1) {
                  rankStyle = "bg-gradient-to-r from-yellow-500/20 to-yellow-600/40 border-yellow-500/50";
                  rankIcon = <Medal className="w-6 h-6 text-yellow-400" />;
                } else if (entry.rank === 2) {
                  rankStyle = "bg-gradient-to-r from-slate-300/20 to-slate-400/40 border-slate-400/50";
                  rankIcon = <Medal className="w-6 h-6 text-slate-300" />;
                } else if (entry.rank === 3) {
                  rankStyle = "bg-gradient-to-r from-amber-700/20 to-amber-800/40 border-amber-700/50";
                  rankIcon = <Medal className="w-6 h-6 text-amber-600" />;
                }

                if (isMe) {
                  rankStyle += " ring-2 ring-primary bg-primary/20";
                }

                return (
                  <div key={entry.username} className={`grid grid-cols-12 gap-4 px-6 py-4 rounded-2xl items-center border border-transparent transition-transform hover:scale-[1.02] ${rankStyle}`}>
                    <div className="col-span-2 md:col-span-1 flex justify-center items-center font-bold">
                      {rankIcon}
                    </div>
                    <div className="col-span-6 md:col-span-7 font-display font-bold text-lg text-white flex items-center gap-3">
                      {entry.username}
                      {isMe && <span className="bg-primary text-xs px-2 py-1 rounded-full text-white tracking-widest font-sans">YOU</span>}
                    </div>
                    <div className="col-span-4 text-right font-display font-bold text-xl text-secondary">
                      {entry.totalScore.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
