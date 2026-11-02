import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function HelpButton({ onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200"
      title="Show or hide the help section"
    >
      <HelpCircle className="w-4 h-4 text-white" />
    </button>
  );
}