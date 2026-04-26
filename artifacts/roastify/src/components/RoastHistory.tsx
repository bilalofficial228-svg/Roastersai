import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Share2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface HistoryEntry {
  id: number;
  name: string;
  job: string;
  city: string;
  style: string;
  language: string;
  intensity: number;
  roastText: string;
  date: string;
}

const STORAGE_KEY = "roastersai:history";
const MAX_ENTRIES = 20;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(entry: Omit<HistoryEntry, "id" | "date">) {
  try {
    const existing = loadHistory();
    const newEntry: HistoryEntry = {
      ...entry,
      id: Date.now(),
      date: new Date().toLocaleString(),
    };
    const updated = [newEntry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

interface RoastHistoryProps {
  open: boolean;
  onClose: () => void;
}

export function RoastHistory({ open, onClose }: RoastHistoryProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setEntries(loadHistory());
      setConfirmClear(false);
    }
  }, [open]);

  const deleteEntry = (id: number) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearAll = () => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
    setConfirmClear(false);
  };

  const copyEntry = (entry: HistoryEntry) => {
    navigator.clipboard.writeText(entry.roastText).catch(() => {});
    toast({ title: "Copied! 🔥", description: "Roast copied to clipboard." });
  };

  const shareEntry = (entry: HistoryEntry) => {
    const text = `"${entry.roastText}" — roasted by RoastersAI.com`;
    if (navigator.share) {
      navigator.share({ title: "My Roast 🔥", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
      toast({ title: "Copied!", description: "Roast text copied — paste it anywhere." });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.7)" }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden"
            style={{
              width: "min(400px, 85vw)",
              background: "var(--history-bg, #111111)",
              borderLeft: "1px solid var(--history-border, #222222)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: "1px solid var(--history-border, #222222)" }}
            >
              <h2 className="text-lg font-bold font-display" style={{ color: "var(--history-text, #FFFFFF)" }}>
                🔥 Your Roast History
              </h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:opacity-70 transition-opacity"
                style={{ background: "rgba(255,255,255,0.1)", color: "var(--history-text, #FFFFFF)" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
                  <span className="text-5xl">🔥</span>
                  <p className="font-bold text-lg" style={{ color: "var(--history-text, #FFFFFF)" }}>No roasts yet!</p>
                  <p style={{ color: "var(--history-muted, #666666)" }}>Get roasted first 🔥</p>
                </div>
              ) : (
                entries.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-xl p-4 flex flex-col gap-2"
                    style={{
                      background: "var(--history-card, #1A1A1A)",
                      border: "1px solid var(--history-card-border, #2A2A2A)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm" style={{ color: "var(--history-text, #FFFFFF)" }}>
                          {entry.name}, {entry.job}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--history-muted, #666666)" }}>
                          {entry.city} · {entry.date}
                        </p>
                      </div>

                      {/* Action buttons — bigger */}
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => copyEntry(entry)}
                          className="flex items-center justify-center rounded-xl hover:opacity-75 active:scale-95 transition-all"
                          style={{
                            width: 38, height: 38,
                            background: "rgba(100,100,100,0.15)",
                            color: "var(--history-muted, #888)",
                            border: "1px solid rgba(120,120,120,0.2)",
                          }}
                          title="Copy roast text"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => shareEntry(entry)}
                          className="flex items-center justify-center rounded-xl hover:opacity-75 active:scale-95 transition-all"
                          style={{
                            width: 38, height: 38,
                            background: "rgba(255,46,136,0.12)",
                            color: "#FF2E88",
                            border: "1px solid rgba(255,46,136,0.25)",
                          }}
                          title="Share"
                        >
                          <Share2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="flex items-center justify-center rounded-xl hover:opacity-75 active:scale-95 transition-all"
                          style={{
                            width: 38, height: 38,
                            background: "rgba(255,0,85,0.12)",
                            color: "#FF2E88",
                            border: "1px solid rgba(255,46,136,0.22)",
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <p
                      className="text-sm italic leading-snug cursor-pointer"
                      style={{ color: "var(--history-muted, #888888)" }}
                      onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                    >
                      {expanded === entry.id
                        ? entry.roastText
                        : entry.roastText.length > 100
                          ? entry.roastText.slice(0, 100) + "..."
                          : entry.roastText}
                    </p>

                    {entry.roastText.length > 100 && (
                      <button
                        onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                        className="flex items-center gap-1 text-xs font-medium self-start hover:opacity-70 transition-opacity"
                        style={{ color: "#FF2E88" }}
                      >
                        {expanded === entry.id ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
                      </button>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded"
                        style={{ background: "rgba(255,46,136,0.10)", color: "#FF2E88", border: "1px solid rgba(255,46,136,0.22)" }}
                      >
                        {entry.style}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {entries.length > 0 && (
              <div
                className="px-4 py-4 shrink-0"
                style={{ borderTop: "1px solid var(--history-border, #222222)" }}
              >
                <AnimatePresence mode="wait">
                  {confirmClear ? (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="rounded-xl p-4 flex flex-col gap-3"
                      style={{ background: "rgba(255,0,85,0.08)", border: "1px solid rgba(255,0,85,0.25)" }}
                    >
                      <p className="text-sm font-bold text-center" style={{ color: "var(--history-text, #FFFFFF)" }}>
                        🗑️ Delete all roast history?
                      </p>
                      <p className="text-xs text-center" style={{ color: "var(--history-muted, #888)" }}>
                        This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmClear(false)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                          style={{ border: "1px solid var(--history-border, #333)", color: "var(--history-muted, #888)", background: "transparent" }}
                        >
                          No, keep it
                        </button>
                        <button
                          onClick={clearAll}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                          style={{ background: "linear-gradient(135deg, #FF2E88, #FF4500)", color: "#FFFFFF", border: "none" }}
                        >
                          Yes, delete all
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="clear-btn"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      onClick={() => setConfirmClear(true)}
                      className="w-full py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-70 active:scale-[0.98]"
                      style={{ border: "1px solid #FF2E88", color: "#FF2E88", background: "transparent" }}
                    >
                      🗑️ Clear All History
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
