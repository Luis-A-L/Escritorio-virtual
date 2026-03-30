import { Employee } from '../types';

interface HUDProps {
  employees?: Employee[];
  totalXP?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  zoomLevel?: number;
}

export default function HUD({ employees = [], totalXP = 0, onZoomIn, onZoomOut, zoomLevel = 1 }: HUDProps) {
  const onlineCount = employees.filter(employee => employee.status !== 'absent').length;
  const remoteCount = employees.filter(employee => employee.status === 'remote').length;
  const today = new Date().toLocaleDateString('pt-BR');
  const currentMonth = new Date()
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .toUpperCase();

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-[#071019]/88 px-5 py-4 shadow-[0_24px_60px_rgba(0,0,0,0.32)] backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300">P-SEP-AR</p>
            <h1 className="mt-1 truncate text-lg font-bold text-white md:text-2xl">Escritorio Virtual</h1>
          </div>
          </div>

        <div className="flex items-center gap-3 lg:flex">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-right">
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Hoje</p>
            <p className="mt-1 text-sm font-semibold text-white">{today}</p>
          </div>

          {(onZoomIn || onZoomOut) && (
            <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-2 py-1 ml-2 shadow-sm">
              <button 
                onClick={onZoomOut} 
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-cyan-400/20 text-white flex items-center justify-center font-bold text-xl transition-colors border border-white/5 hover:border-cyan-400/30" 
                title="Zoom Out"
              >−</button>
              <div className="flex flex-col items-center px-1">
                <span className="text-[9px] font-mono text-cyan-300/60 uppercase tracking-tighter">Zoom</span>
                <span className="text-xs font-mono text-white font-bold">{Math.round(zoomLevel * 100)}%</span>
              </div>
              <button 
                onClick={onZoomIn} 
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-cyan-400/20 text-white flex items-center justify-center font-bold text-xl transition-colors border border-white/5 hover:border-cyan-400/30" 
                title="Zoom In"
              >+</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-200">Online</p>
            <p className="mt-1 text-sm font-bold text-white md:text-base">{onlineCount}</p>
          </div>
          <div className="hidden rounded-2xl border border-sky-400/25 bg-sky-400/10 px-3 py-2 sm:block">
            <p className="text-[10px] uppercase tracking-[0.22em] text-sky-200">Remoto</p>
            <p className="mt-1 text-sm font-bold text-white md:text-base">{remoteCount}</p>
          </div>
          <div className="hidden rounded-2xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 xl:block">
            <p className="text-[10px] uppercase tracking-[0.22em] text-amber-200">XP Total</p>
            <p className="mt-1 text-sm font-bold text-white md:text-base">{totalXP}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
