import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Splash from "@/pages/Splash";
import Auth from "@/pages/Auth";
import Menu from "@/pages/Menu";
import LevelSelect from "@/pages/LevelSelect";
import Game from "@/pages/Game";
import Shop from "@/pages/Shop";
import Leaderboard from "@/pages/Leaderboard";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// Monkey-patch fetch to automatically inject Authorization token
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const urlStr = input.toString();
  if (urlStr.includes('/api/')) {
    const token = localStorage.getItem('angry_birds_token');
    if (token) {
      init = init || {};
      init.headers = {
        ...init.headers,
        Authorization: `Bearer ${token}`
      };
    }
  }
  return originalFetch(input, init);
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={Splash} />
      <Route path="/auth" component={Auth} />
      <Route path="/menu" component={Menu} />
      <Route path="/levels" component={LevelSelect} />
      <Route path="/play/:id" component={Game} />
      <Route path="/shop" component={Shop} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
