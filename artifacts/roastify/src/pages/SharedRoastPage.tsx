import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useGetRoast, getGetRoastQueryKey } from "@workspace/api-client-react";
import { WorldwideCounter } from "@/components/WorldwideCounter";
import { RoastCard } from "@/components/RoastCard";
import { Flame, Loader2 } from "lucide-react";

export default function SharedRoastPage() {
  const { id } = useParams<{ id: string }>();
  const { data: roast, isLoading, error } = useGetRoast(id || "", { query: { enabled: !!id, queryKey: getGetRoastQueryKey(id || "") } });

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <WorldwideCounter />
      
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 md:py-24 z-10 flex flex-col items-center justify-center gap-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="text-primary animate-spin" size={48} />
            <p className="text-lg font-medium text-muted-foreground animate-pulse">Loading roast...</p>
          </div>
        ) : error || !roast ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <Flame className="text-destructive" size={48} />
            <p className="text-xl font-bold text-white">Roast not found</p>
            <p className="text-muted-foreground">It might have burned to ashes.</p>
          </div>
        ) : (
          <RoastCard roast={roast} isShared={true} />
        )}
      </main>

      <footer className="w-full py-8 border-t border-white/5 bg-black/50 z-10 mt-auto">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-primary" />
            <span>Roastify © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">About</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
