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
  FlaskConical
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
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Mission */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  Converge
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  HR Copilot
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Turning Messy Enterprise Noise into Actionable People Insights
              </p>
            </div>
          </div>
        </div>

        {/* Live Integration Status Badges (Desktop) */}
        <div className="hidden xl:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-zinc-300">
            {mode === 'live' ? (
              <Radio className={`w-3.5 h-3.5 ${liveConnected ? 'text-emerald-400 animate-ping' : 'text-rose-400'}`} />
            ) : (
              <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="text-zinc-400">Slack Stream:</span>
            {mode === 'live' ? (
              liveConnected ? (
                <span className="text-emerald-400 font-medium">Listening</span>
              ) : (
                <span className="text-rose-400 font-medium">Backend offline</span>
              )
            ) : (
              <span className="text-amber-300 font-medium">Sample data</span>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-zinc-300">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-zinc-400">ADP Workforce Now:</span>
            <span className="text-indigo-400 font-medium">Sandbox (simulated)</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            {pendingActionsCount} Pending Action{pendingActionsCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Demo / Live mode switch */}
        <div
          className="flex items-center p-1 rounded-xl bg-zinc-900/90 border border-zinc-700/60 text-xs font-semibold"
          role="group"
          aria-label="Data mode"
        >
          <button
            onClick={() => onModeChange('demo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mode === 'demo'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Demo
          </button>
          <button
            onClick={() => onModeChange('live')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mode === 'live'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                mode === 'live' ? (liveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400') : 'bg-zinc-500'
              }`}
            />
            Live
          </button>
        </div>

        {/* Persona Switcher Dropdown (Role-Based Access Control) */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-700/60 hover:border-zinc-600 transition-all text-left shadow-sm group"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {activePersona.avatar}
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                  Viewing as:
                </span>
                <span className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  {activePersona.name}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                <span>{activePersona.role}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                <span className="text-indigo-400">{activePersona.teamSize} reports</span>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl shadow-black/80 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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
                          ? 'bg-indigo-950/60 border border-indigo-500/30 text-white'
                          : 'hover:bg-zinc-800/60 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {persona.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold truncate text-white">
                            {persona.name}
                          </span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-1" />
                          )}
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
                <span className="text-zinc-400">{activePersona.location.split(' ')[0]}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
