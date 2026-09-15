export interface Item {
  id: string;
  name: string;
  icon: string;
}

export interface UnitDetail {
  id: string;
  name: string;
  cost: number;
  icon: string;
  role: string;
  row: number; // 0..3
  col: number; // 0..6
  star: number; // 1..3
  traits?: string[];
  items: Item[];
}

export interface PartnerCompSummary {
  comp_key: string;
  display_name: string;
  tier: string;
  top2_rate?: number;
  traits_summary?: string;
  main_carry: {
    id: string;
    name: string;
    cost: number;
    icon: string;
  };
}

export interface LevelBoards {
  [level: string]: UnitDetail[]; // e.g. "3", "4", ..., "9"
}

export interface CompStat {
  comp_key: string;
  queue_id?: number;
  display_name: string;
  tier: string; // "OP" | "S" | "A" | "B" | "C"
  avg_placement: number;
  top2_rate: number;
  top4_rate?: number;
  win_rate: number;
  sample_size: number;
  traits_summary?: string;
  main_carry: {
    id: string;
    name: string;
    cost: number;
    icon: string;
  };
  best_items: Item[];
  units_detail?: UnitDetail[];
  
  // Custom Double Up Extended Attributes
  reroll_level?: string; // "5リロール" | "6リロール" | "7リロール" | "8リロール" | "Fast 8" | "Fast 9" | "Standard"
  overview?: string;
  play_conditions?: string;
  progression_guide?: string;
  dedicated_augment?: string;
  recommended_augments?: string[];
  level_boards?: LevelBoards;
  partner_comp_keys?: string[];
  partner_comps?: PartnerCompSummary[];
  is_custom?: number;
}

export function getTierStyle(tier: string) {
  const t = (tier || '').toUpperCase();
  switch (t) {
    case 'OP':
      return {
        badge: 'border-rose-400 text-rose-950 bg-rose-100 font-black shadow-sm',
        badgeSolid: 'bg-gradient-to-r from-rose-600 to-red-600 text-white font-black border border-rose-400 shadow-md shadow-rose-500/20',
        text: 'text-rose-600',
        border: 'border-rose-300',
        bg: 'bg-rose-50',
        label: 'OP'
      };
    case 'S':
      return {
        badge: 'border-amber-400 text-amber-950 bg-amber-100 font-black shadow-sm',
        badgeSolid: 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black border border-amber-300 shadow-md shadow-amber-500/20',
        text: 'text-amber-700',
        border: 'border-amber-300',
        bg: 'bg-amber-50',
        label: 'S'
      };
    case 'A':
      return {
        badge: 'border-purple-400 text-purple-950 bg-purple-100 font-black shadow-sm',
        badgeSolid: 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black border border-purple-400 shadow-md shadow-purple-500/20',
        text: 'text-purple-700',
        border: 'border-purple-300',
        bg: 'bg-purple-50',
        label: 'A'
      };
    case 'B':
      return {
        badge: 'border-sky-400 text-sky-950 bg-sky-100 font-black shadow-sm',
        badgeSolid: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white font-black border border-sky-400 shadow-md shadow-sky-500/20',
        text: 'text-sky-700',
        border: 'border-sky-300',
        bg: 'bg-sky-50',
        label: 'B'
      };
    case 'C':
      return {
        badge: 'border-slate-400 text-slate-900 bg-slate-200 font-black shadow-sm',
        badgeSolid: 'bg-gradient-to-br from-slate-500 to-slate-600 text-white font-black border border-slate-400 shadow-md shadow-slate-500/20',
        text: 'text-slate-700',
        border: 'border-slate-300',
        bg: 'bg-slate-100',
        label: 'C'
      };
    default:
      return {
        badge: 'border-slate-300 text-slate-700 bg-slate-100 font-bold',
        badgeSolid: 'bg-slate-600 text-white font-bold border border-slate-400',
        text: 'text-slate-600',
        border: 'border-slate-200',
        bg: 'bg-slate-50',
        label: tier || '?'
      };
  }
}
