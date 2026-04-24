import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Ghost, Zap, HeartPulse, Share2, Copy, RotateCw, Volume2, VolumeX, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useGenerateRoast, useListTrendingRoasts, useGetRoastStats, getListTrendingRoastsQueryKey, getGetRoastStatsQueryKey } from "@workspace/api-client-react";
import type { Roast, RoastStyle } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

// --- Components ---

const playWhoosh = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Ignore audio errors
  }
};

const triggerHaptic = () => {
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
};

const formSchema = z.object({
  target: z.string().min(1, "Type something, coward.").max(100, "Too long, didn't read."),
  style: z.enum(["friendly", "savage", "dark", "desi"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [currentRoast, setCurrentRoast] = useState<Roast | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const generateRoast = useGenerateRoast();
  const { data: trendingRoasts } = useListTrendingRoasts({ query: { refetchInterval: 15000, queryKey: getListTrendingRoastsQueryKey() } });
  const { data: stats } = useGetRoastStats({ query: { queryKey: getGetRoastStatsQueryKey() } });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { target: "", style: "savage" }
  });

  const onSubmit = (values: FormValues) => {
    setCurrentRoast(null);
    generateRoast.mutate({ data: { target: values.target, style: values.style } }, {
      onSuccess: (roast) => {
        setCurrentRoast(roast);
        if (soundEnabled) playWhoosh();
        triggerHaptic();
        queryClient.invalidateQueries({ queryKey: getListTrendingRoastsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRoastStatsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "The AI refused to roast this. Try again.", variant: "destructive" });
      }
    });
  };

  const handleCopy = () => {
    if (currentRoast) {
      navigator.clipboard.writeText(currentRoast.text);
      toast({ title: "Copied!", description: "Roast copied to clipboard.", duration: 2000 });
    }
  };

  const handleShare = async () => {
    if (!currentRoast) return;
    const text = `"${currentRoast.text}" - roasted by AI @ Roastify`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "AI Roast", text, url: window.location.href });
      } catch (e) {
        // user cancelled
      }
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, "_blank");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 md:py-24 z-10 flex flex-col gap-16">
        
        {/* Header / Sound Toggle */}
        <div className="flex justify-end w-full">
          <button 
            data-testid="button-sound-toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-primary transition-colors border border-white/5"
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>

        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4"
          >
            <Sparkles size={16} /> <span>100% Brutal AI</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            data-text="Get Roasted by AI"
            className="text-5xl md:text-7xl font-bold tracking-tight glitch-effect neon-text-primary uppercase"
          >
            Get Roasted by AI
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-lg"
          >
            Type anything and get a savage, funny roast instantly. Don't take it personally.
          </motion.p>

          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={form.handleSubmit(onSubmit)} 
            className="w-full max-w-xl mt-8 flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2 relative">
              <input 
                data-testid="input-target"
                {...form.register("target")}
                placeholder="Type your name or anything..."
                className="w-full bg-black/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-6 py-5 text-xl outline-none transition-all placeholder:text-muted-foreground/50 shadow-2xl"
                autoComplete="off"
              />
              {form.formState.errors.target && (
                <span className="text-destructive text-sm text-left absolute -bottom-6 left-2 font-medium" data-testid="text-error">
                  {form.formState.errors.target.message}
                </span>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {[
                { id: "friendly", icon: HeartPulse, label: "Friendly" },
                { id: "savage", icon: Zap, label: "Savage" },
                { id: "dark", icon: Ghost, label: "Dark" },
                { id: "desi", icon: Flame, label: "Desi" },
              ].map((style) => {
                const isSelected = form.watch("style") === style.id;
                const Icon = style.icon;
                return (
                  <button
                    key={style.id}
                    type="button"
                    data-testid={`button-style-${style.id}`}
                    onClick={() => form.setValue("style", style.id as RoastStyle)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 border ${
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary neon-glow-primary" 
                        : "bg-muted/50 text-muted-foreground border-white/5 hover:bg-muted"
                    }`}
                  >
                    <Icon size={16} className={isSelected ? "animate-pulse" : ""} />
                    <span className="capitalize">{style.label}</span>
                  </button>
                );
              })}
            </div>

            <button 
              type="submit"
              data-testid="button-submit-roast"
              disabled={generateRoast.isPending}
              className="mt-4 w-full bg-gradient-to-r from-primary to-secondary text-white font-bold text-xl py-5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none neon-glow-primary"
            >
              {generateRoast.isPending ? "Cooking..." : "Roast Me"}
            </button>
          </motion.form>
        </section>

        {/* Result Area */}
        <AnimatePresence mode="wait">
          {(generateRoast.isPending || currentRoast) && (
            <motion.section
              initial={{ opacity: 0, height: 0, scale: 0.9 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.9 }}
              className="w-full max-w-xl mx-auto"
            >
              <div className="bg-black/60 border border-primary/30 rounded-2xl p-8 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
                
                {generateRoast.isPending ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Flame className="text-primary animate-bounce" size={48} />
                    <p className="text-lg font-medium text-muted-foreground animate-pulse">AI is cooking...</p>
                  </div>
                ) : currentRoast ? (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider font-bold text-primary px-2 py-1 bg-primary/10 rounded">
                        Target: {currentRoast.target}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground bg-white/5 px-2 py-1 rounded">
                        {currentRoast.style}
                      </span>
                    </div>
                    
                    <p data-testid="text-roast-result" className="text-2xl md:text-3xl font-bold leading-tight font-display text-white">
                      "{currentRoast.text}"
                    </p>
                    
                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/10">
                      <button onClick={handleCopy} data-testid="button-copy" className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors">
                        <Copy size={18} /> Copy
                      </button>
                      <button onClick={handleShare} data-testid="button-share" className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors text-primary hover:text-primary-foreground hover:bg-primary">
                        <Share2 size={18} /> Share
                      </button>
                      <button onClick={() => setCurrentRoast(null)} data-testid="button-try-again" className="flex items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                        <RotateCw size={18} />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Trending Grid */}
        <section className="mt-12 flex flex-col gap-8 w-full max-w-5xl mx-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
              <Flame className="text-secondary" /> Live Feed
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
              </span>
              Auto-updating
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingRoasts?.slice(0, 6).map((roast, i) => (
              <motion.div 
                key={roast.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                data-testid={`card-trending-${roast.id}`}
                className="bg-black/40 border border-white/5 rounded-xl p-5 hover:border-primary/50 transition-colors flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-bold text-white/70 truncate pr-2">@{roast.target}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 text-muted-foreground">
                      {roast.style}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">
                    {roast.text}
                  </p>
                </div>
                <div className="text-[10px] text-muted-foreground/50 font-mono">
                  {new Date(roast.createdAt).toLocaleTimeString()}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="w-full bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12 mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Victims Today</h3>
            <p className="text-4xl md:text-5xl font-display font-bold text-white" data-testid="text-stats-users">
              {stats?.usersToday.toLocaleString() ?? "—"}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Total Roasts</h3>
            <p className="text-4xl md:text-5xl font-display font-bold text-primary neon-text-primary" data-testid="text-stats-total">
              {stats?.totalRoasts.toLocaleString() ?? "—"}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Roasts / Min</h3>
            <p className="text-4xl md:text-5xl font-display font-bold text-secondary" data-testid="text-stats-rpm">
              {stats?.roastsPerMinute.toLocaleString() ?? "—"}
            </p>
          </div>
        </section>

      </main>

      <footer className="w-full py-8 border-t border-white/5 bg-black/50 z-10 mt-auto">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-primary" />
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
