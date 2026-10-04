'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Persona } from '../types/converge';
import {
  Users,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Database,
  Radio,
  Building2,
  Check,
  FlaskConical,
  Menu,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  personas: Persona[];
  activePersona: Persona;
  onSelectPersona: (persona: Persona) => void;
  pendingActionsCount: number;
  mode: 'demo' | 'live';
  onModeChange: (mode: 'demo' | 'live') => void;
  liveConnected: boolean;
}

// Top bar styled like the ADP header: dark navy, white text, icon buttons with small labels on the right.
// (The gray scale is flipped for the light theme, so this bar uses explicit colors.)
export const Navbar: React.FC<NavbarProps> = ({
  personas,
  activePersona,
  onSelectPersona,
  pendingActionsCount,
  mode,
  onModeChange,
  liveConnected,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#141c52] text-white shadow-md">
      <div className="px-4 sm:px-6 h-[72px] flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <Menu className="w-5 h-5 text-white/90" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">Converge</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-white/10 text-white/90 border border-white/20">
                  Enterprise Copilot
                </span>
              </div>
              <p className="text-[11px] text-white/70 hidden sm:block">
                Turning Messy Enterprise Noise into Actionable Next Steps
              </p>
            </div>
          </div>
        </div>

        {/* Status badges (large screens) */}
        <div className="hidden 2xl:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white/90">
            {mode === 'live' ? (
              <Radio className={`w-3.5 h-3.5 ${liveConnected ? 'text-[#6ee7b7]' : 'text-[#fda4af]'}`} />
            ) : (
              <FlaskConical className="w-3.5 h-3.5 text-[#fcd34d]" />
            )}
            <span className="text-white/70">Slack Stream:</span>
            {mode === 'live' ? (
              liveConnected ? (
                <span className="text-[#6ee7b7] font-medium">Listening</span>
              ) : (
                <span className="text-[#fda4af] font-medium">Backend offline</span>
              )
            ) : (
              <span className="text-[#fcd34d] font-medium">Sample data</span>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white/90">
            <Database className="w-3.5 h-3.5 text-[#93c5fd]" />
            <span className="text-white/70">ADP APIs:</span>
            <span className="text-[#93c5fd] font-medium">Sandbox (simulated)</span>
          </div>
        </div>

        {/* Right side: mode switch, Things To Do, person */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Demo / Live mode switch */}
          <div
            className="flex items-center p-1 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold"
            role="group"
            aria-label="Data mode"
          >
            <button
              onClick={() => onModeChange('demo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'demo' ? 'bg-white text-[#141c52] shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Demo
            </button>
            <button
              onClick={() => onModeChange('live')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'live' ? 'bg-white text-[#141c52] shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  mode === 'live' ? (liveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500') : 'bg-white/50'
                }`}
              />
              Live
            </button>
          </div>

          {/* Things To Do (open cases) */}
          <div className="hidden sm:flex flex-col items-center gap-0.5 text-white" title="Cases that still need action">
            <div className="relative">
              <CheckCircle2 className="w-6 h-6" />
              {pendingActionsCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#d0271d] text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingActionsCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium">Things To Do</span>
          </div>

          {/* Persona switcher (role-based access) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 text-left group"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <div className="hidden lg:block text-right">
                <div className="text-xs font-semibold text-white">{activePersona.name}</div>
                <div className="text-[11px] text-white/70">{activePersona.role}</div>
              </div>
              <div className="w-11 h-11 rounded-full bg-[#e6e9f5] border-2 border-white/60 flex items-center justify-center text-[#141c52] font-bold text-base group-hover:border-white transition-colors">
                {activePersona.avatar}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-white/80 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-80 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl shadow-slate-900/20 py-2.5 z-50 text-zinc-300">
                <div className="px-4 py-2 border-b border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Role-Based Access Control
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" />
                      Direct Reports Only
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                    Switch manager persona to preview filtered data isolation and team-specific compliance context.
                  </p>
                </div>

                <div className="p-1 space-y-1">
                  {personas.map((persona) => {
                    const isSelected = persona.id === activePersona.id;
                    return (
                      <button
                        key={persona.id}
                        onClick={() => {
                          onSelectPersona(persona);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-950/60 border border-indigo-500/30 text-ink'
                            : 'hover:bg-zinc-800/60 text-zinc-300 hover:text-ink'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? 'bg-[#2f4ba2] text-white' : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {persona.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold truncate text-ink">{persona.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-1" />}
                          </div>
                          <p className="text-xs text-zinc-400 truncate">{persona.role}</p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-zinc-400" />
                              {persona.department}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-zinc-400" />
                              {persona.teamSize} reports
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 px-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Active Scope: {activePersona.department}</span>
                  <span>{activePersona.location.split(' ')[0]}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
