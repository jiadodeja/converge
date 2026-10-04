'use client';

import React, { useState } from 'react';
import { ConvergenceInsight, DomainId } from '../types/converge';
import { DOMAINS, DOMAIN_ORDER } from '../lib/domains';
import { MessageSquareQuote, ArrowRight, Route, CheckCircle2, Circle, Terminal } from 'lucide-react';

export interface InsightGroup {
  groupId: string;
  message: string;
  insights: ConvergenceInsight[];
}

interface CrossBusinessViewProps {
  groups: InsightGroup[];
  mode: 'demo' | 'live';
  onOpenCase: (insight: ConvergenceInsight) => void;
}

// One message, many businesses: shows what each ADP business has to do about it.
export const CrossBusinessView: React.FC<CrossBusinessViewProps> = ({ groups, mode, onOpenCase }) => {
  const [selected, setSelected] = useState(0);

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-10 text-center">
        <Route className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-ink">No cross-business messages yet</h3>
        <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto">
          {mode === 'live'
            ? 'Run the demo script to send one message to every business at once:'
            : 'No sample groups found.'}
        </p>
        {mode === 'live' && (
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-[#141c52] border border-zinc-800 font-mono text-xs text-[#6ee7b7]">
            <Terminal className="w-3.5 h-3.5" />
            .\demo.ps1 -Domain all
          </div>
        )}
      </div>
    );
  }

  const group = groups[Math.min(selected, groups.length - 1)];
  const ordered = DOMAIN_ORDER.filter((d) => group.insights.some((i) => (i.domain ?? 'hr') === d));

  return (
    <div className="space-y-5">
      {groups.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-zinc-400 font-medium">Messages:</span>
          {groups.map((g, i) => (
            <button
              key={g.groupId}
              onClick={() => setSelected(i)}
              className={`px-3 py-1 rounded-full border whitespace-nowrap max-w-[260px] truncate ${
                i === selected
                  ? 'bg-[#2f4ba2] border-[#2f4ba2] text-white'
                  : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {g.message}
            </button>
          ))}
        </div>
      )}

      {/* The original message and where the router sent it */}
      <div className="rounded-lg border border-zinc-800 bg-white shadow-[0_2px_10px_rgba(20,28,82,0.10)] p-5">
        <div className="flex items-start gap-3">
          <MessageSquareQuote className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">
              One employee message
            </div>
            <p className="text-sm text-ink leading-relaxed">&ldquo;{group.message}&rdquo;</p>
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-zinc-400">
              <Route className="w-3.5 h-3.5" />
              <span>Router sent it to:</span>
              {ordered.map((d) => {
                const info = DOMAINS[d];
                const Icon = info.icon;
                return (
                  <span
                    key={d}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${info.badge}`}
                  >
                    <Icon className="w-3 h-3" />
                    {info.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* One card per business */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {ordered.map((d: DomainId) => {
          const ins = group.insights.find((i) => (i.domain ?? 'hr') === d)!;
          const info = DOMAINS[d];
          const Icon = info.icon;
          return (
            <div
              key={d}
              className={`rounded-2xl border ${info.border} bg-gradient-to-b ${info.glow} via-zinc-900/70 to-zinc-900/40 p-5 flex flex-col gap-4`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${info.text}`}>
                  <Icon className="w-4 h-4" />
                  {info.label}
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                  {ins.eligibility.status}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-ink leading-snug">{ins.headline}</h4>

              {ins.highlights && (
                <div className="grid grid-cols-3 gap-2">
                  {ins.highlights.slice(0, 3).map((h) => (
                    <div key={h.label} className={`p-2 rounded-lg border ${info.tile}`}>
                      <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">{h.label}</div>
                      <div className={`text-[11px] font-bold mt-0.5 leading-snug ${info.text}`}>{h.value}</div>
                    </div>
                  ))}
                </div>
              )}

              <ul className="space-y-1.5">
                {ins.actionChecklist.slice(0, 3).map((step) => (
                  <li key={step.id} className="flex items-start gap-2 text-xs text-zinc-300">
                    {step.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                    )}
                    <span>{step.text}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-zinc-800/80">
                <span className="text-[10px] font-mono text-zinc-500 truncate">{ins.adpEndpoint}</span>
                <button
                  onClick={() => onOpenCase(ins)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0 hover:brightness-125 transition ${info.badge}`}
                >
                  Open full case <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
