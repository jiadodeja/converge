'use client';

import React, { useState } from 'react';
import { MessyDataItem, ConvergenceInsight } from '../types/converge';
import { 
  Hash, 
  FileText, 
  Mail, 
  MessageSquare, 
  Sparkles, 
  AlertTriangle,
  FileSearch,
  Layers,
  Search,
  Filter,
  Radio
} from 'lucide-react';

interface ChaosPanelProps {
  items: MessyDataItem[];
  activeInsight: ConvergenceInsight | null;
  onSelectInsightById: (insightId: string) => void;
  mode?: 'demo' | 'live';
  liveConnected?: boolean;
  onSwitchToDemo?: () => void;
}

export const ChaosPanel: React.FC<ChaosPanelProps> = ({
  items,
  activeInsight,
  onSelectInsightById,
  mode = 'demo',
  liveConnected = false,
  onSwitchToDemo,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'slack' | 'pdf' | 'email'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter((item) => {
    const matchesFilter = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.channelOrDoc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summarySnippet.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-zinc-950/60 rounded-2xl border border-zinc-800/80 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Panel Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">The Chaos</h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {mode === 'live' ? 'Live Slack Ingestion' : 'Unstructured Ingestion'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Raw Slack threads, emails and long policy PDFs from every ADP business
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-zinc-300">
              {items.length} Data Stream{items.length !== 1 ? 's' : ''}
            </span>
            <p className="text-[10px] text-zinc-400">{mode === 'live' ? 'Real-time' : 'Auto-vectorized'}</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search raw communications & PDFs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800 text-[11px]">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilterType('slack')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                filterType === 'slack'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Hash className="w-3 h-3" />
              Slack
            </button>
            <button
              onClick={() => setFilterType('pdf')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                filterType === 'pdf'
                  ? 'bg-zinc-800 text-rose-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3 h-3" />
              PDFs
            </button>
            <button
              onClick={() => setFilterType('email')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                filterType === 'email'
                  ? 'bg-zinc-800 text-sky-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Mail className="w-3 h-3" />
              Email
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
        {mode === 'live' && items.length === 0 ? (
          <div className="h-full min-h-64 flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5">
            <div className="relative mb-4">
              <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="relative p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Radio className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-semibold text-zinc-100">
              {liveConnected ? 'Listening for Slack messages...' : 'Cannot reach the backend'}
            </p>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
              {liveConnected
                ? 'Post a question in your HR Slack channel. It will show up here with the handbook excerpts the AI used.'
                : 'Start the backend on port 8000, or switch to Demo Mode to show the sample cases.'}
            </p>
            {onSwitchToDemo && (
              <button
                onClick={onSwitchToDemo}
                className="mt-4 px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
              >
                Switch to Demo Mode
              </button>
            )}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-zinc-800 text-zinc-400">
            <Filter className="w-8 h-8 text-zinc-400 mb-2" />
            <p className="text-sm font-medium text-zinc-300">No matching streams found</p>
            <p className="text-xs text-zinc-400 mt-1">Try resetting your search query or filter tags.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isLinkedToActive = activeInsight?.id === item.relatedInsightId;

            return (
              <div
                key={item.id}
                onClick={() => onSelectInsightById(item.relatedInsightId)}
                className={`group cursor-pointer rounded-xl border transition-all duration-200 overflow-hidden ${
                  isLinkedToActive
                    ? 'border-indigo-500/60 bg-zinc-900/90 shadow-xl shadow-indigo-950/20 ring-1 ring-indigo-500/30'
                    : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60'
                }`}
              >
                {/* Item Card Header */}
                <div className="p-3.5 border-b border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.type === 'slack' && (
                      <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <MessageSquare className="w-4 h-4" />
                      </span>
                    )}
                    {item.type === 'pdf' && (
                      <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <FileText className="w-4 h-4" />
                      </span>
                    )}
                    {item.type === 'email' && (
                      <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        <Mail className="w-4 h-4" />
                      </span>
                    )}

                    <div className="truncate">
                      <h3 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 truncate">
                        <span className="truncate">{item.channelOrDoc}</span>
                        <span>•</span>
                        <span className="shrink-0">{item.timestamp}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.id.startsWith('messy-live-') && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE
                      </span>
                    )}
                    {isLinkedToActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 animate-pulse">
                        <Sparkles className="w-3 h-3" />
                        Active Focus
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400 group-hover:text-zinc-300 transition-colors">
                        Click to focus →
                      </span>
                    )}
                  </div>
                </div>

                {/* Body: Embedded View depending on Type */}
                <div className="p-4">
                  {/* SLACK VIEW */}
                  {item.type === 'slack' && item.slackThread && (
                    <div className="rounded-xl bg-[#1A1D21] border border-zinc-800 p-3 space-y-3 font-sans text-xs">
                      {/* Slack Channel Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1 font-bold text-zinc-300">
                          <Hash className="w-3 h-3 text-zinc-400" />
                          {item.channelOrDoc.replace('#', '')}
                        </span>
                        <span className="text-[10px] bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-400">
                          {item.slackThread.length} {item.slackThread.length === 1 ? 'message' : 'messages in thread'}
                        </span>
                      </div>

                      {/* Slack Message List */}
                      <div className="space-y-3">
                        {item.slackThread.map((msg) => (
                          <div key={msg.id} className="flex items-start gap-2.5 group/msg">
                            <div
                              className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                msg.isManager
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {msg.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="font-bold text-zinc-200 text-xs">
                                  {msg.sender}
                                </span>
                                <span className="text-[10px] text-zinc-400">{msg.time}</span>
                                {msg.isDirectReport && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                    Direct Report
                                  </span>
                                )}
                              </div>
                              <p className="text-zinc-300 mt-1 text-xs leading-relaxed break-words">
                                {msg.text}
                              </p>

                              {/* Emoji Reactions */}
                              {msg.reactions && msg.reactions.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  {msg.reactions.map((react, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800/90 border border-zinc-700/60 text-[10px] text-zinc-300"
                                    >
                                      <span>{react.emoji}</span>
                                      <span className="text-zinc-400 font-medium">{react.count}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PDF VIEW */}
                  {item.type === 'pdf' && item.pdfSnippet && (
                    <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden font-mono text-xs">
                      {/* PDF Viewer Header Bar */}
                      <div className="bg-zinc-900/90 px-3 py-2 border-b border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                        <div className="flex items-center gap-2 truncate">
                          <FileSearch className="w-3.5 h-3.5 text-rose-400" />
                          <span className="font-semibold text-zinc-300 truncate">
                            {item.pdfSnippet.docName}
                          </span>
                        </div>
                        {item.pdfSnippet.pageNumber > 0 && (
                          <span className="shrink-0 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-sans text-[10px]">
                            {item.pdfSnippet.totalPages > 0
                              ? `Page ${item.pdfSnippet.pageNumber} of ${item.pdfSnippet.totalPages}`
                              : `Page ${item.pdfSnippet.pageNumber}`}
                          </span>
                        )}
                      </div>

                      {/* PDF Content Area */}
                      <div className="p-3.5 space-y-2 bg-[#0c0d0e]">
                        <div className="text-[10px] text-zinc-400 font-sans uppercase font-bold tracking-wider">
                          {item.pdfSnippet.section}
                        </div>

                        {/* Surrounding Context (faded) */}
                        {item.pdfSnippet.surroundingContext && (
                          <div className="text-[11px] text-zinc-400 line-clamp-2 select-none">
                            {item.pdfSnippet.surroundingContext}
                          </div>
                        )}

                        {/* Highlighted Policy Clause (The critical text) */}
                        <div className="p-3 rounded-lg bg-amber-500/10 border-l-4 border-amber-500 text-amber-200 text-xs leading-relaxed font-sans shadow-sm">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 mb-1 uppercase tracking-wider">
                            <AlertTriangle className="w-3 h-3" />
                            Extracted Policy Rule ({item.pdfSnippet.clauseId})
                          </div>
                          {item.pdfSnippet.highlightedText}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EMAIL VIEW */}
                  {item.type === 'email' && item.emailDetails && (
                    <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 space-y-2 font-sans text-xs">
                      <div className="border-b border-zinc-800 pb-2 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-200">
                            {item.emailDetails.subject}
                          </span>
                          <span className="text-zinc-400 text-[10px]">{item.emailDetails.date}</span>
                        </div>
                        <div className="text-zinc-400 flex items-center gap-1">
                          <span className="text-zinc-400">From:</span>
                          <span className="text-zinc-300 font-medium">{item.emailDetails.from}</span>
                        </div>
                      </div>
                      <div className="text-zinc-300 text-xs whitespace-pre-line leading-relaxed pt-1">
                        {item.emailDetails.body}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer linking to Convergence */}
                <div className="px-4 py-2 bg-zinc-950/50 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    Source: <strong className="text-zinc-300 font-medium">{item.sourceBadge}</strong>
                  </span>
                  <span className="text-indigo-400 font-medium flex items-center gap-1">
                    {item.id.startsWith('messy-live-') ? 'Live case' : `AI Parsed Vector ID: #${item.id.replace('messy-', '')}`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
