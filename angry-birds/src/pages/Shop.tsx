import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useGetShopItems, usePurchaseItem, useGetProgress } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetProgressQueryKey } from "@workspace/api-client-react";

export default function Shop() {
  const { data: shopData, isLoading } = useGetShopItems();
  const { data: progress } = useGetProgress();
  const purchaseMutation = usePurchaseItem();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePurchase = async (itemId: string) => {
    try {
      await purchaseMutation.mutateAsync({ data: { itemId } });
      toast({
        title: "Purchased!",
        description: "New bird added to your flock.",
      });
      queryClient.invalidateQueries({ queryKey: getGetProgressQueryKey() });
    } catch (err: any) {
      toast({
        title: "Purchase Failed",
        description: err.message || "Not enough coins.",
        variant: "destructive"
      });
    }
  };

  const unlocked = progress?.unlockedBirds || [];
  const coins = progress?.coins || 0;

  return (
    <div 
      className="min-h-screen bg-amber-900 p-4 md:p-8"
      style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}images/shop-bg.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-black/40 p-4 rounded-3xl backdrop-blur-sm border-2 border-white/10">
          <Link href="/menu">
            <Button variant="outline" size="icon" className="rounded-full w-12 h-12 bg-white/10 text-white hover:bg-white border-none">
              <ChevronLeft className="w-8 h-8" />
            </Button>
          </Link>
          <h1 className="text-4xl font-display font-bold text-stroke text-white tracking-widest">BIRD SHOP</h1>
          <div className="flex items-center gap-2 bg-black/50 text-white px-6 py-2 rounded-full font-bold text-2xl border-2 border-yellow-500/50">
            <span className="text-yellow-400">🪙</span>
            {coins}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center text-white text-2xl mt-20">Loading Shop...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shopData?.items.map(item => {
              const isOwned = unlocked.includes(item.id);
              const canAfford = coins >= item.cost;
              
              return (
                <Card key={item.id} className="border-4 border-amber-800 bg-amber-100 hover:-translate-y-2 transition-transform duration-300">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-inner border-4 border-amber-900/20"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.emoji}
                    </div>
                    
                    <div>
                      <h3 className="font-display font-bold text-xl text-amber-950">{item.name}</h3>
                      <p className="text-sm font-semibold text-amber-800 mt-1 h-10">{item.ability}</p>
                    </div>

                    <div className="w-full mt-2">
                      {isOwned ? (
                        <div className="w-full py-3 bg-amber-900/10 rounded-xl font-bold text-amber-900 border-2 border-amber-900/20">
                          OWNED
                        </div>
                      ) : (
                        <Button 
                          className="w-full text-lg" 
                          variant={canAfford ? "secondary" : "outline"}
                          disabled={!canAfford || purchaseMutation.isPending}
                          onClick={() => handlePurchase(item.id)}
                        >
                          <span className="mr-2">🪙</span> {item.cost}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
