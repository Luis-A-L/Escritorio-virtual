import React from 'react';
import { Employee } from '../../types';
import { DeskVariant, VARIANT_KEYBOARD_STYLE, getKeyboardTone } from './config';

interface DeskKeyboardProps {
  employee?: Employee;
  variant: DeskVariant;
  isBoss?: boolean;
  isSelected?: boolean;
}

export default function DeskKeyboard({ employee, variant, isBoss = false, isSelected = false }: DeskKeyboardProps) {
  const baseStyle = VARIANT_KEYBOARD_STYLE[variant];
  const tone = getKeyboardTone(employee, isBoss);
  
  const combinedStyle = {
    ...baseStyle,
    transform: employee?.keyboardOffset 
      ? `${baseStyle.transform || ''} translate(${employee.keyboardOffset.x}px, ${employee.keyboardOffset.y}px) rotate(${employee.keyboardOffset.rotation || 0}deg)`
      : baseStyle.transform
  };

  return (
    <div 
      className={`absolute z-20 flex flex-col justify-between ${isSelected ? 'ring-2 ring-[#00ff88] rounded p-0.5' : ''}`} 
      style={combinedStyle}
      data-drag-type={!isBoss ? "keyboard" : undefined}
      data-employee-id={employee?.id}
    >
      <div 
        className={`w-11 h-4 border rounded-sm shadow-sm flex flex-col justify-between overflow-hidden p-0.5 ${tone.shell} ${tone.glow || ''}`}
        style={{ backgroundColor: employee?.keyboardColor || undefined }}
      >
        <div className="w-full flex justify-between px-0.5">
          <div className={`w-1 h-0.5 ${tone.keys}`}></div>
          <div className={`w-1 h-0.5 ${tone.keys}`}></div>
          <div className={`w-1 h-0.5 ${tone.keys}`}></div>
          <div className={`w-1 h-0.5 ${tone.keys}`}></div>
          <div className={`w-1 h-0.5 ${tone.keys}`}></div>
          <div className={`w-1 h-0.5 ${tone.keys}`}></div>
        </div>
        <div className="w-full flex justify-center mt-0.5">
          <div className={`w-5 h-0.5 ${tone.keys}`}></div>
        </div>
        <div className="w-full flex justify-between px-0.5 pt-0.5">
          <div className={`w-1 h-0.5 ${tone.keys}`}></div>
          <div className={`w-1 h-0.5 ${tone.keys}`}></div>
          <div className={`w-1 h-0.5 ${tone.keys}`}></div>
          <div className={`w-1 h-0.5 ${tone.keys}`}></div>
        </div>
      </div>
    </div>
  );
}
