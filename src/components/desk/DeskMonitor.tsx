import React from 'react';
import { Employee, DeskSlot } from '../../types';
import { DeskVariant } from '../../types';
import { VARIANT_MONITOR_STYLE, getMonitorTone } from './config';

interface DeskMonitorProps {
  deskSlot: DeskSlot;
  employee?: Employee;
  isSelected?: boolean;
}

export default function DeskMonitor({ deskSlot, employee, isSelected = false }: DeskMonitorProps) {
  const { variant, isBoss = false } = deskSlot;
  const monitorTone = getMonitorTone(employee, isBoss);
  const monitorOffset = deskSlot.monitorOffset || employee?.monitorOffset;
  const monitorColor = deskSlot.monitorColor || employee?.monitorColor;
  const monitorStyle = deskSlot.monitorStyle || employee?.monitorStyle;

  const isGamer = monitorStyle === 'gamer' && !isBoss;
  const isMedium = monitorStyle === 'medium' && !isBoss;

  const baseStyle = VARIANT_MONITOR_STYLE[variant];
  const combinedStyle = {
    ...baseStyle,
    transform: monitorOffset 
      ? `${baseStyle.transform || ''} translate(${monitorOffset.x}px, ${monitorOffset.y}px) rotate(${monitorOffset.rotation || 0}deg)`
      : baseStyle.transform
  };

  return (
    <div 
      className={`absolute z-20 ${isSelected ? 'ring-2 ring-[#00ff88] rounded p-0.5' : ''}`} 
      style={combinedStyle}
      data-drag-type={!isBoss ? "monitor" : undefined}
      data-employee-id={employee?.id}
    >
      <div
        className={`border-2 p-1 shadow-md ${
          isGamer ? 'h-7 w-14 rounded-[999px]' : isMedium ? 'h-7 w-14 rounded-md' : 'h-8 w-11 rounded-sm'
        } ${monitorTone.shell}`}
        style={{ backgroundColor: monitorColor || undefined }}
      >
        <div className={`h-full w-full ${monitorTone.screen}`} />
      </div>
      <div className={`mx-auto h-3 w-1 ${monitorTone.stem}`} />
      <div className={`mx-auto h-1 w-6 ${monitorTone.base}`} />
    </div>
  );
}
