import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuthStore } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function Splash() {
  const [, setLocation] = useLocation();
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      const timer = setTimeout(() => setLocation("/menu"), 1500);
      return () => clearTimeout(timer);
    }
  }, [token, setLocation]);

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-sky-200"
      style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}images/splash-bg.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      
      <motion.div
        initial={{ y: -100, opacity: 0, rotate: -10 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", bounce: 0.5, duration: 1 }}
        className="z-10 mb-12"
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/logo.png`} 
          alt="Angry Birds Logo" 
          className="w-80 md:w-96 drop-shadow-2xl"
        />
      </motion.div>

      {!token && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="z-10 flex flex-col gap-4"
        >
          <Link href="/auth" className="block">
            <Button size="lg" className="w-64 text-2xl py-8">Play Now</Button>
          </Link>
        </motion.div>
      )}
      
      {token && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="z-10 mt-8"
        >
          <div className="w-16 h-16 border-8 border-t-secondary border-r-secondary border-b-white/30 border-l-white/30 rounded-full animate-spin"></div>
        </motion.div>
      )}
    </div>
  );
}
