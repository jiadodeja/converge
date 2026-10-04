'use client';

import React from 'react';
import { DOMAINS, DOMAIN_ORDER, DomainTab } from '../lib/domains';

interface BusinessTabsProps {
  active: DomainTab;
  onChange: (tab: DomainTab) => void;
  counts: Record<DomainTab, number>; // how many cases each tab has
  mode: 'demo' | 'live';
}

// The row of "business lens" tabs: All Businesses, HR, Payroll, Insurance, Retirement.
export const BusinessTabs: React.FC<BusinessTabsProps> = ({ active, onChange, counts, mode }) => {
  const tabs: DomainTab[] = ['all', ...DOMAIN_ORDER];

  return (
    <div className="border-b border-zinc-800/80 bg-zinc-950/40 px-4 sm:px-6 lg:px-8 py-2.5">
      <div className="max-w-[1700px] mx-auto flex items-center gap-2 overflow-x-auto">
        {tabs.map((id) => {
          const d = DOMAINS[id];
          const Icon = d.icon;
          const isActive = id === active;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? d.activeTab + ' shadow-lg'
                  : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 bg-zinc-900/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{d.label}</span>
              {counts[id] > 0 && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/30 text-[10px]">
                  {mode === 'live' && <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${d.dot}`} />}
                  {counts[id]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
