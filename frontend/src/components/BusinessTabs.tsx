'use client';

import React from 'react';
import { Home } from 'lucide-react';
import { DOMAINS, DOMAIN_ORDER, DomainTab } from '../lib/domains';

interface BusinessTabsProps {
  active: DomainTab;
  onChange: (tab: DomainTab) => void;
  counts: Record<DomainTab, number>; // how many open cases each business has
  mode: 'demo' | 'live';
}

// Names used in the sidebar (the same wording ADP uses in its own menu)
const SIDEBAR_LABEL: Record<DomainTab, string> = {
  all: 'Home',
  hr: 'HR',
  payroll: 'Payroll',
  insurance: 'Insurance & Benefits',
  retirement: 'Retirement',
};

// Left sidebar styled like the ADP side menu: blue panel, white icons and labels.
// It switches between the four businesses and the "Home" view that shows all of them together.
export const BusinessTabs: React.FC<BusinessTabsProps> = ({ active, onChange, counts, mode }) => {
  const items: DomainTab[] = ['all', ...DOMAIN_ORDER];

  return (
    <aside className="md:w-60 shrink-0 bg-gradient-to-b from-[#2a409a] to-[#1d2f7c] text-white md:min-h-[calc(100vh-72px)]">
      <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible p-2 md:p-3">
        {items.map((id, index) => {
          const d = DOMAINS[id];
          const Icon = id === 'all' ? Home : d.icon;
          const isActive = id === active;
          return (
            <React.Fragment key={id}>
              {index === 1 && (
                <div className="hidden md:block px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/60">
                  Businesses
                </div>
              )}
              <button
                onClick={() => onChange(id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive ? 'bg-white/20 text-white' : 'text-white/85 hover:bg-white/10'
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="flex-1 text-left">{SIDEBAR_LABEL[id]}</span>
                {counts[id] > 0 && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                    {mode === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-[#6ee7b7] animate-pulse" />}
                    {counts[id]}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </nav>
    </aside>
  );
};
