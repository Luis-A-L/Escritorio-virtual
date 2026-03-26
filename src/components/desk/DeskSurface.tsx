import React from 'react';
import { Employee, DeskSlot } from '../../types';
import { DeskVariant } from '../../types';
import { VARIANT_BADGE_POSITION, VARIANT_CLIP_PATH, getDeskTone } from './config';

interface DeskSurfaceProps {
  deskSlot: DeskSlot;
  employee?: Employee;
}

export default function DeskSurface({ deskSlot, employee }: DeskSurfaceProps) {
  const { seatNumber, variant, isBoss = false } = deskSlot;
  const deskTone = getDeskTone(employee, isBoss);
  const deskColor = deskSlot.deskColor || (employee as any)?.deskColor;

  return (
    <>
      <div className={`absolute inset-0 border-[3px] ${deskTone.surface}`} style={{ clipPath: VARIANT_CLIP_PATH[variant], backgroundColor: deskColor || undefined }} />

      <div className={`absolute z-20 ${VARIANT_BADGE_POSITION[variant]}`}>
        <div className="min-w-10 border border-black bg-white px-2 py-1 text-center text-xs font-bold text-black shadow-sm">
          {seatNumber}
        </div>
      </div>

      {isBoss && (
        <div className="absolute left-5 top-1/2 z-20 -translate-y-1/2 rounded-full border border-amber-200/50 bg-black/70 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-amber-300">
          CHEFE
        </div>
      )}
    </>
  );
}
