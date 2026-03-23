import { Employee } from '../types';

interface CharacterProps {
  employee: Employee;
  size?: 'sm' | 'md' | 'lg';
}

export const SKINS: Record<string, { skin: string, shirt: string, pants: string, hair: string }> = {
  m1: { skin: '#ffdbac', shirt: '#3b82f6', pants: '#1e3a8a', hair: '#452809' },
  m2: { skin: '#8d5524', shirt: '#ef4444', pants: '#7f1d1d', hair: '#000000' },
  m3: { skin: '#e0ac69', shirt: '#10b981', pants: '#064e3b', hair: '#27272a' },
  m4: { skin: '#f1c27d', shirt: '#f59e0b', pants: '#78350f', hair: '#7c2d12' },
  f1: { skin: '#ffdbac', shirt: '#ec4899', pants: '#831843', hair: '#fcd34d' },
  f2: { skin: '#8d5524', shirt: '#eab308', pants: '#713f12', hair: '#000000' },
  f3: { skin: '#e0ac69', shirt: '#8b5cf6', pants: '#4c1d95', hair: '#452809' },
  f4: { skin: '#f1c27d', shirt: '#14b8a6', pants: '#134e4a', hair: '#7c2d12' },
  boss: { skin: '#fcd34d', shirt: '#1e3a8a', pants: '#172554', hair: '#452809' },
};

export default function Character({ employee, size = 'md' }: CharacterProps) {
  const skinData = SKINS[employee.avatar] || SKINS.m1;
  const isFemale = employee.gender === 'female';
  
  const headSize = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-16 h-16'
  };
  const bodySize = {
    sm: 'w-4 h-3',
    md: 'w-8 h-6',
    lg: 'w-16 h-12'
  };
  const legSize = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4'
  };
  const containerHeight = {
    sm: 'h-8',
    md: 'h-16',
    lg: 'h-32'
  };
  const customImageMaxWidth = {
    sm: 'max-w-[24px]',
    md: 'max-w-[56px]',
    lg: 'max-w-[112px]'
  };

  // If absent, make them grayscale and transparent
  const opacityClass = employee.status === 'absent' ? 'opacity-30 grayscale' : 'opacity-100';
  const animationClass = employee.status !== 'absent' ? 'animate-idle' : '';

  if (employee.customImageUrl) {
    return (
      <div className={`relative flex flex-col items-center justify-end ${animationClass} ${opacityClass} ${containerHeight[size]} scale-105 origin-bottom`}>
        {/* Remote Indicator */}
        {employee.status === 'remote' && (
          <div className="absolute -top-4 text-xs z-20" title="Home Office">🏠</div>
        )}
        <img 
          src={employee.customImageUrl} 
          alt={employee.name} 
          className={`w-auto h-auto ${customImageMaxWidth[size]} max-h-full object-contain z-10 drop-shadow-md`}
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center ${animationClass} ${opacityClass} scale-105 origin-bottom`}>
      {/* Remote Indicator */}
      {employee.status === 'remote' && (
        <div className="absolute -top-4 text-xs z-20" title="Home Office">🏠</div>
      )}

      {/* Head */}
      <div className={`${headSize[size]} relative border-2 border-[#1a1a2e] z-10`} style={{ backgroundColor: skinData.skin }}>
        {/* Hair */}
        <div className="absolute top-0 left-0 w-full h-1/3" style={{ backgroundColor: skinData.hair }}></div>
        {isFemale && (
          <>
            <div className="absolute top-1/3 -left-1 w-1 h-1/2" style={{ backgroundColor: skinData.hair }}></div>
            <div className="absolute top-1/3 -right-1 w-1 h-1/2" style={{ backgroundColor: skinData.hair }}></div>
          </>
        )}
        
        {/* Eyes */}
        <div className="absolute top-1/2 left-1/4 w-1/5 h-1/5 bg-[#1a1a2e]"></div>
        <div className="absolute top-1/2 right-1/4 w-1/5 h-1/5 bg-[#1a1a2e]"></div>
      </div>
      
      {/* Body */}
      <div className={`${bodySize[size]} border-x-2 border-b-2 border-[#1a1a2e] z-10 relative flex justify-center`} style={{ backgroundColor: skinData.shirt }}>
        {employee.avatar === 'boss' && (
          <div className="w-1/5 h-full bg-sky-400 z-20 shadow-sm border-x border-[#1a1a2e]/30"></div>
        )}
      </div>
      
      {/* Legs */}
      <div className={`flex justify-between w-full px-1 z-10 ${legSize[size]}`}>
        <div className="w-1/3 h-full border-x-2 border-b-2 border-[#1a1a2e]" style={{ backgroundColor: skinData.pants }}></div>
        <div className="w-1/3 h-full border-x-2 border-b-2 border-[#1a1a2e]" style={{ backgroundColor: skinData.pants }}></div>
      </div>
    </div>
  );
}
