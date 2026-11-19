import React from 'react';
import AuthBrand from '@/components/auth/AuthBrand';
import AuthCarousel from '@/components/auth/AuthCarousel';

export default function AuthPanel() {
  return (
    <aside className="auth-panel hidden lg:flex w-[46%] max-w-[760px] flex-col justify-between p-10 xl:p-14 bg-auth-panel relative overflow-hidden shrink-0">
      <div className="relative z-10"><AuthBrand /></div>
      <div className="relative z-10 max-w-[440px]">
        <h2 className="text-[30px] xl:text-[34px] font-extrabold text-primary-foreground leading-[1.12] tracking-tight">
          Every salary,<br />
          <span className="text-auth-highlight">allocated with clarity.</span>
        </h2>
        <p className="text-[13.5px] text-primary-foreground/65 leading-relaxed mt-3.5">
          The salary allocation console for the REBEL Hotel portfolio. Allocate team salaries across hotels and departments, track budgets against actuals, and see every property, one source of truth.
        </p>
      </div>
      <div className="relative z-10">
        <div className="-mx-10 xl:-mx-14 -mb-2"><AuthCarousel /></div>
        <p className="text-[10.5px] text-primary-foreground/45 mt-3 tracking-wider uppercase font-bold">Salary allocation across the portfolio</p>
      </div>
    </aside>
  );
}