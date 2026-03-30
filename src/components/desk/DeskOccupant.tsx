import React from 'react';
import Character from '../Character';
import { Employee } from '../../types';
import { DeskVariant } from '../../types';
import { VARIANT_CHARACTER_STYLE } from './config';

interface DeskOccupantProps {
  employee: Employee;
  variant: DeskVariant;
  isBoss?: boolean;
  isSelected?: boolean;
}

export default function DeskOccupant({ employee, variant, isBoss = false, isSelected = false }: DeskOccupantProps) {
  const baseStyle = VARIANT_CHARACTER_STYLE[variant];
  const combinedStyle = {
    ...baseStyle,
    transform: employee?.characterOffset 
      ? `${baseStyle.transform || ''} translate(${employee.characterOffset.x}px, ${employee.characterOffset.y}px) rotate(${employee.characterOffset.rotation || 0}deg)`
      : baseStyle.transform
  };

  return (
    <div 
      className="absolute z-30 flex flex-col items-center pointer-events-none" 
      style={combinedStyle}
    >
      <div 
        className={`pointer-events-auto ${isSelected ? 'ring-2 ring-[#00ff88] rounded p-0.5' : ''}`}
        data-drag-type={!isBoss ? "character" : undefined}
        data-employee-id={employee?.id}
      >
        <Character employee={employee} size={isBoss ? 'lg' : 'md'} />
      </div>
      <div className="mt-1 whitespace-nowrap rounded border border-gray-600 bg-black/85 px-2 py-0.5 text-[10px] text-white shadow-md pointer-events-none">
        {isBoss && !employee.name ? 'Chefe' : employee.name}
      </div>
    </div>
  );
}
