import React from 'react';
import { Employee, DeskSlot } from '../../types';
import { VARIANT_BADGE_POSITION, VARIANT_CLIP_PATH, getDeskTone } from './config';

interface DeskSurfaceProps {
  deskSlot: DeskSlot;
  employee?: Employee;
}

export default function DeskSurface({ deskSlot, employee }: DeskSurfaceProps) {
  const { seatNumber, variant, isBoss = false } = deskSlot;
  const deskStyle = deskSlot.deskStyle || employee?.deskStyle;
  const deskTone = getDeskTone(deskStyle, isBoss);
  const deskColor = deskSlot.deskColor || employee?.deskColor;

  return (
    <>
      <div
        className={`absolute inset-0 border-[3px] ${deskTone.surface}`}
        style={{ clipPath: VARIANT_CLIP_PATH[variant], backgroundColor: deskColor || undefined }}
      />

      {deskStyle === 'medium' && (
        <div
          className="absolute inset-[6px] opacity-70 pointer-events-none"
          style={{
            clipPath: VARIANT_CLIP_PATH[variant],
            backgroundImage: 'repeating-linear-gradient(18deg, rgba(120,74,42,0.34) 0px, rgba(120,74,42,0.34) 7px, rgba(58,34,18,0.2) 7px, rgba(58,34,18,0.2) 14px)',
          }}
        />
      )}

      {deskStyle === 'gamer' && (
        <>
          <div
            className="absolute inset-[6px] pointer-events-none"
            style={{
              clipPath: VARIANT_CLIP_PATH[variant],
              background: 'linear-gradient(135deg, rgba(255,0,85,0.22), transparent 38%, transparent 62%, rgba(0,255,200,0.16))',
            }}
          />
          <div
            className="absolute inset-[8px] border border-cyan-400/40 pointer-events-none shadow-[0_0_12px_rgba(34,211,238,0.25)]"
            style={{ clipPath: VARIANT_CLIP_PATH[variant] }}
          />
        </>
      )}

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
