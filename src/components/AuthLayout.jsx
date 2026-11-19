import React from "react";
import AuthBrand from "@/components/auth/AuthBrand";
import AuthPanel from "@/components/auth/AuthPanel";
import AuthFooter from "@/components/auth/AuthFooter";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="auth-shell min-h-screen flex bg-background text-foreground font-body">
      <AuthPanel />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-14 flex items-center px-5 bg-auth-panel shrink-0">
          <AuthBrand compact />
        </header>
        <main className="flex-1 flex items-center justify-center overflow-y-auto px-5 py-10">
          <div className="w-full max-w-[440px]">
            <div className="rounded-2xl bg-card border border-border shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-20px_rgba(15,23,42,0.15)] px-7 py-8 sm:px-9 sm:py-9">
              <div className="mb-7">
                <h1 className="text-[24px] font-extrabold text-foreground tracking-tight leading-tight">{title}</h1>
                {subtitle && <p className="text-[13.5px] text-muted-foreground mt-1.5 leading-relaxed">{subtitle}</p>}
              </div>
              {children}
            </div>
            {footer && <div className="mt-5 text-center text-[12.5px] text-muted-foreground [&_a]:text-primary [&_a]:font-semibold [&_a]:hover:underline">{footer}</div>}
          </div>
        </main>
        <AuthFooter />
      </div>
    </div>
  );
}