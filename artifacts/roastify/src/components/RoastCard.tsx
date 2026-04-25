import { useRef, useState, useEffect } from "react";
import { Copy, Share2, RotateCw, Sparkles, Flame, Skull, Frown, Twitter } from "lucide-react";
import { toPng } from "html-to-image";
import { useReactToRoast, getGetRoastQueryKey, getGetLeaderboardQueryKey, Roast, ReactionType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface RoastCardProps {
  roast: Roast;
  onRetry?: () => void;
  onRoastHarder?: () => void;
  isShared?: boolean;
}

export function RoastCard({ roast, onRetry, onRoastHarder, isShared }: RoastCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reactMutation = useReactToRoast();
  const [reactions, setReactions] = useState(roast.reactions);

  useEffect(() => {
    setReactions(roast.reactions);
  }, [roast.reactions]);

  const shareUrl = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/roast/${roast.id}`;
  const shareText = `"${roast.text}" - roasted by AI`;

  const handleCopy = () => {
    navigator.clipboard.writeText(roast.text);
    toast({ title: "Copied!", description: "Roast copied to clipboard." });
  };

  const handleShareImage = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "roast.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "AI Roast", text: shareText });
      } else {
        const link = document.createElement("a");
        link.download = "roast.png";
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`, "_blank");
    }
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(roast.text + "\n\n— roasted by roastify.app/roast/" + roast.id)}`, "_blank");
  };

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const handleReact = (type: ReactionType) => {
    const key = `reacted:${roast.id}:${type}`;
    if (localStorage.getItem(key)) return;

    // Optimistic update
    setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
    localStorage.setItem(key, "true");

    reactMutation.mutate({ id: roast.id, data: { type } }, {
      onSuccess: (newCounts) => {
        setReactions(newCounts);
        queryClient.invalidateQueries({ queryKey: getGetRoastQueryKey(roast.id) });
        queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
      },
      onError: () => {
        setReactions(prev => ({ ...prev, [type]: prev[type] - 1 }));
        localStorage.removeItem(key);
      }
    });
  };

  const hasReacted = (type: ReactionType) => {
    return !!localStorage.getItem(`reacted:${roast.id}:${type}`);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4">
      {/* The Shareable Card */}
      <div 
        ref={cardRef}
        className="rounded-2xl p-8 relative overflow-hidden flex flex-col gap-6 items-center text-center"
        style={{
          backgroundColor: "#141414",
          border: "1px solid rgba(255, 107, 0, 0.4)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 0, 85, 0.1)",
        }}
      >
        <div className="absolute top-0 left-0 w-full h-1 fire-bg" />
        
        <div className="font-display font-bold text-xl tracking-tight uppercase fire-text">
          RoastMe.ai
        </div>

        <p data-testid="text-roast-result" className="text-3xl md:text-4xl font-bold leading-tight font-display text-foreground">
          "{roast.text}"
        </p>
        
        <div className="flex flex-col items-center gap-2 mt-2">
          <div className="text-muted-foreground font-medium">
            {roast.name || "Anonymous"}, {roast.job} • {roast.city}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-primary px-2 py-1 bg-primary/10 rounded border border-primary/20">
              Intensity: {roast.intensity}/5
            </span>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
              {roast.style}
            </span>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 text-[10px] text-muted-foreground/40 font-mono tracking-widest">
          roastify.app
        </div>
      </div>

      {/* Reactions */}
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {(Object.keys(reactions) as ReactionType[]).map((type) => {
          const emojis: Record<ReactionType, string> = { hilarious: "😂", savage: "🔥", dead: "💀", too_real: "😭" };
          return (
            <button
              key={type}
              data-testid={`button-react-${type}`}
              onClick={() => handleReact(type)}
              disabled={hasReacted(type) || reactMutation.isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${
                hasReacted(type) 
                  ? 'bg-primary/20 text-primary border border-primary/50' 
                  : 'bg-muted text-foreground/70 hover:bg-muted hover:text-foreground border border-border'
              }`}
            >
              <span>{emojis[type]}</span>
              <span>{reactions[type]}</span>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      {!isShared && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          <button onClick={handleCopy} data-testid="button-copy" className="flex items-center justify-center gap-2 py-3 bg-muted hover:bg-muted rounded-lg font-medium transition-colors text-sm">
            <Copy size={16} /> Copy Text
          </button>
          <button onClick={handleShareImage} data-testid="button-share-image" className="flex items-center justify-center gap-2 py-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg font-medium transition-colors text-sm">
            <Sparkles size={16} /> Share Image
          </button>
          <button onClick={handleShareWhatsApp} data-testid="button-share-whatsapp" className="flex items-center justify-center gap-2 py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 rounded-lg font-medium transition-colors text-sm">
            <Share2 size={16} /> WhatsApp
          </button>
          <button onClick={handleShareTwitter} data-testid="button-share-twitter" className="flex items-center justify-center gap-2 py-3 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] border border-[#1DA1F2]/30 rounded-lg font-medium transition-colors text-sm">
            <Twitter size={16} /> Twitter
          </button>
          {onRetry && (
            <button onClick={onRetry} data-testid="button-try-again" className="flex items-center justify-center gap-2 py-3 bg-muted hover:bg-muted rounded-lg font-medium transition-colors text-sm">
              <RotateCw size={16} /> Try Again
            </button>
          )}
          {onRoastHarder && (
            <button onClick={onRoastHarder} data-testid="button-reroast" className="flex items-center justify-center gap-2 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 rounded-lg font-bold transition-colors text-sm shadow-[0_0_10px_rgba(239,68,68,0.2)]">
              🔄 Roast me harder <span className="ml-1">🔥</span>
            </button>
          )}
        </div>
      )}

      {isShared && (
        <div className="flex flex-col gap-4 mt-6 items-center">
          <p className="text-muted-foreground text-sm">Sent to you via roastify.app</p>
          <Link href="/" className="w-full max-w-sm flex items-center justify-center gap-2 fire-bg text-white font-bold text-xl py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all fire-glow">
            🔥 Roast Yourself
          </Link>
        </div>
      )}
    </div>
  );
}
