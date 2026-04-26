import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  testId?: string;
}

export function CustomSelect({ options, value, onChange, testId }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative w-full" data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full bg-input border border-border rounded-xl text-left flex items-center justify-between text-foreground transition-all hover:border-primary/40"
        style={{ outline: "none", height: 52, padding: "14px 16px", fontSize: 15 }}
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground/50"}>
          {selected?.label || "Select…"}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22, ease: "easeInOut" }}>
          <ChevronDown size={18} style={{ color: "#FF4500" }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.94 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.94 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ transformOrigin: "top", background: "hsl(var(--card))", zIndex: 100 }}
            className="absolute top-full mt-1 left-0 right-0 rounded-xl overflow-hidden shadow-2xl border border-border"
          >
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-muted ${
                  value === opt.value
                    ? "text-primary font-bold bg-primary/5"
                    : "text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
