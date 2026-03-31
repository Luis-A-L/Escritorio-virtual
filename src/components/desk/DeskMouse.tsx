import React from 'react';
import { Employee, DeskSlot } from '../../types';
import { VARIANT_MOUSE_STYLE, getMouseTone } from './config';

interface DeskMouseProps {
  deskSlot: DeskSlot;
  employee?: Employee;
  isSelected?: boolean;
}

export default function DeskMouse({ deskSlot, employee, isSelected = false }: DeskMouseProps) {
  const { variant, isBoss = false } = deskSlot;
  const mouseOffset = deskSlot.mouseOffset || employee?.mouseOffset;
  const mouseColor = deskSlot.mouseColor || employee?.mouseColor;
  const mouseStyle = deskSlot.mouseStyle || employee?.mouseStyle;
  const mouseTone = getMouseTone(mouseStyle, isBoss);

  const isGamer = mouseStyle === 'gamer' && !isBoss;
  const isMedium = mouseStyle === 'medium' && !isBoss;

  const isSimple = !isBoss && (!mouseStyle || mouseStyle === 'simple');

  const baseStyle = VARIANT_MOUSE_STYLE[variant];
  const combinedStyle = {
    ...baseStyle,
    transform: mouseOffset 
      ? `${baseStyle.transform || ''} translate(${mouseOffset.x}px, ${mouseOffset.y}px) rotate(${mouseOffset.rotation || 0}deg)`
      : baseStyle.transform
  };

  return (
    <div 
      className={`absolute z-20 ${isSelected ? 'ring-2 ring-[#00ff88] rounded p-0.5' : ''}`} 
      style={combinedStyle}
      data-drag-type={!isBoss ? "mouse" : undefined}
      data-employee-id={employee?.id}
    >
      <div className="relative">
        {isSimple && <div className={`absolute -left-4 top-1/2 h-[2px] w-4 -translate-y-1/2 ${mouseTone.wire}`} />}
        <div 
          className={`relative h-5 w-3 rounded-[999px] border ${mouseTone.shell} ${mouseTone.glow ?? ''}`}
          style={{ backgroundColor: mouseColor || undefined }}
        >
          <div className={`absolute left-1/2 top-[4px] h-2 w-[2px] -translate-x-1/2 rounded-full ${mouseTone.wheel}`} />
        </div>
      </div>
    </div>
  );
}
