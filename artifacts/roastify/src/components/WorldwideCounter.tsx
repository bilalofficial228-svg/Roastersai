import { useEffect, useState } from "react";
import { useGetRoastStats, getGetRoastStatsQueryKey } from "@workspace/api-client-react";
import { AnimatePresence, motion } from "framer-motion";

export function WorldwideCounter() {
  const { data: stats } = useGetRoastStats({ query: { refetchInterval: 5000, queryKey: getGetRoastStatsQueryKey() } });
  const apiCount = stats?.worldwideToday || 0;
  
  const [count, setCount] = useState(apiCount);

  useEffect(() => {
    if (apiCount > count) {
      setCount(apiCount);
    }
  }, [apiCount, count]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 4) + 1);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-red-900/80 via-pink-900/80 to-red-900/80 text-white py-2 px-4 text-center font-bold text-sm tracking-widest uppercase border-b border-red-500/30 backdrop-blur-md flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
      <span>🔥</span>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={count}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="inline-block tabular-nums"
        >
          {count.toLocaleString()}
        </motion.span>
      </AnimatePresence>
      <span>people roasted worldwide today</span>
    </div>
  );
}
