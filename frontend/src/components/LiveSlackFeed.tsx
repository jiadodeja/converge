'use client';

import React, { useEffect, useState } from 'react';
import { Hash, Radio, CheckCircle2 } from 'lucide-react';

// Address of the FastAPI backend. Change it with NEXT_PUBLIC_API_URL if needed.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FeedItem {
  id: string;
  employee_id: string;
  employee_name?: string;
  channel_id?: string;
  message: string;
  source: string;
  replied_in_slack?: boolean;
  insight: {
    eligibility_summary: string;
    recommended_action: string;
    adp_api_endpoint: string;
  };
}

export const LiveSlackFeed: React.FC = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [connected, setConnected] = useState(false);

  // Ask the backend for new Slack messages every 3 seconds
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/slack/feed`);
        const data = await res.json();
        setItems([...data.feed].reverse()); // newest first
        setConnected(true);
      } catch {
        setConnected(false);
      }
    };
    load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="rounded-2xl border border-indigo-500/30 bg-zinc-950/60 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">Live Slack Feed</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Real Slack + RAG + GPT-4o
          </span>
        </div>
        <span
          className={`flex items-center gap-1 text-[11px] ${
            connected ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          <Radio className="w-3 h-3" />
          {connected ? 'Backend connected' : 'Backend offline (port 8000)'}
        </span>
      </div>
      <p className="text-xs text-zinc-400 mb-3">
        Messages sent in your Slack channel show up here with the AI action plan.
      </p>

      {items.length === 0 ? (
        <p className="text-xs text-zinc-400 border border-dashed border-zinc-800 rounded-lg p-4 text-center">
          No Slack messages yet. Send a message in the channel where the Converge bot is added.
        </p>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-zinc-200">
                  {item.employee_name || item.employee_id}
                </span>
                {item.replied_in_slack && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    Replied in Slack
                  </span>
                )}
              </div>
              <p className="text-zinc-300 bg-[#1A1D21] border border-zinc-800 rounded-lg p-2 mb-2">
                {item.message}
              </p>
              <div className="grid gap-2 md:grid-cols-3">
                <div className="rounded-lg border border-zinc-800 p-2">
                  <h3 className="font-semibold text-emerald-400 mb-1">Eligibility</h3>
                  <p className="text-zinc-300 leading-relaxed">{item.insight.eligibility_summary}</p>
                </div>
                <div className="rounded-lg border border-zinc-800 p-2">
                  <h3 className="font-semibold text-amber-400 mb-1">Next steps</h3>
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
                    {item.insight.recommended_action}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 p-2">
                  <h3 className="font-semibold text-indigo-400 mb-1">ADP endpoint</h3>
                  <code className="text-zinc-300 break-all">{item.insight.adp_api_endpoint}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
