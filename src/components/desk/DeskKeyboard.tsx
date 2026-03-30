import React from 'react';
import { Employee, DeskSlot } from '../../types';
import { VARIANT_KEYBOARD_STYLE, getKeyboardTone } from './config';

interface DeskKeyboardProps {
  deskSlot: DeskSlot;
  employee?: Employee;
  isSelected?: boolean;
}

export default function DeskKeyboard({ deskSlot, employee, isSelected = false }: DeskKeyboardProps) {
  const { variant, isBoss = false } = deskSlot;
  const keyboardOffset = deskSlot.keyboardOffset || employee?.keyboardOffset;
  const keyboardColor = deskSlot.keyboardColor || employee?.keyboardColor;
  const keyboardStyle = deskSlot.keyboardStyle || employee?.keyboardStyle;
  const mouseStyle = deskSlot.mouseStyle || employee?.mouseStyle;

  const isGamer = keyboardStyle === 'gamer' && !isBoss;
  const isMedium = keyboardStyle === 'medium' && !isBoss;

  const baseStyle = VARIANT_KEYBOARD_STYLE[variant];
  const tone = getKeyboardTone(keyboardStyle, mouseStyle, isBoss);
  
  const combinedStyle = {
    ...baseStyle,
    transform: keyboardOffset 
      ? `${baseStyle.transform || ''} translate(${keyboardOffset.x}px, ${keyboardOffset.y}px) rotate(${keyboardOffset.rotation || 0}deg)`
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
        style={{ backgroundColor: keyboardColor || undefined }}
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
