import { useRef, useState, useEffect } from "react";
import { Copy, Share2, RotateCw, ArrowLeft } from "lucide-react";
import { toPng } from "html-to-image";
import { useReactToRoast, getGetRoastQueryKey, getGetLeaderboardQueryKey, Roast, ReactionType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface RoastCardProps {
  roast: Roast;
  onRetry?: () => void;
  onRoastHarder?: () => void;
  onNewRoast?: () => void;
  isShared?: boolean;
}

export function RoastCard({ roast, onRetry, onNewRoast, isShared }: RoastCardProps) {
  const imageCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reactMutation = useReactToRoast();
  const [reactions, setReactions] = useState(roast.reactions);

  useEffect(() => {
    setReactions(roast.reactions);
  }, [roast.reactions]);

  const shareUrl = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/roast/${roast.id}`;
  const shareText = `"${roast.text}" — roasted by RoastersAI.com`;

  const handleCopy = () => {
    navigator.clipboard.writeText(roast.text);
    toast({ title: "Copied! 🔥", description: "Roast copied to clipboard." });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Roast 🔥", text: shareText, url: shareUrl });
      } catch {
        // user cancelled — silent
      }
    } else {
      navigator.clipboard.writeText(shareText + "\n\n" + shareUrl).catch(() => {});
      toast({ title: "Copied!", description: "Roast link copied — paste it anywhere." });
    }
  };

  const handleReact = (type: ReactionType) => {
    const key = `reacted:${roast.id}:${type}`;
    if (localStorage.getItem(key)) return;
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

  const hasReacted = (type: ReactionType) => !!localStorage.getItem(`reacted:${roast.id}:${type}`);

  const btnBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "none",
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4">

      {/* Back button — top left */}
      {!isShared && onNewRoast && (
        <button
          onClick={onNewRoast}
          data-testid="button-back"
          className="self-start flex items-center gap-2 font-semibold text-sm hover:opacity-70 active:scale-95 transition-all"
          style={{
            color: "var(--fire-orange, #FF4500)",
            background: "rgba(255,69,0,0.08)",
            border: "1px solid rgba(255,69,0,0.18)",
            borderRadius: 10,
            padding: "8px 14px",
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      )}

      {/* Visible display card — theme-adaptive */}
      <div
        className="rounded-2xl p-8 relative overflow-hidden flex flex-col gap-6 items-center text-center"
        style={{
          backgroundColor: "hsl(var(--card))",
          border: "1px solid rgba(255, 107, 0, 0.4)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(255, 0, 85, 0.08)",
        }}
      >
        <div className="absolute top-0 left-0 w-full h-1 fire-bg" />

        <div className="font-display font-extrabold text-lg tracking-widest uppercase" style={{ color: "#FF4500" }}>
          ROASTERSAI.COM
        </div>

        <p data-testid="text-roast-result" className="text-3xl md:text-4xl font-bold leading-tight font-display text-foreground">
          "{roast.text}"
        </p>

        <div className="flex flex-col items-center gap-2 mt-2">
          <div className="text-muted-foreground font-medium">
            {roast.name || "Anonymous"}, {roast.job} • {roast.city}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
              {roast.style}
            </span>
          </div>
        </div>

        <div className="absolute bottom-3 right-4 text-[10px] text-muted-foreground/30 font-mono tracking-widest">
          roastersai.com
        </div>
      </div>

      {/* Hidden image card — always dark for export */}
      <div
        ref={imageCardRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: -9999,
          top: 0,
          width: 600,
          backgroundColor: "#0D0D0D",
          borderRadius: 20,
          padding: 48,
          border: "2px solid rgba(255,69,0,0.45)",
          boxShadow: "0 0 60px rgba(255,69,0,0.25), inset 0 0 30px rgba(255,0,85,0.05)",
          fontFamily: "'Space Grotesk', sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div style={{ color: "#FF4500", fontWeight: 800, fontSize: 13, letterSpacing: 4, textTransform: "uppercase" }}>
          ROASTERSAI.COM
        </div>
        <div style={{ width: "100%", height: 1, background: "linear-gradient(90deg, transparent, #FF4500, transparent)" }} />
        <p style={{ color: "#FFFFFF", fontSize: 26, fontWeight: 700, lineHeight: 1.45, margin: 0 }}>
          "{roast.text}"
        </p>
        <div style={{ width: "100%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,107,0,0.4), transparent)" }} />
        <div style={{ color: "#888888", fontSize: 13 }}>
          {roast.name} · {roast.city}
        </div>
      </div>

      {/* Reactions */}
      <div className="flex flex-wrap justify-center gap-2 mt-1">
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
                  ? "bg-primary/20 text-primary border border-primary/50"
                  : "bg-muted text-foreground/70 hover:text-foreground border border-border"
              }`}
            >
              <span>{emojis[type]}</span>
              <span>{reactions[type]}</span>
            </button>
          );
        })}
      </div>

      {/* Actions — only shown when not shared */}
      {!isShared && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {/* Copy */}
          <button
            onClick={handleCopy}
            data-testid="button-copy"
            style={{
              ...btnBase,
              background: "hsl(var(--muted))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
            }}
          >
            <Copy size={15} /> Copy
          </button>

          {/* Share — Web Share API */}
          <button
            data-testid="button-share"
            onClick={handleShare}
            style={{
              ...btnBase,
              background: "linear-gradient(135deg, #FF4500, #FF006E)",
              color: "#FFFFFF",
            }}
          >
            <Share2 size={15} /> Share
          </button>

          {/* Try Again */}
          {onRetry && (
            <button
              onClick={onRetry}
              data-testid="button-try-again"
              style={{
                ...btnBase,
                background: "transparent",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              <RotateCw size={15} /> Try Again
            </button>
          )}
        </div>
      )}

      {isShared && (
        <div className="flex flex-col gap-4 mt-6 items-center">
          <p className="text-muted-foreground text-sm">Sent to you via RoastersAI.com</p>
          <Link
            href="/"
            className="w-full max-w-sm flex items-center justify-center gap-2 text-white font-bold text-xl py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all fire-glow"
            style={{ background: "linear-gradient(135deg, #FF4500, #FF006E)" }}
          >
            🔥 Roast Yourself
          </Link>
        </div>
      )}
    </div>
  );
}
