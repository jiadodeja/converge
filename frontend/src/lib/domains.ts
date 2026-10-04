// Settings for the four ADP business lines: names, icons, colors and the people who use each one.
// Tailwind needs full class names written out, so the colors are spelled out for every business.

import { Users, Wallet, ShieldPlus, PiggyBank, LayoutGrid, LucideIcon } from 'lucide-react';
import { DomainId, Persona } from '../types/converge';

export type DomainTab = DomainId | 'all';

export interface DomainInfo {
  id: DomainTab;
  label: string;
  adpProduct: string; // the ADP product the action is sent to
  tagline: string;
  icon: LucideIcon;
  activeTab: string; // classes for the selected tab
  text: string;
  badge: string;
  border: string;
  tile: string;
  dot: string;
  glow: string;
  personas: Persona[];
}

export const DOMAIN_ORDER: DomainId[] = ['hr', 'payroll', 'insurance', 'retirement'];

export const DOMAINS: Record<DomainTab, DomainInfo> = {
  all: {
    id: 'all',
    label: 'All Businesses',
    adpProduct: 'ADP Suite',
    tagline: 'One message, every ADP business',
    icon: LayoutGrid,
    activeTab: 'bg-[#2f4ba2] text-white border-[#2f4ba2]',
    text: 'text-slate-700',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    border: 'border-slate-300',
    tile: 'bg-slate-50 border-slate-200',
    dot: 'bg-slate-500',
    glow: 'from-slate-100',
    personas: [],
  },
  hr: {
    id: 'hr',
    label: 'HR',
    adpProduct: 'ADP Workforce Now',
    tagline: 'Leave, PTO and policy questions',
    icon: Users,
    activeTab: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
    text: 'text-indigo-300',
    badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    border: 'border-indigo-500/30',
    tile: 'bg-indigo-500/10 border-indigo-500/20',
    dot: 'bg-indigo-400',
    glow: 'from-indigo-500/20',
    personas: [], // HR keeps the original personas from mockData.ts
  },
  payroll: {
    id: 'payroll',
    label: 'Payroll',
    adpProduct: 'ADP Payroll',
    tagline: 'Pay issues, overtime and deductions',
    icon: Wallet,
    activeTab: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
    text: 'text-sky-300',
    badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
    border: 'border-sky-500/30',
    tile: 'bg-sky-500/10 border-sky-500/20',
    dot: 'bg-sky-400',
    glow: 'from-sky-500/20',
    personas: [
      {
        id: 'priya-nair',
        name: 'Priya Nair',
        role: 'Payroll Specialist',
        department: 'Payroll Operations',
        teamSize: 140,
        avatar: 'PN',
        email: 'priya.nair@acme-enterprise.internal',
        location: 'Roseland, NJ',
        securityClearance: 'P3 Specialist - Payroll Data Access',
        domain: 'payroll',
      },
    ],
  },
  insurance: {
    id: 'insurance',
    label: 'Insurance',
    adpProduct: 'ADP Benefits Administration',
    tagline: 'Enrollment, life events and coverage',
    icon: ShieldPlus,
    activeTab: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40',
    text: 'text-fuchsia-300',
    badge: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20',
    border: 'border-fuchsia-500/30',
    tile: 'bg-fuchsia-500/10 border-fuchsia-500/20',
    dot: 'bg-fuchsia-400',
    glow: 'from-fuchsia-500/20',
    personas: [
      {
        id: 'daniel-okafor',
        name: 'Daniel Okafor',
        role: 'Benefits Administrator',
        department: 'Benefits & Insurance',
        teamSize: 140,
        avatar: 'DO',
        email: 'daniel.okafor@acme-enterprise.internal',
        location: 'Chicago, IL',
        securityClearance: 'B2 Administrator - Benefits Data Access',
        domain: 'insurance',
      },
    ],
  },
  retirement: {
    id: 'retirement',
    label: 'Retirement',
    adpProduct: 'ADP Retirement Services',
    tagline: '401(k) loans, contributions and match',
    icon: PiggyBank,
    activeTab: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    text: 'text-amber-300',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    border: 'border-amber-500/30',
    tile: 'bg-amber-500/10 border-amber-500/20',
    dot: 'bg-amber-400',
    glow: 'from-amber-500/20',
    personas: [
      {
        id: 'hannah-weiss',
        name: 'Hannah Weiss',
        role: 'Retirement Plan Administrator',
        department: 'Retirement Plan Services',
        teamSize: 140,
        avatar: 'HW',
        email: 'hannah.weiss@acme-enterprise.internal',
        location: 'Boston, MA',
        securityClearance: 'R3 Administrator - Plan Data Access',
        domain: 'retirement',
      },
    ],
  },
};
