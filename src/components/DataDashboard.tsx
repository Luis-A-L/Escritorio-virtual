import { Employee, Team } from '../types';

interface DataDashboardProps {
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_CONFIG = {
  'on-site': { label: 'Presencial', color: '#22c55e', dot: 'bg-emerald-400' },
  'remote': { label: 'Remoto', color: '#38bdf8', dot: 'bg-sky-400' },
  'absent': { label: 'Ausente', color: '#f87171', dot: 'bg-red-400' },
  'vacation': { label: 'Férias', color: '#facc15', dot: 'bg-yellow-400' },
} as const;

const LEVEL_LABELS = ['Trainee', 'Júnior', 'Pleno', 'Sênior'];

export default function DataDashboard({ employees, isOpen, onClose }: DataDashboardProps) {
  if (!isOpen) return null;

  const teams = Array.from(new Set(employees.map(e => e.team))) as Team[];
  const onSite = employees.filter(e => e.status === 'on-site').length;
  const remote = employees.filter(e => e.status === 'remote').length;
  const absent = employees.filter(e => e.status === 'absent').length;
  const vacation = employees.filter(e => e.status === 'vacation').length;
  const total = employees.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-5xl max-h-[90vh] flex flex-col gap-4 overflow-hidden rounded-[32px] border border-white/10 bg-[#07101a]/95 p-6 shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300">P-SEP-AR</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Painel da Equipe</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition"
          >
            Fechar
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: total, color: '#ffffff' },
            { label: 'Presencial', value: onSite, color: '#22c55e' },
            { label: 'Remoto', value: remote, color: '#38bdf8' },
            { label: 'Ausente / Férias', value: absent + vacation, color: '#f87171' },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center"
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Team Sections */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {teams.map(team => {
            const teamMembers = employees.filter(e => e.team === team);
            return (
              <div key={team} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                {/* Team Header */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 bg-white/[0.03]">
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  <h3 className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-white">{team}</h3>
                  <span className="ml-auto text-xs text-slate-400">{teamMembers.length} membros</span>
                </div>

                {/* Members Table */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-2 px-5 text-left text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Nome</th>
                      <th className="py-2 px-4 text-left text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Status</th>
                      <th className="py-2 px-4 text-left text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Nível</th>
                      <th className="py-2 px-4 text-left text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Home Office</th>
                      <th className="py-2 px-4 text-left text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Erros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map(emp => {
                      const sc = STATUS_CONFIG[emp.status] || STATUS_CONFIG['on-site'];
                      return (
                        <tr key={emp.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="py-2 px-5 font-semibold text-white">{emp.name}</td>
                          <td className="py-2 px-4">
                            <span className="flex items-center gap-2">
                              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                              <span style={{ color: sc.color }} className="text-xs font-mono">{sc.label}</span>
                            </span>
                          </td>
                          <td className="py-2 px-4 text-slate-300 text-xs">{LEVEL_LABELS[emp.level]}</td>
                          <td className="py-2 px-4">
                            {emp.homeOfficeDates && emp.homeOfficeDates.length > 0 ? (
                              <div className="flex flex-col gap-0.5">
                                {emp.homeOfficeDates.map((date, i) => (
                                  <span key={i} className="text-xs font-mono text-sky-300 bg-sky-400/10 rounded px-1.5 py-0.5 w-fit">
                                    {date}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            <span className={`text-xs font-bold ${(emp.errors?.length || 0) > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                              {emp.errors?.length || 0}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
