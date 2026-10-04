'use client';

import React, { useState } from 'react';
import { ConvergenceInsight } from '../types/converge';
import { DOMAINS } from '../lib/domains';
import { 
  Sparkles, 
  CheckCircle, 
  Send, 
  Copy, 
  Check, 
  ArrowRight, 
  Clock, 
  ShieldAlert, 
  FileCheck2, 
  Code2, 
  ChevronRight,
  Building,
  Calendar
} from 'lucide-react';

interface ConvergencePanelProps {
  insights: ConvergenceInsight[];
  activeInsight: ConvergenceInsight | null;
  onSelectInsight: (insight: ConvergenceInsight) => void;
  onSubmitToAdp: (insight: ConvergenceInsight) => void;
  isSubmittingAdp: boolean;
  onCopySlackReply: (text: string) => void;
  isCopied: boolean;
  mode?: 'demo' | 'live';
}

export const ConvergencePanel: React.FC<ConvergencePanelProps> = ({
  insights,
  activeInsight,
  onSelectInsight,
  onSubmitToAdp,
  isSubmittingAdp,
  onCopySlackReply,
  isCopied,
  mode = 'demo',
}) => {
  const [showPayload, setShowPayload] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const toggleChecklist = (stepId: string, currentVal: boolean) => {
    setChecklist((prev) => ({
      ...prev,
      [stepId]: prev[stepId] !== undefined ? !prev[stepId] : !currentVal,
    }));
  };

  if (!activeInsight) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-zinc-950/60 rounded-2xl border border-zinc-800 text-zinc-400">
        <Sparkles className="w-12 h-12 text-zinc-400 mb-3" />
        <h3 className="text-lg font-bold text-zinc-200">
          {mode === 'live' ? 'Waiting for the first Slack message' : 'No Active Case Selected'}
        </h3>
        <p className="text-xs text-zinc-400 max-w-sm mt-1">
          {mode === 'live'
            ? 'When someone posts in the HR Slack channel, the AI action plan will appear here.'
            : 'Select an item from the unstructured chaos panel or change persona to view AI synthesized HR insights.'}
        </p>
      </div>
    );
  }

  const isSubmitted = activeInsight.status === 'Submitted to ADP' || activeInsight.status === 'Synced with ADP';

  return (
    <div className="flex flex-col h-full bg-zinc-950/60 rounded-2xl border border-zinc-800/80 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Panel Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">The Convergence</h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  AI Synthesis Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Deterministic policy verification, eligibility computation, and one-click execution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeInsight.aiConfidence > 0 ? (
              <div className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-1.5">
                <span className="text-zinc-400 font-medium">Confidence:</span>
                <span className="font-bold text-emerald-400">{activeInsight.aiConfidence}%</span>
              </div>
            ) : (
              <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live GPT-4o
              </div>
            )}
          </div>
        </div>

        {/* Multi-Case Switcher (if manager has > 1 case) */}
        {insights.length > 1 && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider shrink-0">
              Open Cases:
            </span>
            {insights.map((ins) => {
              const selected = ins.id === activeInsight.id;
              return (
                <button
                  key={ins.id}
                  onClick={() => onSelectInsight(ins)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-2 ${
                    selected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px]">
                    {ins.employee.avatar}
                  </span>
                  <span>{ins.employee.name}</span>
                  <span className="text-[10px] opacity-75">({ins.category})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
        {/* Employee Dossier Header */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-indigo-500/20">
              {activeInsight.employee.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {activeInsight.employee.name}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {activeInsight.employee.workdayId}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                  activeInsight.urgency === 'High'
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                    : activeInsight.urgency === 'Medium'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                }`}>
                  {activeInsight.urgency} Priority
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-400">
                <span className="text-zinc-300">{activeInsight.employee.role}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3 text-zinc-400" />
                  {activeInsight.employee.department}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  Tenure: <strong className="text-zinc-200">{activeInsight.employee.tenure}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Action Status
            </span>
            <div className="mt-0.5">
              {isSubmitted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Synced with ADP API
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Pending Manager Action
                </span>
              )}
            </div>
          </div>
        </div>

        {activeInsight.origin === 'live' && (
          <p className="-mt-2 px-1 text-[11px] text-zinc-400">
            Name, Slack ID, policy answer and next steps are live. Role, department and tenure are placeholders until a Workday connection is added.
          </p>
        )}

        {/* AI Synthesis Summary Card */}
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-b from-indigo-950/30 via-zinc-900/60 to-zinc-900/40 border border-indigo-500/30 shadow-lg">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            Synthesized Resolution
          </div>
          <h4 className="text-sm font-semibold text-white leading-snug mb-2">
            {activeInsight.headline}
          </h4>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {activeInsight.summary}
          </p>
        </div>

        {/* Key facts for this business */}
        {activeInsight.highlights && activeInsight.highlights.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {activeInsight.highlights.map((h) => (
              <div
                key={h.label}
                className={`p-3 rounded-xl border ${DOMAINS[activeInsight.domain ?? 'hr'].tile}`}
              >
                <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  {h.label}
                </div>
                <div className={`text-xs font-bold mt-1 leading-snug ${DOMAINS[activeInsight.domain ?? 'hr'].text}`}>
                  {h.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Eligibility & Policy Determination */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Eligibility & Cross-Referenced Policy
              </h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              {activeInsight.eligibility.status}: {activeInsight.eligibility.headline}
            </span>
          </div>

          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {activeInsight.eligibility.keyPoints.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-300"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong>Statutory Citation:</strong> {activeInsight.eligibility.statutoryAddendum}
              </span>
            </div>
          </div>
        </div>

        {/* Next Steps Checklist */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3 flex items-center justify-between">
            <span>Action Checklist</span>
            <span className="text-[11px] font-normal text-zinc-400">Click to mark tasks</span>
          </h4>

          <div className="space-y-2">
            {activeInsight.actionChecklist.map((step) => {
              const isChecked =
                checklist[step.id] !== undefined ? checklist[step.id] : step.completed;
              return (
                <button
                  key={step.id}
                  onClick={() => toggleChecklist(step.id, step.completed)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all text-xs ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                      : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-500 text-black'
                        : 'border-zinc-600 bg-zinc-900'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className={isChecked ? 'line-through text-zinc-400' : ''}>
                    {step.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pre-Drafted Slack Reply to Employee */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Auto-Drafted Response (Ready to Send to Slack)
              </h4>
            </div>
            <button
              onClick={() => onCopySlackReply(activeInsight.suggestedSlackReply)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all text-xs font-medium"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Slack Text</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 rounded-lg bg-[#1a1d21] border border-zinc-800 text-xs text-zinc-200 font-sans leading-relaxed">
            {activeInsight.suggestedSlackReply}
          </div>
        </div>

        {/* PRIMARY ACTION: Submit to ADP API */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 border-2 border-indigo-500/40 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  {DOMAINS[activeInsight.domain ?? 'hr'].adpProduct} REST API
                </span>
                <span className="text-xs text-zinc-400 font-mono break-all">
                  Endpoint: {activeInsight.adpEndpoint || '/v1/benefits/leave-events'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1">
                {isSubmitted
                  ? 'Record Transmitted to ADP'
                  : 'Automate HR System of Record Registration'}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isSubmitted
                  ? `Active Leave Code: ${activeInsight.adpPayload.adpRecordCode}. Payroll synced.`
                  : 'Transmit verified parameters directly to payroll to avoid manual HR ticketing delays.'}
              </p>
            </div>

            {/* ACTION BUTTON */}
            <button
              onClick={() => onSubmitToAdp(activeInsight)}
              disabled={isSubmittingAdp || isSubmitted}
              className={`px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl shrink-0 ${
                isSubmitted
                  ? 'bg-emerald-600/90 text-white cursor-default shadow-emerald-950/50'
                  : isSubmittingAdp
                  ? 'bg-indigo-600/50 text-indigo-200 cursor-wait'
                  : 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
              }`}
            >
              {isSubmittingAdp ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Syncing with ADP API...</span>
                </>
              ) : isSubmitted ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  <span>Submitted to ADP API ✓</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Submit to ADP API</span>
                </>
              )}
            </button>
          </div>

          {/* Toggleable Payload Inspector */}
          <div className="mt-3 pt-3 border-t border-zinc-800/80">
            <button
              onClick={() => setShowPayload(!showPayload)}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors font-mono"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{showPayload ? 'Hide' : 'Inspect'} ADP API REST Payload</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${
                  showPayload ? 'rotate-90' : ''
                }`}
              />
            </button>

            {showPayload && (
              <pre className="mt-2.5 p-3 rounded-lg bg-black/80 border border-zinc-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                {JSON.stringify(
                  {
                    endpoint: activeInsight.adpEndpoint
                      ? `https://api.adp.com${activeInsight.adpEndpoint.replace(/^[A-Z]+\s+/, '')}`
                      : 'https://api.adp.com/hr/v1/leave-management/events',
                    method: 'POST',
                    headers: {
                      Authorization: 'Bearer [MOCK_OAUTH_TOKEN]',
                      'Content-Type': 'application/json',
                      'X-Originating-App': 'Converge-HR-Copilot',
                    },
                    payload: activeInsight.adpPayload,
                  },
                  null,
                  2
                )}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
