import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Ghost, Zap, HeartPulse, Sparkles, Volume2, VolumeX, Target, Copy, Share2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useGenerateRoast, useListTrendingRoasts, useGetRoastStats, getListTrendingRoastsQueryKey, getGetRoastStatsQueryKey } from "@workspace/api-client-react";
import type { Roast, RoastStyle, Job, RelationshipStatus, Language } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { WorldwideCounter } from "@/components/WorldwideCounter";
import { Leaderboard } from "@/components/Leaderboard";
import { RoastCard } from "@/components/RoastCard";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// --- Audio / Haptics ---
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
    navigator.vibrate(40);
  }
};

// --- Form Schema ---
const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(60, "Name is too long"),
  job: z.enum(["student", "engineer", "doctor", "designer", "unemployed", "influencer", "other"] as const),
  city: z.string().min(1, "City is required").max(60, "City is too long"),
  weakness: z.string().max(120, "Keep it short!").optional().nullable(),
  status: z.enum(["single", "in_relationship", "married", "complicated"] as const),
  style: z.enum(["friendly", "savage", "dark", "desi"] as const),
  language: z.enum(["english", "hinglish", "hindi", "spanish", "french"] as const),
  intensity: z.number().min(1).max(5),
});

type FormValues = z.infer<typeof formSchema>;

const intensityLabels: Record<number, { label: string, color: string }> = {
  1: { label: "1 Baby Roast", color: "text-green-400" },
  2: { label: "2 Mild Burns", color: "text-yellow-400" },
  3: { label: "3 Medium Savage", color: "text-orange-500" },
  4: { label: "4 Full Savage", color: "text-pink-500" },
  5: { label: "5 NUCLEAR ☢️", color: "text-red-500 font-bold glitch-effect" },
};

export default function Home() {
  const [currentRoast, setCurrentRoast] = useState<Roast | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("roastify:muted") !== "true");
  const [friendDialogOpen, setFriendDialogOpen] = useState(false);
  const [friendRoast, setFriendRoast] = useState<Roast | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const generateRoast = useGenerateRoast();
  const { data: trendingRoasts } = useListTrendingRoasts({ query: { refetchInterval: 15000, queryKey: getListTrendingRoastsQueryKey() } });
  const { data: stats } = useGetRoastStats({ query: { refetchInterval: 5000, queryKey: getGetRoastStatsQueryKey() } });

  const defaultFormValues: FormValues = {
    name: "",
    job: "student",
    city: "",
    weakness: "",
    status: "single",
    style: "savage",
    language: "english",
    intensity: 3,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues
  });

  const friendForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues
  });

  useEffect(() => {
    localStorage.setItem("roastify:muted", String(!soundEnabled));
  }, [soundEnabled]);

  const onSubmit = (values: FormValues) => {
    setCurrentRoast(null);
    generateRoast.mutate({ data: { ...values } }, {
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

  const onFriendSubmit = (values: FormValues) => {
    setFriendRoast(null);
    generateRoast.mutate({ data: { ...values } }, {
      onSuccess: (roast) => {
        setFriendRoast(roast);
        if (soundEnabled) playWhoosh();
        triggerHaptic();
        queryClient.invalidateQueries({ queryKey: getListTrendingRoastsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRoastStatsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Generation failed.", variant: "destructive" });
      }
    });
  };

  const handleRetry = () => {
    onSubmit(form.getValues());
  };

  const handleRoastHarder = () => {
    const current = form.getValues();
    const newIntensity = Math.min(5, current.intensity + 1);
    // Submit with new intensity without updating form state
    onSubmit({ ...current, intensity: newIntensity });
  };

  const renderFormFields = (f: ReturnType<typeof useForm<FormValues>>, isFriend: boolean = false) => {
    const intensity = f.watch("intensity");
    return (
      <div className="flex flex-col gap-6 w-full text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-foreground/80">{isFriend ? "Their Name" : "Your Name"}</label>
            <input 
              data-testid="input-name"
              {...f.register("name")}
              placeholder="e.g. John Doe"
              className="w-full bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-lg outline-none transition-all placeholder:text-muted-foreground/50"
            />
            {f.formState.errors.name && <span className="text-destructive text-xs font-medium">{f.formState.errors.name.message}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-foreground/80">City</label>
            <input 
              data-testid="input-city"
              {...f.register("city")}
              placeholder="e.g. New York"
              className="w-full bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-lg outline-none transition-all placeholder:text-muted-foreground/50"
            />
            {f.formState.errors.city && <span className="text-destructive text-xs font-medium">{f.formState.errors.city.message}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-foreground/80">Job</label>
            <select
              data-testid="select-job"
              {...f.register("job")}
              className="w-full bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-lg outline-none transition-all text-foreground appearance-none"
            >
              <option value="student">Student</option>
              <option value="engineer">Engineer</option>
              <option value="doctor">Doctor</option>
              <option value="designer">Designer</option>
              <option value="unemployed">Unemployed</option>
              <option value="influencer">Influencer</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-foreground/80">Relationship Status</label>
            <select
              data-testid="select-status"
              {...f.register("status")}
              className="w-full bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-lg outline-none transition-all text-foreground appearance-none"
            >
              <option value="single">Single</option>
              <option value="in_relationship">In a Relationship</option>
              <option value="married">Married</option>
              <option value="complicated">It's Complicated</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-foreground/80">Biggest Weakness (Optional)</label>
          <input 
            data-testid="input-weakness"
            {...f.register("weakness")}
            placeholder="e.g. always late, can't say no, addicted to memes"
            className="w-full bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-lg outline-none transition-all placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Styles */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-foreground/80">Roast Style</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "friendly", icon: HeartPulse, label: "Friendly" },
              { id: "savage", icon: Zap, label: "Savage" },
              { id: "dark", icon: Ghost, label: "Dark" },
              { id: "desi", icon: Flame, label: "Desi" },
            ].map((style) => {
              const isSelected = f.watch("style") === style.id;
              const Icon = style.icon;
              return (
                <button
                  key={style.id}
                  type="button"
                  data-testid={`button-style-${style.id}`}
                  onClick={() => f.setValue("style", style.id as RoastStyle)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 border ${
                    isSelected 
                      ? "bg-primary text-primary-foreground border-primary neon-glow-primary" 
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  <Icon size={16} className={isSelected ? "animate-pulse" : ""} />
                  <span className="capitalize">{style.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Languages */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-foreground/80">Language</label>
          <div className="flex flex-wrap gap-2">
            {["english", "hinglish", "hindi", "spanish", "french"].map((lang) => {
              const isSelected = f.watch("language") === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  data-testid={`pill-language-${lang}`}
                  onClick={() => f.setValue("language", lang as Language)}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${
                    isSelected 
                      ? "bg-foreground text-background border-foreground" 
                      : "bg-muted text-foreground/60 border-border hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Intensity */}
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-foreground/80">Burn Intensity</label>
            <span className={`text-sm font-black uppercase tracking-wider ${intensityLabels[intensity].color}`}>
              {intensityLabels[intensity].label}
            </span>
          </div>
          <Slider
            data-testid="slider-intensity"
            min={1}
            max={5}
            step={1}
            value={[intensity]}
            onValueChange={(vals) => f.setValue("intensity", vals[0])}
            className="w-full"
          />
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30 pb-20">
      
      <WorldwideCounter />

      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Background is intentionally pure — neon is reserved for borders, glows, and accents only. */}
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 md:py-16 z-10 flex flex-col gap-12 items-center">
        
        {/* Header / Sound Toggle */}
        <div className="flex justify-end w-full max-w-3xl">
          <button 
            data-testid="button-sound-toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-primary transition-colors border border-border"
            title={soundEnabled ? "Mute sound 🔇" : "Enable sound 🔊"}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>

        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-6 w-full">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-2"
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
            className="text-lg md:text-xl text-muted-foreground max-w-lg mb-4"
          >
            Tell us about yourself and get a savage, funny roast instantly. Don't take it personally. 😂
          </motion.p>

          <Dialog open={friendDialogOpen} onOpenChange={setFriendDialogOpen}>
            <DialogTrigger asChild>
              <button 
                data-testid="button-roast-friend"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-secondary/20 border border-secondary/50 text-secondary hover:bg-secondary/30 transition-all font-bold"
              >
                <Target size={18} /> 🎯 Roast My Friend
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display font-bold neon-text-primary">Roast Your Friend</DialogTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Filling for a friend? Add their details below — we'll generate a private link to share. 😈
                </p>
              </DialogHeader>
              
              {!friendRoast ? (
                <form onSubmit={friendForm.handleSubmit(onFriendSubmit)} className="flex flex-col gap-6 mt-4">
                  {renderFormFields(friendForm, true)}
                  <button 
                    type="submit"
                    disabled={generateRoast.isPending}
                    className="w-full bg-gradient-to-r from-primary to-secondary text-foreground font-bold text-xl py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 neon-glow-primary flex justify-center items-center gap-2"
                  >
                    {generateRoast.isPending ? <><Flame className="animate-bounce" /> Cooking...</> : "Generate Share Link"}
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-6 mt-4 items-center text-center">
                  <div className="p-4 bg-muted border border-border rounded-xl w-full">
                    <p className="text-lg font-bold text-foreground mb-2">"{friendRoast.text}"</p>
                  </div>
                  
                  <div className="w-full flex flex-col gap-3">
                    <button 
                      data-testid="button-copy-friend-link"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/roast/${friendRoast.id}`);
                        toast({ title: "Link Copied!", description: "Share it with your friend." });
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-primary/20 text-primary border border-primary/30 rounded-lg font-bold transition-colors"
                    >
                      <Copy size={18} /> Copy Private Link
                    </button>
                    <button 
                      onClick={() => {
                        const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/roast/${friendRoast.id}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent("I made an AI roast you. Check this out: " + url)}`, "_blank");
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 rounded-lg font-bold transition-colors"
                    >
                      <Share2 size={18} /> Share to WhatsApp
                    </button>
                    <button onClick={() => setFriendRoast(null)} className="text-muted-foreground hover:text-foreground mt-2 text-sm underline">
                      Roast another friend
                    </button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {!currentRoast && (
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onSubmit={form.handleSubmit(onSubmit)} 
              className="w-full max-w-3xl mt-6 p-6 md:p-8 bg-card border border-border rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-6"
            >
              {renderFormFields(form, false)}

              <button 
                type="submit"
                data-testid="button-roast-me"
                disabled={generateRoast.isPending}
                className="mt-6 w-full bg-gradient-to-r from-primary to-secondary text-foreground font-bold text-2xl py-5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none neon-glow-primary flex justify-center items-center gap-3"
              >
                {generateRoast.isPending ? (
                  <>
                    <Flame className="animate-bounce" size={28} /> 
                    <span className="animate-pulse">AI is cooking...</span>
                  </>
                ) : (
                  "Roast Me 🔥"
                )}
              </button>
            </motion.form>
          )}
        </section>

        {/* Result Area */}
        <AnimatePresence mode="wait">
          {currentRoast && (
            <motion.section
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-3xl mt-4"
            >
              <RoastCard 
                roast={currentRoast} 
                onRetry={handleRetry} 
                onRoastHarder={form.getValues("intensity") < 5 ? handleRoastHarder : undefined} 
              />
            </motion.section>
          )}
        </AnimatePresence>

        <Leaderboard />

        {/* Trending Grid */}
        <section className="mt-12 flex flex-col gap-8 w-full max-w-5xl mx-auto">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-2xl font-bold font-display flex items-center gap-2 text-foreground">
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
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-bold text-foreground/90 truncate pr-2">
                      {roast.name ? `${roast.name}, ${roast.job}` : `@${(roast as any).target || 'Anonymous'}`}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {roast.style}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-foreground/80">
                    "{roast.text}"
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-[10px] text-muted-foreground/50 font-mono">
                    {new Date(roast.createdAt).toLocaleTimeString()}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>🔥</span>
                    <span>{roast.intensity}/5</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="w-full bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
          <div className="flex flex-col items-center gap-2 relative z-10">
            <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Victims Today 💀</h3>
            <p className="text-4xl md:text-5xl font-display font-bold text-foreground" data-testid="text-stats-users">
              {stats?.usersToday.toLocaleString() ?? "—"}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 relative z-10">
            <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Total Roasts 🏆</h3>
            <p className="text-4xl md:text-5xl font-display font-bold text-primary neon-text-primary" data-testid="text-stats-total">
              {stats?.totalRoasts.toLocaleString() ?? "—"}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 relative z-10">
            <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Roasts / Min ⚡</h3>
            <p className="text-4xl md:text-5xl font-display font-bold text-secondary" data-testid="text-stats-rpm">
              {stats?.roastsPerMinute.toLocaleString() ?? "—"}
            </p>
          </div>
        </section>

      </main>

      <footer className="w-full py-8 border-t border-border bg-card z-10 mt-auto">
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
