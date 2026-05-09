import React, { useEffect, useRef, useState } from 'react';

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  const rafRef = useRef();
  useEffect(() => {
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return val;
}

export default function StatCard({ label, value, prefix = '', suffix = '', icon: Icon, color = 'blue', trend }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0);

  const colorMap = {
    blue:   'from-blue-500/10 to-blue-600/5 border-blue-500/20 dark:border-blue-500/30',
    teal:   'from-teal-500/10 to-teal-600/5 border-teal-500/20 dark:border-teal-500/30',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20 dark:border-purple-500/30',
    amber:  'from-amber-500/10 to-amber-600/5 border-amber-500/20 dark:border-amber-500/30',
    rose:   'from-rose-500/10 to-rose-600/5 border-rose-500/20 dark:border-rose-500/30',
  };
  const iconMap = {
    blue: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    teal: 'bg-teal-500/20 text-teal-600 dark:text-teal-400',
    purple: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
  };

  return (
    <div className={`relative rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-sm ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
          <p className="text-2xl font-bold text-foreground font-display">
            {prefix}{typeof value === 'number' ? animated.toLocaleString() : value}{suffix}
          </p>
          {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}