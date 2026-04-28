import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useGetRoast, getGetRoastQueryKey } from "@workspace/api-client-react";
import { WorldwideCounter } from "@/components/WorldwideCounter";
import { RoastCard } from "@/components/RoastCard";
import { InfoModal } from "@/components/InfoModal";
import { Flame, Loader2 } from "lucide-react";
import type { Roast } from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function useShortRoast(shortId: string) {
  return useQuery<Roast>({
    queryKey: ["r", shortId],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/r/${shortId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!shortId,
  });
}

export default function SharedRoastPage() {
  const { id } = useParams<{ id: string }>();
  const [location] = useLocation();
  const isShortUrl = location.startsWith("/r/");

  const shortQuery = useShortRoast(isShortUrl ? (id || "") : "");
  const uuidQuery = useGetRoast(!isShortUrl ? (id || "") : "", {
    query: { enabled: !isShortUrl && !!id, queryKey: getGetRoastQueryKey(id || "") },
  });

  const isLoading = isShortUrl ? shortQuery.isLoading : uuidQuery.isLoading;
  const error = isShortUrl ? shortQuery.error : uuidQuery.error;
  const roast = isShortUrl ? shortQuery.data : uuidQuery.data;

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <WorldwideCounter />
      
      <div className="fixed inset-0 pointer-events-none z-0" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 md:py-24 z-10 flex flex-col items-center justify-center gap-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="text-primary animate-spin" size={48} />
            <p className="text-lg font-medium text-muted-foreground animate-pulse">Loading roast...</p>
          </div>
        ) : error || !roast ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <Flame className="text-destructive" size={48} />
            <p className="text-xl font-bold text-foreground">Roast not found</p>
            <p className="text-muted-foreground">It might have burned to ashes.</p>
          </div>
        ) : (
          <RoastCard roast={roast} isShared={true} />
        )}
      </main>

      <footer className="w-full py-8 border-t border-border bg-card z-10 mt-auto">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-primary" />
            <span>RoastersAI © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <InfoModal
              trigger={<button className="hover:text-primary transition-colors cursor-pointer">About Us</button>}
              title="About RoastersAI 🔥"
              content={`RoastersAI is the world's most savage AI roast generator. Built for fun, not for feelings. We support 9 languages so everyone can get roasted equally. Don't take it personally 😂`}
            />
            <InfoModal
              trigger={<button className="hover:text-primary transition-colors cursor-pointer">Contact</button>}
              title="Contact Us"
              content={`Have suggestions or feedback?\nEmail us: hello@roastersai.com\nWe read every message (and might roast you back 🔥)`}
            />
            <InfoModal
              trigger={<button className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</button>}
              title="Privacy Policy"
              content={`Last updated: 2025.\n\nRoastersAI does not store any personal information you enter. All roasts are generated in real-time and not saved to any database. We use Google Analytics to track anonymous visitor statistics. No data is sold to third parties. By using this site you agree to these terms.`}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
