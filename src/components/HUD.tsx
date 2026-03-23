import { Employee } from '../types';

interface HUDProps {
  employees?: Employee[];
  totalXP?: number;
}

export default function HUD({ employees = [], totalXP = 0 }: HUDProps) {
  const onlineCount = employees.filter(e => e.status !== 'absent').length;
  const today = new Date().toLocaleDateString('pt-BR');
  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="fixed top-0 left-0 w-full bg-[#1a1a2e] border-b-4 border-[#00ff88] p-4 flex justify-between items-center z-50 font-mono text-xs md:text-sm shadow-lg">
      <div className="flex items-center gap-4">
        <h1 className="text-[#00ff88] text-lg md:text-xl font-bold tracking-widest drop-shadow-[0_0_5px_rgba(0,255,136,0.8)]">
          P-SEP-AR VIRTUAL
        </h1>
      </div>

      <div className="hidden md:flex flex-col items-center">
        <span className="text-gray-400 text-[10px]">MÊS ATUAL</span>
        <span className="text-white">{currentMonth}</span>
      </div>

      <div className="flex gap-6 items-center">
        <div className="flex flex-col items-end gap-1">
          <span className="text-gray-400 text-[10px]">HOJE: {today}</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-2" title="Jogadores Online">
              <span className="w-3 h-3 bg-[#00ff88] inline-block border border-white"></span>
              {onlineCount} Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
