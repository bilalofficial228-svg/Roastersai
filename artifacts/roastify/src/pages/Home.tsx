import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Ghost, Zap, HeartPulse, Sparkles, Target, Copy, Share2, History, Loader2, Bot } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
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

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RoastHistory, saveToHistory } from "@/components/RoastHistory";

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
  job: z.enum(["student", "engineer", "doctor", "designer", "unemployed", "influencer", "teacher", "lawyer", "business_owner", "content_creator", "chef", "nurse", "accountant", "marketing", "sales", "other"] as const),
  city: z.string().min(1, "City is required").max(60, "City is too long"),
  weakness: z.string().max(120, "Keep it short!").optional().nullable(),
  status: z.enum(["single", "in_relationship", "married", "complicated", "recently_broke_up", "forever_alone"] as const),
  style: z.enum(["friendly", "savage", "dark", "desi"] as const),
  language: z.enum(["english", "hindi", "roman_urdu", "spanish", "french", "german", "portuguese"] as const),
});

type FormValues = z.infer<typeof formSchema>;


export default function Home() {
  const [currentRoast, setCurrentRoast] = useState<Roast | null>(null);
  const [friendDialogOpen, setFriendDialogOpen] = useState(false);
  const [friendRoast, setFriendRoast] = useState<Roast | null>(null);
  const [friendCopied, setFriendCopied] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [roastCount, setRoastCount] = useState<number>(() => {
    try { return parseInt(localStorage.getItem("roastersai:count") || "0", 10) || 0; } catch { return 0; }
  });
  const [fireVotes, setFireVotes] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem("roastersai:fire_votes") || "{}"); } catch { return {}; }
  });
  const [myVotes, setMyVotes] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("roastersai:my_votes") || "[]")); } catch { return new Set(); }
  });
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [feedLangFilter, setFeedLangFilter] = useState<string>("all");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const generateRoast = useGenerateRoast();
  const isLoadingRef = useRef(false);
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
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues
  });

  const friendForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues
  });

  const toggleFire = (id: string) => {
    setFireVotes(prev => {
      const current = prev[id] ?? 0;
      const next = { ...prev, [id]: myVotes.has(id) ? Math.max(0, current - 1) : current + 1 };
      try { localStorage.setItem("roastersai:fire_votes", JSON.stringify(next)); } catch {}
      return next;
    });
    setMyVotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      try { localStorage.setItem("roastersai:my_votes", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const onSubmit = async (values: FormValues) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setCurrentRoast(null);
    try {
      const roast = await generateRoast.mutateAsync({ data: { ...values, intensity: 3 } });
      setCurrentRoast(roast);
      triggerHaptic();
      setRoastCount(prev => {
        const next = prev + 1;
        try { localStorage.setItem("roastersai:count", String(next)); } catch {}
        return next;
      });
      saveToHistory({
        name: roast.name,
        job: roast.job,
        city: roast.city,
        style: roast.style,
        language: roast.language,
        intensity: roast.intensity,
        roastText: roast.text,
      });
      queryClient.invalidateQueries({ queryKey: getListTrendingRoastsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetRoastStatsQueryKey() });
    } catch (err: any) {
      const isQuota = err?.status === 429 || (err?.data?.error ?? "").toLowerCase().includes("quota");
      toast({
        title: isQuota ? "Rate limit reached" : "Error",
        description: isQuota
          ? "API quota exceeded. Please try again in a few minutes."
          : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      isLoadingRef.current = false;
    }
  };

  const onFriendSubmit = async (values: FormValues) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setFriendRoast(null);
    try {
      const roast = await generateRoast.mutateAsync({ data: { ...values, intensity: 3 } });
      setFriendRoast(roast);
      triggerHaptic();
      queryClient.invalidateQueries({ queryKey: getListTrendingRoastsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetRoastStatsQueryKey() });
    } catch (err: any) {
      const isQuota = err?.status === 429 || (err?.data?.error ?? "").toLowerCase().includes("quota");
      toast({
        title: isQuota ? "Rate limit reached" : "Error",
        description: isQuota
          ? "API quota exceeded. Please try again in a few minutes."
          : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      isLoadingRef.current = false;
    }
  };

  const handleRetry = () => {
    onSubmit(form.getValues());
  };

  const handleNewRoast = () => {
    setCurrentRoast(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderFormFields = (f: ReturnType<typeof useForm<FormValues>>, isFriend: boolean = false) => {
    return (
      <div className="flex flex-col gap-6 w-full text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-foreground">{isFriend ? "Their Name" : "Your Name"}</label>
            <input 
              data-testid="input-name"
              {...f.register("name")}
              placeholder="e.g. John Doe"
              className="w-full bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-lg outline-none transition-all placeholder:text-muted-foreground/50"
            />
            {f.formState.errors.name && <span className="text-destructive text-xs font-medium">{f.formState.errors.name.message}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-foreground">City</label>
            <input 
              data-testid="input-city"
              {...f.register("city")}
              placeholder="e.g. New York"
              className="w-full bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-lg outline-none transition-all placeholder:text-muted-foreground/50"
            />
            {f.formState.errors.city && <span className="text-destructive text-xs font-medium">{f.formState.errors.city.message}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-foreground">Job</label>
            <CustomSelect
              testId="select-job"
              value={f.watch("job")}
              onChange={(v) => f.setValue("job", v as FormValues["job"])}
              options={[
                { value: "student",          label: "🎓 Student" },
                { value: "engineer",         label: "⚙️ Engineer" },
                { value: "doctor",           label: "🩺 Doctor" },
                { value: "designer",         label: "🎨 Designer" },
                { value: "teacher",          label: "📚 Teacher" },
                { value: "lawyer",           label: "⚖️ Lawyer" },
                { value: "business_owner",   label: "💼 Business Owner" },
                { value: "content_creator",  label: "🎬 Content Creator" },
                { value: "chef",             label: "👨‍🍳 Chef" },
                { value: "nurse",            label: "🏥 Nurse" },
                { value: "accountant",       label: "🧮 Accountant" },
                { value: "marketing",        label: "📊 Marketing" },
                { value: "sales",            label: "💰 Sales" },
                { value: "unemployed",       label: "😅 Unemployed" },
                { value: "influencer",       label: "📱 Influencer" },
                { value: "other",            label: "🤷 Other" },
              ]}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-foreground">Relationship Status</label>
            <CustomSelect
              testId="select-status"
              value={f.watch("status")}
              onChange={(v) => f.setValue("status", v as FormValues["status"])}
              options={[
                { value: "single",             label: "💔 Single" },
                { value: "in_relationship",    label: "💑 In a Relationship" },
                { value: "married",            label: "💍 Married" },
                { value: "complicated",        label: "😅 It's Complicated" },
                { value: "recently_broke_up",  label: "😭 Recently Broke Up" },
                { value: "forever_alone",      label: "🫠 Forever Alone" },
              ]}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-foreground">Biggest Weakness (Optional)</label>
          <input 
            data-testid="input-weakness"
            {...f.register("weakness")}
            placeholder="e.g. always late, can't say no, addicted to memes"
            className="w-full bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-lg outline-none transition-all placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Styles */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-foreground">Roast Style</label>
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
                      ? "bg-primary/10 text-primary border-primary" 
                      : "bg-muted text-muted-foreground border-border hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  <Icon size={16} className={isSelected ? "animate-pulse" : ""} />
                  <span className="capitalize">{style.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-foreground">Language</label>
          <CustomSelect
            testId="select-language"
            value={f.watch("language")}
            onChange={(v) => f.setValue("language", v as FormValues["language"])}
            options={[
              { value: "english",    label: "🇺🇸 English" },
              { value: "hindi",      label: "🇮🇳 Hindi" },
              { value: "roman_urdu", label: "🇵🇰 Roman Urdu" },
              { value: "spanish",    label: "🇪🇸 Spanish" },
              { value: "french",     label: "🇫🇷 French" },
              { value: "german",     label: "🇩🇪 German" },
              { value: "portuguese", label: "🇧🇷 Portuguese (Brazil)" },
            ]}
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
        
        {/* Header / Controls */}
        <div className="flex justify-end gap-2 w-full max-w-3xl">
          <button
            data-testid="button-history"
            onClick={() => setHistoryOpen(true)}
            title="Roast History"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              color: "inherit",
              cursor: "pointer",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
            className="text-muted-foreground hover:text-primary"
          >
            <History size={22} />
          </button>
        </div>
        <RoastHistory open={historyOpen} onClose={() => setHistoryOpen(false)} />

        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-6 w-full">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-2"
            style={{ backgroundColor: "rgba(255,46,136,0.08)", border: "1px solid rgba(255,46,136,0.28)", color: "#FF2E88" }}
          >
            <Sparkles size={16} /> <span>100% Brutal AI</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="uppercase fire-text"
            style={{ fontSize: "clamp(48px, 12vw, 80px)", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "2px" }}
          >
            Get Roasted by AI
          </motion.h1>
          {roastCount > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: "#FF2E88", fontSize: 13, fontWeight: 600, marginTop: -12 }}
            >
              🔥 You've been roasted {roastCount} time{roastCount !== 1 ? "s" : ""}
            </motion.p>
          )}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="max-w-lg mb-4"
            style={{ fontSize: 16, fontFamily: "'Poppins', sans-serif", fontWeight: 400, color: "var(--subtitle-color, #666666)" }}
          >
            Tell us about yourself and get a savage, funny roast instantly. Don't take it personally. 😂
          </motion.p>

          <Dialog open={friendDialogOpen} onOpenChange={setFriendDialogOpen}>
            <DialogTrigger asChild>
              <button 
                data-testid="button-roast-friend"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-transparent border-2 transition-all font-bold hover:bg-[#FF2E88]/10"
                style={{ borderColor: "#FF2E88", color: "#FF2E88" }}
              >
                <Target size={18} /> Roast My Friend
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display font-bold fire-text">Roast Your Friend</DialogTitle>
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
                    className="w-full fire-bg text-white font-bold text-xl py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 fire-glow flex justify-center items-center gap-2"
                  >
                    {generateRoast.isPending ? <><Loader2 className="animate-spin" size={20} /><span>Cooking…</span></> : "Generate Private Link"}
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-4 mt-4 items-center text-center">
                  <div className="p-4 bg-muted border border-border rounded-xl w-full">
                    <p className="text-lg font-bold text-foreground mb-2">"{friendRoast.text}"</p>
                  </div>

                  {/* Private Link button — between roast and action buttons */}
                  <button
                    onClick={() => {
                      const base = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}`;
                      const url = friendRoast.shortId ? `${base}/r/${friendRoast.shortId}` : `${base}/roast/${friendRoast.id}`;
                      navigator.clipboard.writeText(url);
                      toast({ title: "Private Link Copied!", description: "Share it with your friend." });
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "12px 0",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      background: "rgba(255,46,136,0.08)",
                      border: "2px solid #FF2E88",
                      color: "#FF2E88",
                      transition: "opacity 0.2s",
                    }}
                  >
                    <Copy size={15} /> Copy Private Link
                  </button>

                  <div className="w-full grid grid-cols-3 gap-2">
                    {/* Copy */}
                    <button
                      data-testid="button-copy-friend-link"
                      onClick={() => {
                        navigator.clipboard.writeText(friendRoast.text);
                        setFriendCopied(true);
                        setTimeout(() => setFriendCopied(false), 3500);
                      }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
                        cursor: "pointer", border: friendCopied ? "1px solid rgba(34,197,94,0.5)" : "1px solid hsl(var(--border))",
                        background: friendCopied ? "rgba(34,197,94,0.15)" : "hsl(var(--muted))",
                        color: friendCopied ? "rgb(34,197,94)" : "hsl(var(--foreground))",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {friendCopied ? <>✓ Copied!</> : <><Copy size={14} /> Copy</>}
                    </button>

                    {/* Share */}
                    <button
                      onClick={async () => {
                        const base2 = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}`;
                        const url = friendRoast.shortId ? `${base2}/r/${friendRoast.shortId}` : `${base2}/roast/${friendRoast.id}`;
                        if (navigator.share) {
                          try { await navigator.share({ text: `"${friendRoast.text}" — roasted by RoastersAI.com`, url }); } catch {}
                        } else {
                          navigator.clipboard.writeText(url);
                          toast({ title: "Link Copied!", description: "Share it with your friend." });
                        }
                      }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
                        cursor: "pointer", border: "none",
                        background: "linear-gradient(135deg, #FF2E88, #FF4500)",
                        color: "#fff",
                      }}
                    >
                      <Share2 size={14} /> Share
                    </button>

                    {/* Try Again */}
                    <button
                      onClick={() => setFriendRoast(null)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
                        cursor: "pointer",
                        background: "hsl(var(--muted))",
                        border: "1px solid hsl(var(--border))",
                        color: "hsl(var(--foreground))",
                      }}
                    >
                      Try Again
                    </button>
                  </div>

                  <button
                    onClick={() => setFriendRoast(null)}
                    className="text-muted-foreground hover:text-foreground text-sm underline mt-1"
                  >
                    Roast another friend
                  </button>
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
              className="w-full max-w-3xl mt-6 p-6 md:p-8 premium-card backdrop-blur-sm flex flex-col gap-6"
            >
              {renderFormFields(form, false)}

              <motion.button 
                type="submit"
                data-testid="button-roast-me"
                disabled={generateRoast.isPending}
                whileHover={{ scale: generateRoast.isPending ? 1 : 1.01 }}
                whileTap={{ scale: generateRoast.isPending ? 1 : 0.99 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="mt-6 cta-netflix-btn text-white disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-3"
              >
                {generateRoast.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={22} />
                    <span>AI is cooking…</span>
                  </>
                ) : (
                  <><Bot size={26} color="white" /> Get Roasted</>  
                )}
              </motion.button>
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
                onNewRoast={handleNewRoast}
              />
            </motion.section>
          )}
        </AnimatePresence>

        <Leaderboard roasts={trendingRoasts ?? []} fireVotes={fireVotes} />

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

          {/* Language filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All" },
              { value: "english",    label: "🇺🇸 English" },
              { value: "hindi",      label: "🇮🇳 Hindi" },
              { value: "roman_urdu", label: "🇵🇰 Roman Urdu" },
              { value: "spanish",    label: "🇪🇸 Spanish" },
              { value: "french",     label: "🇫🇷 French" },
              { value: "german",     label: "🇩🇪 German" },
              { value: "portuguese", label: "🇧🇷 Portuguese" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFeedLangFilter(opt.value)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border-none cursor-pointer transition-all duration-200"
                style={{
                  background: feedLangFilter === opt.value ? "#FF4500" : "#1f1f1f",
                  color: feedLangFilter === opt.value ? "#ffffff" : "#9ca3af",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(trendingRoasts ?? [])
              .filter(r => feedLangFilter === "all" || r.language === feedLangFilter)
              .slice(0, 6)
              .sort((a, b) => (fireVotes[b.id] ?? 0) - (fireVotes[a.id] ?? 0))
              .map((roast, i) => {
                const voted = myVotes.has(roast.id);
                const count = fireVotes[roast.id] ?? 0;
                const expanded = expandedCards.has(roast.id);
                const LANG_LABELS: Record<string, string> = {
                  english: "🇺🇸 English", hindi: "🇮🇳 Hindi", roman_urdu: "🇵🇰 Roman Urdu",
                  spanish: "🇪🇸 Spanish", french: "🇫🇷 French", german: "🇩🇪 German", portuguese: "🇧🇷 Portuguese",
                };
                const langLabel = LANG_LABELS[roast.language] ?? roast.language;
                return (
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
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground/70">
                            {langLabel}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            {roast.style}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p
                          className="text-sm font-medium leading-relaxed text-foreground transition-all duration-300"
                          style={expanded ? {} : {
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          "{roast.text}"
                        </p>
                        <button
                          onClick={() => toggleExpand(roast.id)}
                          className="mt-1 text-[12px] font-medium border-none bg-transparent cursor-pointer p-0"
                          style={{ color: "#FF4500" }}
                        >
                          {expanded ? "Show less" : "Read more"}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground/50 font-mono">
                        {new Date(roast.createdAt).toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => toggleFire(roast.id)}
                        className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md transition-all duration-200 border-none cursor-pointer"
                        style={{
                          background: voted ? "rgba(255,69,0,0.12)" : "transparent",
                          color: voted ? "#FF4500" : "#6b7280",
                        }}
                        title={voted ? "Remove fire" : "Fire this roast"}
                      >
                        <span style={{ filter: voted ? "none" : "grayscale(1)", fontSize: "14px" }}>🔥</span>
                        <span>{count}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
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
            <span>RoastersAI © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <a href="/about" className="hover:text-primary transition-colors cursor-pointer">About Us</a>
            <a href="/contact" className="hover:text-primary transition-colors cursor-pointer">Contact</a>
            <a href="/privacy-policy" className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
