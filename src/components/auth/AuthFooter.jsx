import React from 'react';

export default function AuthFooter() {
  return (
    <footer className="h-[52px] bg-card border-t border-auth-footer-border flex items-center px-[22px] gap-4 shrink-0">
      <div className="flex-1" />
      <div className="flex items-center gap-2.5">
        <img src="https://media.base44.com/images/public/6a3aac1387cca7f58c54761e/81f766e50_RBLMark-RH_Blue.png" alt="Rebel Hotel Company" className="w-8 h-8 object-contain" />
        <div className="leading-tight">
          <div className="text-muted-foreground text-[11px] font-medium tracking-wide">Powered by</div>
          <div className="text-primary text-[13px] font-bold tracking-tight">Rebel Hotel Company</div>
        </div>
      </div>
    </footer>
  );
}