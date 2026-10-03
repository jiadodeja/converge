'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

// Address of the FastAPI backend. Change it with NEXT_PUBLIC_API_URL if needed.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface LiveResult {
  eligibility_summary: string;
  recommended_action: string;
  adp_api_endpoint: string;
}

const SAMPLE_MESSAGE =
  'Hey Sarah, expecting our second kid in August! Do I get 12 weeks of leave, and do I have to exhaust my PTO first?';

export const LiveAnalyzer: React.FC = () => {
  const [message, setMessage] = useState(SAMPLE_MESSAGE);
  const [result, setResult] = useState<LiveResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/insights/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: 'EMP-90421',
          manager_id: 'sarah-connor',
          message,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Backend returned status ${res.status}`);
      }
      setResult(await res.json());
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not reach the backend. Is it running on port 8000?'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-indigo-500/30 bg-zinc-950/60 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <h2 className="text-sm font-bold text-white">Live Analyzer</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          Real backend (RAG + GPT-4o)
        </span>
      </div>
      <p className="text-xs text-zinc-400 mb-3">
        Paste any messy message from an employee. The backend searches the handbook and writes the action plan.
      </p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
      />

      <button
        onClick={analyze}
        disabled={loading || !message.trim()}
        className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {loading ? 'Analyzing...' : 'Analyze message'}
      </button>

      {error && (
        <p className="mt-3 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-3 grid gap-3 text-xs md:grid-cols-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <h3 className="font-semibold text-emerald-400 mb-1">Eligibility</h3>
            <p className="text-zinc-300 leading-relaxed">{result.eligibility_summary}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <h3 className="font-semibold text-amber-400 mb-1">Next steps for the manager</h3>
            <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{result.recommended_action}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <h3 className="font-semibold text-indigo-400 mb-1">ADP endpoint</h3>
            <code className="text-zinc-300 break-all">{result.adp_api_endpoint}</code>
          </div>
        </div>
      )}
    </section>
  );
};
