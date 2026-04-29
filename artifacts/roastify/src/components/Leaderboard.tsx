import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import type { Roast } from "@workspace/api-client-react";

interface Props {
  roasts: Roast[];
  fireVotes: Record<string, number>;
}

interface DisplayEntry {
  id: string;
  name: string;
  job: string;
  city?: string;
  text: string;
  fireCount: number;
  language: string;
  style: string;
  isSample: boolean;
}

const LANG_LABELS: Record<string, string> = {
  english: "🇺🇸 English",
  hindi: "🇮🇳 Hindi",
  roman_urdu: "🇵🇰 Roman Urdu",
  spanish: "🇪🇸 Spanish",
  french: "🇫🇷 French",
  german: "🇩🇪 German",
  portuguese: "🇧🇷 Portuguese",
};

const SAMPLES: DisplayEntry[] = [
  {
    id: "sample-1",
    name: "Bilal",
    job: "Engineer",
    city: "Karachi",
    text: "Bilal, you're a software engineer in Karachi — basically a load shedding expert with a laptop. Your code has more bugs than KESC has excuses, and you're single because even WiFi drops your connection faster than she did. 💀🔥",
    fireCount: 47,
    language: "english",
    style: "savage",
    isSample: true,
  },
  {
    id: "sample-2",
    name: "Priya",
    job: "Student",
    city: "Mumbai",
    text: "प्रिया, मुंबई में पढ़ाई कम Netflix ज्यादा 💀 लोकल ट्रेन से फास्ट तेरा future dark mode में है 🌑 SRK भी तेरा syllabus देख के रोने लगे!",
    fireCount: 38,
    language: "hindi",
    style: "dark",
    isSample: true,
  },
  {
    id: "sample-3",
    name: "Ahmed",
    job: "Doctor",
    city: "Dubai",
    text: "Ahmed bhai, Dubai mein doctor ho — masha Allah! 😄 Mareez toh theek ho jaate hain lekin teri apni zindagi ka nuskha abhi tak ghalat hai 😂 Single isliye ki rishta aunty bhi tujhe dekh ke seedha ghar chali gayi! ✅",
    fireCount: 31,
    language: "roman_urdu",
    style: "friendly",
    isSample: true,
  },
  {
    id: "sample-4",
    name: "Maria",
    job: "Designer",
    city: "Madrid",
    text: "Maria, diseñadora en Madrid pero tu vida tiene más bugs que tu código en Figma 💀 Cambias de fuente más rápido que de novio y sigues sin encontrar el diseño correcto 🔥😂",
    fireCount: 24,
    language: "spanish",
    style: "savage",
    isSample: true,
  },
  {
    id: "sample-5",
    name: "Chen",
    job: "Content Creator",
    city: "Shanghai",
    text: "Chen, content creator in Shanghai with 47 followers and a ring light worth more than your monthly revenue 🌑 Your 'going viral' strategy is just posting at 3am and hoping the algorithm takes pity on you. 💀",
    fireCount: 18,
    language: "english",
    style: "dark",
    isSample: true,
  },
];

const MIN_FIRE = 5;
const MAX_ENTRIES = 5;

const RANK_STYLES: Record<number, { borderLeft: string; boxShadow?: string; bg: string; opacity: number; rankColor: string }> = {
  0: { borderLeft: "3px solid #FFD700", boxShadow: "0 0 20px rgba(255,215,0,0.15)",  bg: "rgba(255,215,0,0.05)",  opacity: 1,   rankColor: "#FFD700" },
  1: { borderLeft: "3px solid #C0C0C0", boxShadow: "0 0 15px rgba(192,192,192,0.1)", bg: "rgba(192,192,192,0.03)", opacity: 1,   rankColor: "#C0C0C0" },
  2: { borderLeft: "3px solid #CD7F32", boxShadow: "0 0 15px rgba(205,127,50,0.1)",  bg: "rgba(205,127,50,0.03)",  opacity: 1,   rankColor: "#CD7F32" },
  3: { borderLeft: "3px solid #2A2A2A", bg: "transparent", opacity: 0.5, rankColor: "#555555" },
  4: { borderLeft: "3px solid #2A2A2A", bg: "transparent", opacity: 0.5, rankColor: "#555555" },
};

export function Leaderboard({ roasts, fireVotes }: Props) {
  const realEntries: DisplayEntry[] = roasts
    .filter(r => (fireVotes[r.id] ?? 0) >= MIN_FIRE)
    .sort((a, b) => (fireVotes[b.id] ?? 0) - (fireVotes[a.id] ?? 0))
    .map(r => ({
      id: r.id,
      name: r.name || "Anonymous",
      job: r.job,
      city: r.city,
      text: r.text,
      fireCount: fireVotes[r.id] ?? 0,
      language: r.language,
      style: r.style,
      isSample: false,
    }));

  const slotsLeft = MAX_ENTRIES - realEntries.length;
  const sampleFill = slotsLeft > 0 ? SAMPLES.slice(0, slotsLeft) : [];

  const entries: DisplayEntry[] = [...realEntries, ...sampleFill];

  return (
    <section className="mt-16 w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Trophy className="w-8 h-8" style={{ color: "#FFD700" }} />
        <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">
          Hall of Shame — Most Savage Roasts Today
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {entries.map((entry, i) => {
          const rs = RANK_STYLES[i] ?? RANK_STYLES[4];
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              data-testid={`card-leaderboard-${i + 1}`}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border-y border-r border-border transition-all"
              style={{
                backgroundColor: rs.bg || "hsl(var(--card))",
                borderLeft: rs.borderLeft,
                boxShadow: rs.boxShadow,
                opacity: rs.opacity,
              }}
            >
              <div className="flex items-center gap-4 min-w-[150px]">
                <span className="text-2xl font-bold font-display" style={{ color: rs.rankColor }}>
                  #{i + 1}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-foreground truncate max-w-[120px]">{entry.name}</span>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">{entry.job}</span>
                  {entry.city && (
                    <span className="text-[10px] text-muted-foreground/60">{entry.city}</span>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-1.5">
                <p
                  className="text-sm sm:text-base italic leading-snug"
                  style={{
                    color: "#999999",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  "{entry.text}"
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground/70">
                    {LANG_LABELS[entry.language] ?? entry.language}
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {entry.style}
                  </span>
                  {entry.isSample && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded text-muted-foreground/40 bg-muted/30">
                      sample
                    </span>
                  )}
                </div>
              </div>

              <div
                className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full font-bold tabular-nums"
                style={{
                  backgroundColor: "rgba(255,69,0,0.12)",
                  border: "1px solid rgba(255,69,0,0.35)",
                  color: "#FF4500",
                }}
              >
                <span>🔥</span>
                <span>{entry.fireCount}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {realEntries.length === 0 && (
        <p className="text-xs text-muted-foreground/50 text-center -mt-2">
          Sample entries shown. Vote 🔥 on Live Feed roasts to earn a real spot!
        </p>
      )}
    </section>
  );
}
