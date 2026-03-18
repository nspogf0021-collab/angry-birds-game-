import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { login, register } from "@workspace/api-client-react";
import { useAuthStore } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const { setAuth } = useAuthStore();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        const res = await login({ email: formData.email, password: formData.password });
        setAuth(res.token, res.user);
        setLocation("/menu");
      } else {
        const res = await register(formData);
        setAuth(res.token, res.user);
        setLocation("/menu");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Authentication failed. Try guest mode!",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playAsGuest = async () => {
    setIsLoading(true);
    try {
      const guestId = Math.floor(Math.random() * 10000);
      const res = await register({
        username: `Guest_${guestId}`,
        email: `guest${guestId}@example.com`,
        password: "guestpassword123"
      });
      setAuth(res.token, res.user);
      setLocation("/menu");
    } catch (err) {
      toast({ title: "Guest login failed", variant: "destructive" });
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 bg-sky-200"
      style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}images/splash-bg.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-8 border-white">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-4xl text-primary">{isLogin ? "Welcome Back!" : "Join the Flock!"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <Input 
                  placeholder="Username" 
                  required 
                  value={formData.username}
                  onChange={e => setFormData(p => ({...p, username: e.target.value}))}
                />
              )}
              <Input 
                type="email" 
                placeholder="Email Address" 
                required 
                value={formData.email}
                onChange={e => setFormData(p => ({...p, email: e.target.value}))}
              />
              <Input 
                type="password" 
                placeholder="Password" 
                required 
                value={formData.password}
                onChange={e => setFormData(p => ({...p, password: e.target.value}))}
              />
              
              <Button type="submit" size="lg" className="w-full text-xl" disabled={isLoading}>
                {isLoading ? "Loading..." : (isLogin ? "Login" : "Sign Up")}
              </Button>
            </form>

            <div className="mt-6 flex flex-col gap-4 text-center">
              <p className="font-semibold text-slate-500">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button 
                  type="button"
                  className="ml-2 text-primary hover:underline font-bold"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Sign Up" : "Login"}
                </button>
              </p>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-slate-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-slate-500 font-bold">OR</span></div>
              </div>

              <Button variant="secondary" type="button" onClick={playAsGuest} disabled={isLoading}>
                Play as Guest
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
