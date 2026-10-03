'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import { ChaosPanel } from '../components/ChaosPanel';
import { ConvergencePanel } from '../components/ConvergencePanel';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { MOCK_PERSONAS, MOCK_MESSY_DATA, MOCK_INSIGHTS } from '../data/mockData';
import { Persona, ConvergenceInsight } from '../types/converge';
import { API_URL, LiveFeedItem, LiveCase, toLiveCase } from '../lib/live';
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  ArrowRightLeft,
  CheckCircle2,
  WifiOff
} from 'lucide-react';

export default function DashboardPage() {
  // Phase 1 & 2 State
  const [activePersona, setActivePersona] = useState<Persona>(MOCK_PERSONAS[0]);
  const [activeInsightId, setActiveInsightId] = useState<string>(MOCK_INSIGHTS[0].id);
  const [submittedInsightIds, setSubmittedInsightIds] = useState<Set<string>>(new Set());
  const [isSubmittingAdp, setIsSubmittingAdp] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Demo mode uses the mock data. Live mode uses real Slack messages from the backend.
  const [mode, setMode] = useState<'demo' | 'live'>('demo');
  const [liveCases, setLiveCases] = useState<LiveCase[]>([]);
  const [liveConnected, setLiveConnected] = useState(false);
  const knownLiveIds = useRef<Set<string> | null>(null);

  const allInsights = useMemo(
    () => (mode === 'demo' ? MOCK_INSIGHTS : liveCases.map((c) => c.insight)),
    [mode, liveCases]
  );
  const allMessyItems = useMemo(
    () => (mode === 'demo' ? MOCK_MESSY_DATA : liveCases.flatMap((c) => c.messy)),
    [mode, liveCases]
  );

  // Filter insights for active manager (Role-Based Access Control)
  const managerInsights = useMemo(() => {
    return allInsights.filter((insight) => insight.managerId === activePersona.id);
  }, [allInsights, activePersona.id]);

  // Ensure active insight matches the manager's roster
  const activeInsight = useMemo(() => {
    const found = managerInsights.find((i) => i.id === activeInsightId);
    return found || managerInsights[0] || null;
  }, [managerInsights, activeInsightId]);

  // Filter messy data streams related to this manager's insights
  const managerMessyItems = useMemo(() => {
    const insightIds = new Set(managerInsights.map((i) => i.id));
    return allMessyItems.filter((item) => insightIds.has(item.relatedInsightId));
  }, [managerInsights, allMessyItems]);

  // Compute pending actions count for this manager
  const pendingActionsCount = useMemo(() => {
    return managerInsights.filter((ins) => !submittedInsightIds.has(ins.id)).length;
  }, [managerInsights, submittedInsightIds]);

  // Toast Helpers
  const addToast = (type: 'success' | 'error' | 'info', title: string, description: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // In Live mode, ask the backend for new Slack messages every 3 seconds
  useEffect(() => {
    if (mode !== 'live') return;
    knownLiveIds.current = null;
    let stopped = false;

    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/slack/feed`);
        const data = await res.json();
        if (stopped) return;

        const feed: LiveFeedItem[] = [...data.feed].reverse(); // newest first
        setLiveCases(feed.map(toLiveCase));
        setLiveConnected(true);

        const ids = feed.map((f) => f.id);
        if (knownLiveIds.current === null) {
          // First load: remember what is there and focus the newest case
          knownLiveIds.current = new Set(ids);
          if (feed.length > 0) setActiveInsightId(`live-${feed[0].id}`);
        } else {
          const fresh = feed.filter((f) => !knownLiveIds.current!.has(f.id));
          if (fresh.length > 0) {
            fresh.forEach((f) => knownLiveIds.current!.add(f.id));
            setActiveInsightId(`live-${fresh[0].id}`);
            addToast(
              'success',
              'New Slack message analyzed',
              `${fresh[0].employee_name || fresh[0].employee_id}: action plan is ready.`
            );
          }
        }
      } catch {
        if (!stopped) setLiveConnected(false);
      }
    };

    load();
    const timer = setInterval(load, 3000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [mode]);

  // Handler: switch between Demo and Live mode
  const handleModeChange = (next: 'demo' | 'live') => {
    if (next === mode) return;
    setMode(next);
    if (next === 'demo') {
      const first = MOCK_INSIGHTS.find((i) => i.managerId === activePersona.id);
      if (first) setActiveInsightId(first.id);
      addToast('info', 'Demo Mode', 'Showing sample cases. No backend needed.');
    } else {
      setLiveCases([]);
      addToast('info', 'Live Mode', 'Listening for real Slack messages from the backend.');
    }
  };

  // Handler: Change Manager Persona (RBAC Simulation)
  const handleSelectPersona = (persona: Persona) => {
    setActivePersona(persona);
    const newInsights = allInsights.filter((i) => i.managerId === persona.id);
    if (newInsights.length > 0) {
      setActiveInsightId(newInsights[0].id);
    }
    addToast(
      'info',
      `RBAC Switch: ${persona.name}`,
      `Viewing team dashboard for ${persona.department} (${persona.teamSize} direct reports). Access restricted by RBAC Tier.`
    );
  };

  // Handler: Select an insight directly
  const handleSelectInsight = (insight: ConvergenceInsight) => {
    setActiveInsightId(insight.id);
  };

  // Handler: Select insight from a clicked raw messy item
  const handleSelectInsightById = (insightId: string) => {
    setActiveInsightId(insightId);
  };

  // Handler: Submit to ADP API
  const handleSubmitToAdp = async (insight: ConvergenceInsight) => {
    setIsSubmittingAdp(true);

    // Simulate realistic asynchronous network call to ADP Workforce Now REST API
    setTimeout(() => {
      setIsSubmittingAdp(false);
      setSubmittedInsightIds((prev) => new Set(prev).add(insight.id));

      addToast(
        'success',
        'Submitted to ADP API Successfully',
        `Payload for ${insight.employee.name} (${insight.adpPayload.adpRecordCode}) posted to ADP Workforce Now API. Payroll adjustments triggered.`
      );
    }, 900);
  };

  // Handler: Copy Slack message
  const handleCopySlackReply = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    addToast('info', 'Copied to Clipboard', 'Pre-composed Slack message ready to send to direct report.');
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Augment active insight with submission status
  const currentInsightWithStatus = useMemo(() => {
    if (!activeInsight) return null;
    const isSubmitted = submittedInsightIds.has(activeInsight.id);
    return {
      ...activeInsight,
      status: isSubmitted ? ('Synced with ADP' as const) : activeInsight.status,
    };
  }, [activeInsight, submittedInsightIds]);

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar with Persona Switcher */}
      <Navbar
        personas={MOCK_PERSONAS}
        activePersona={activePersona}
        onSelectPersona={handleSelectPersona}
        pendingActionsCount={pendingActionsCount}
        mode={mode}
        onModeChange={handleModeChange}
        liveConnected={liveConnected}
      />

      {/* Sub-Header Context Bar */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/60 px-4 sm:px-6 lg:px-8 py-2.5 backdrop-blur-sm">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Scope:</span>
              <strong className="text-white">{activePersona.department}</strong>
            </span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 text-zinc-400 hidden sm:flex">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              <span>{activePersona.location}</span>
            </span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[11px] font-medium">
              <ShieldCheck className="w-3 h-3" />
              <span>{activePersona.securityClearance}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-zinc-300">Live Synthesis:</span>
              <span className="text-indigo-400 font-semibold">
                {managerMessyItems.length} Source{managerMessyItems.length !== 1 ? 's' : ''} {mode === 'live' ? 'Live' : 'Connected'}
              </span>
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{submittedInsightIds.size} Synced with ADP</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Responsive Split-Screen Workspace */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        {mode === 'live' && !liveConnected && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
            <span className="flex items-center gap-2">
              <WifiOff className="w-4 h-4" />
              Cannot reach the backend at {API_URL}. Start it, or use Demo Mode for the presentation.
            </span>
            <button
              onClick={() => handleModeChange('demo')}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 font-semibold transition-colors"
            >
              Switch to Demo Mode
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[calc(100vh-10.5rem)]">
          {/* Left Panel: The Chaos (Unstructured Data Feed) */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col h-[700px] lg:h-full">
            <ChaosPanel
              items={managerMessyItems}
              activeInsight={currentInsightWithStatus}
              onSelectInsightById={handleSelectInsightById}
              mode={mode}
              liveConnected={liveConnected}
              onSwitchToDemo={() => handleModeChange('demo')}
            />
          </div>

          {/* Right Panel: The Convergence (AI Synthesized Actionable Insight) */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col h-[700px] lg:h-full">
            <ConvergencePanel
              insights={managerInsights}
              activeInsight={currentInsightWithStatus}
              onSelectInsight={handleSelectInsight}
              onSubmitToAdp={handleSubmitToAdp}
              isSubmittingAdp={isSubmittingAdp}
              onCopySlackReply={handleCopySlackReply}
              isCopied={isCopied}
              mode={mode}
            />
          </div>
        </div>
      </main>

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
