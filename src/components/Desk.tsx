import React from 'react';
import { Employee, LayoutItemReference } from '../types';
import DeskMonitor from './desk/DeskMonitor';
import DeskMouse from './desk/DeskMouse';
import DeskKeyboard from './desk/DeskKeyboard';
import DeskOccupant from './desk/DeskOccupant';
import DeskSurface from './desk/DeskSurface';
import { BOSS_EMPLOYEE, VARIANT_DIMENSIONS } from './desk/config';
import { DeskVariant } from '../types';

interface DeskProps {
  employee?: Employee;
  onClick?: () => void;
  seatNumber: number;
  variant: DeskVariant;
  isBoss?: boolean;
  selectedItems?: LayoutItemReference[];
  renderMode?: 'all' | 'surface' | 'peripherals';
}



export default function Desk({ employee, onClick, seatNumber, variant, isBoss = false, selectedItems, renderMode = 'all' }: DeskProps) {
  const occupant = employee || (isBoss ? BOSS_EMPLOYEE : undefined);
  const dimensions = VARIANT_DIMENSIONS[variant];
  const isInteractive = Boolean(onClick);

  return (
    <div
      onClick={isInteractive ? onClick : undefined}
      className={`relative overflow-visible transition-transform ${isInteractive ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'}`}
      style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
    >
      {employee?.errors && employee.errors.length > 0 && renderMode !== 'peripherals' && (
        <div className="absolute -top-6 left-1/2 z-30 -translate-x-1/2 animate-bounce font-bold text-red-600">!</div>
      )}

      {(renderMode === 'all' || renderMode === 'surface') && (
        <DeskSurface employee={employee} seatNumber={seatNumber} variant={variant} isBoss={isBoss} />
      )}

      {occupant && (renderMode === 'all' || renderMode === 'peripherals') && (
        <div className={renderMode === 'peripherals' ? "pointer-events-auto" : ""}>
          <DeskMonitor 
            employee={occupant} 
            variant={variant} 
            isBoss={isBoss} 
            isSelected={!!occupant && selectedItems?.some(i => i.type === 'monitor' && i.id === occupant.id)}
          />
          <DeskMouse 
            employee={occupant} 
            variant={variant} 
            isBoss={isBoss} 
            isSelected={!!occupant && selectedItems?.some(i => i.type === 'mouse' && i.id === occupant.id)}
          />
          <DeskKeyboard 
            employee={occupant} 
            variant={variant} 
            isBoss={isBoss} 
            isSelected={!!occupant && selectedItems?.some(i => i.type === 'keyboard' && i.id === occupant.id)}
          />
          <DeskOccupant 
            employee={occupant} 
            variant={variant} 
            isBoss={isBoss} 
            isSelected={selectedItems?.some(i => i.type === 'character' && i.id === occupant.id)}
          />
        </div>
      )}
    </div>
  );
}
