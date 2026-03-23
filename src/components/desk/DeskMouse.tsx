import React from 'react';
import { Employee } from '../../types';
import { DeskVariant, VARIANT_MOUSE_STYLE, getMouseTone } from './config';

interface DeskMouseProps {
  employee?: Employee;
  variant: DeskVariant;
  isBoss?: boolean;
  isSelected?: boolean;
}

export default function DeskMouse({ employee, variant, isBoss = false, isSelected = false }: DeskMouseProps) {
  const mouseTone = getMouseTone(employee, isBoss);
  const isSimple = !isBoss && (!employee?.mouseStyle || employee.mouseStyle === 'simple');

  const baseStyle = VARIANT_MOUSE_STYLE[variant];
  const combinedStyle = {
    ...baseStyle,
    transform: employee?.mouseOffset 
      ? `${baseStyle.transform || ''} translate(${employee.mouseOffset.x}px, ${employee.mouseOffset.y}px) rotate(${employee.mouseOffset.rotation || 0}deg)`
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
          style={{ backgroundColor: employee?.mouseColor || undefined }}
        >
          <div className={`absolute left-1/2 top-[4px] h-2 w-[2px] -translate-x-1/2 rounded-full ${mouseTone.wheel}`} />
        </div>
      </div>
    </div>
  );
}
