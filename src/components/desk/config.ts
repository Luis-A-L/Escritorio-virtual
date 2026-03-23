import { type CSSProperties } from 'react';
import { Employee, DeskVariant } from '../../types';

export interface DeskTone {
  surface: string;
}

export interface MonitorTone {
  shell: string;
  screen: string;
  stem: string;
  base: string;
}

export interface MouseTone {
  shell: string;
  wheel: string;
  wire?: string;
  glow?: string;
}

export interface KeyboardTone {
  shell: string;
  keys: string;
  glow?: string;
}

export const BOSS_EMPLOYEE: Employee = {
  id: 0,
  name: 'Chefe',
  team: 'Controle',
  education: 'Graduação',
  status: 'on-site',
  level: 3,
  errors: [],
  homeOfficeUsedThisMonth: 0,
  mood: 'focused',
  gender: 'male',
  avatar: 'boss',
  deskPosition: { row: 0, col: 0 },
};

export const VARIANT_DIMENSIONS: Record<DeskVariant, { width: number; height: number }> = {
  'corner-tl': { width: 148, height: 148 },
  'corner-tr': { width: 148, height: 148 },
  'corner-bl': { width: 148, height: 148 },
  'corner-br': { width: 148, height: 148 },
  pillar: { width: 120, height: 174 },
  boss: { width: 300, height: 210 },
};

export const VARIANT_CLIP_PATH: Record<DeskVariant, string> = {
  'corner-tl': 'polygon(0 0, 100% 0, 100% 44%, 42% 44%, 42% 100%, 0 100%)',
  'corner-tr': 'polygon(0 0, 100% 0, 100% 100%, 58% 100%, 58% 44%, 0 44%)',
  'corner-bl': 'polygon(0 0, 42% 0, 42% 56%, 100% 56%, 100% 100%, 0 100%)',
  'corner-br': 'polygon(58% 0, 100% 0, 100% 100%, 0 100%, 0 56%, 58% 56%)',
  pillar: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
  boss: 'polygon(0 0, 100% 0, 100% 44%, 36% 44%, 36% 100%, 0 100%)',
};

export const VARIANT_BADGE_POSITION: Record<DeskVariant, string> = {
  'corner-tl': 'left-5 top-5',
  'corner-tr': 'right-5 top-5',
  'corner-bl': 'left-5 bottom-5',
  'corner-br': 'right-5 bottom-5',
  pillar: 'left-1/2 top-5 -translate-x-1/2',
  boss: 'left-1/2 top-5 -translate-x-1/2',
};

export const VARIANT_MONITOR_STYLE: Record<DeskVariant, CSSProperties> = {
  'corner-tl': { left: 66, top: 30 },
  'corner-tr': { left: 26, top: 30 },
  'corner-bl': { left: 66, top: 74 },
  'corner-br': { left: 26, top: 74 },
  pillar: { left: '50%', top: 18, transform: 'translateX(-50%)' },
  boss: { right: 34, top: 24 },
};

export const VARIANT_MOUSE_STYLE: Record<DeskVariant, CSSProperties> = {
  'corner-tl': { left: 112, top: 60 },
  'corner-tr': { left: 30, top: 60 },
  'corner-bl': { left: 112, top: 89 },
  'corner-br': { left: 30, top: 89 },
  pillar: { left: '50%', top: 74, transform: 'translateX(-50%)' },
  boss: { right: 96, top: 66 },
};

export const VARIANT_KEYBOARD_STYLE: Record<DeskVariant, CSSProperties> = {
  'corner-tl': { left: 66, top: 60 },
  'corner-tr': { left: 26, top: 60 },
  'corner-bl': { left: 66, top: 89 },
  'corner-br': { left: 26, top: 89 },
  pillar: { left: '50%', top: 50, transform: 'translateX(-50%)' },
  boss: { right: 34, top: 66 },
};

export const VARIANT_CHARACTER_STYLE: Record<DeskVariant, CSSProperties> = {
  'corner-tl': { left: 92, top: 18 },
  'corner-tr': { left: -10, top: 18 },
  'corner-bl': { left: 92, top: 58 },
  'corner-br': { left: -10, top: 58 },
  pillar: { right: -54, top: '50%', transform: 'translateY(-50%)' },
  boss: { right: 18, bottom: 12 },
};

export function getDeskTone(employee?: Employee, isBoss?: boolean): DeskTone {
  if (isBoss) {
    return {
      surface: 'bg-[#1a1a1a] border-[#090909] shadow-[0_22px_32px_rgba(0,0,0,0.28)]',
    };
  }

  switch (employee?.deskStyle) {
    case 'gamer':
      return {
        surface: 'bg-black border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.35)]',
      };
    case 'medium':
      return {
        surface: 'bg-[#22170f] border-[#120b07] shadow-[0_12px_24px_rgba(0,0,0,0.25)]',
      };
    default:
      return {
        surface: 'bg-[#111111] border-[#050505] shadow-[0_12px_24px_rgba(0,0,0,0.22)]',
      };
  }
}

export function getMonitorTone(employee?: Employee, isBoss?: boolean): MonitorTone {
  if (isBoss) {
    return {
      shell: 'border-[#7e7e7e] bg-[#c2c6cb]',
      screen: 'bg-gradient-to-b from-slate-200/20 to-[#000080]/85',
      stem: 'bg-gray-500',
      base: 'bg-gray-600',
    };
  }

  switch (employee?.monitorStyle) {
    case 'gamer':
      return {
        shell: 'border-red-500 bg-gray-950 shadow-[0_0_12px_rgba(239,68,68,0.4)]',
        screen: 'bg-gradient-to-br from-cyan-400/30 via-indigo-500/30 to-black',
        stem: 'bg-red-500',
        base: 'bg-red-700',
      };
    case 'medium':
      return {
        shell: 'border-slate-300 bg-slate-700',
        screen: 'bg-gradient-to-b from-sky-100/30 to-slate-950',
        stem: 'bg-slate-300',
        base: 'bg-slate-400',
      };
    default:
      return {
        shell: 'border-[#808080] bg-[#c0c0c0]',
        screen: 'bg-[#000080]/80',
        stem: 'bg-gray-500',
        base: 'bg-gray-600',
      };
  }
}

export function getMouseTone(employee?: Employee, isBoss?: boolean): MouseTone {
  if (isBoss) {
    return {
      shell: 'border-[#7d7d7d] bg-[#e2e8f0]',
      wheel: 'bg-slate-500',
      wire: 'bg-slate-400',
    };
  }

  switch (employee?.mouseStyle) {
    case 'gamer':
      return {
        shell: 'border-red-500 bg-black shadow-[0_0_10px_rgba(239,68,68,0.35)]',
        wheel: 'bg-cyan-300',
        glow: 'shadow-[0_0_8px_rgba(34,211,238,0.5)]',
      };
    case 'medium':
      return {
        shell: 'border-slate-300 bg-slate-100',
        wheel: 'bg-slate-500',
      };
    default:
      return {
        shell: 'border-gray-500 bg-gray-300',
        wheel: 'bg-gray-600',
        wire: 'bg-gray-500',
      };
  }
}

export function getKeyboardTone(employee?: Employee, isBoss?: boolean): KeyboardTone {
  if (isBoss) {
    return {
      shell: 'border-[#7d7d7d] bg-[#e2e8f0]',
      keys: 'bg-slate-500',
    };
  }

  switch (employee?.keyboardStyle || employee?.mouseStyle) {
    case 'gamer':
      return {
        shell: 'border-red-500 bg-black shadow-[0_0_10px_rgba(239,68,68,0.35)]',
        keys: 'bg-cyan-300',
        glow: 'shadow-[0_0_8px_rgba(34,211,238,0.5)]',
      };
    case 'medium':
      return {
        shell: 'border-slate-300 bg-slate-100',
        keys: 'bg-slate-500',
      };
    default:
      return {
        shell: 'border-gray-500 bg-gray-300',
        keys: 'bg-gray-600',
      };
  }
}
