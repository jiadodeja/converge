'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { ChaosPanel } from '../components/ChaosPanel';
import { ConvergencePanel } from '../components/ConvergencePanel';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { MOCK_PERSONAS, MOCK_MESSY_DATA, MOCK_INSIGHTS } from '../data/mockData';
import { Persona, ConvergenceInsight } from '../types/converge';
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  ArrowRightLeft,
  CheckCircle2
} from 'lucide-react';

export default function DashboardPage() {
  // Phase 1 & 2 State
  const [activePersona, setActivePersona] = useState<Persona>(MOCK_PERSONAS[0]);
  const [activeInsightId, setActiveInsightId] = useState<string>(MOCK_INSIGHTS[0].id);
  const [submittedInsightIds, setSubmittedInsightIds] = useState<Set<string>>(new Set());
  const [isSubmittingAdp, setIsSubmittingAdp] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Filter insights for active manager (Role-Based Access Control)
  const managerInsights = useMemo(() => {
    return MOCK_INSIGHTS.filter((insight) => insight.managerId === activePersona.id);
  }, [activePersona.id]);

  // Ensure active insight matches the manager's roster
  const activeInsight = useMemo(() => {
    const found = managerInsights.find((i) => i.id === activeInsightId);
    return found || managerInsights[0] || null;
  }, [managerInsights, activeInsightId]);

  // Filter messy data streams related to this manager's insights
  const managerMessyItems = useMemo(() => {
    const insightIds = new Set(managerInsights.map((i) => i.id));
    return MOCK_MESSY_DATA.filter((item) => insightIds.has(item.relatedInsightId));
  }, [managerInsights]);

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

  // Handler: Change Manager Persona (RBAC Simulation)
  const handleSelectPersona = (persona: Persona) => {
    setActivePersona(persona);
    const newInsights = MOCK_INSIGHTS.filter((i) => i.managerId === persona.id);
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
              <span className="text-indigo-400 font-semibold">{managerMessyItems.length} Sources Connected</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[calc(100vh-10.5rem)]">
          {/* Left Panel: The Chaos (Unstructured Data Feed) */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col h-[700px] lg:h-full">
            <ChaosPanel
              items={managerMessyItems}
              activeInsight={currentInsightWithStatus}
              onSelectInsightById={handleSelectInsightById}
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
            />
          </div>
        </div>
      </main>

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
