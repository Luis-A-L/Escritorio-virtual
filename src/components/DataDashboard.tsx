import { Employee, Team } from '../types';

interface DataDashboardProps {
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_CONFIG = {
  'on-site': { label: 'Presencial', color: '#22c55e', dot: 'bg-emerald-400' },
  remote: { label: 'Remoto', color: '#38bdf8', dot: 'bg-sky-400' },
  absent: { label: 'Ausente', color: '#f87171', dot: 'bg-red-400' },
  vacation: { label: 'Ferias', color: '#facc15', dot: 'bg-yellow-400' },
} as const;

const LEVEL_LABELS = ['Trainee', 'Junior', 'Pleno', 'Senior'];

const formatVacationDate = (value?: string) => {
  if (!value) return 'Nao informado';

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('pt-BR');
};

export default function DataDashboard({ employees, isOpen, onClose }: DataDashboardProps) {
  if (!isOpen) return null;

  const teams = Array.from(new Set(employees.map((employee) => employee.team))) as Team[];
  const onSite = employees.filter((employee) => employee.status === 'on-site').length;
  const remote = employees.filter((employee) => employee.status === 'remote').length;
  const absent = employees.filter((employee) => employee.status === 'absent').length;
  const vacation = employees.filter((employee) => employee.status === 'vacation').length;
  const total = employees.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col gap-4 overflow-hidden rounded-[32px] border border-white/10 bg-[#07101a]/95 p-6 shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300">P-SEP-AR</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Painel da Equipe</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
          >
            Fechar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total', value: total, color: '#ffffff' },
            { label: 'Presencial', value: onSite, color: '#22c55e' },
            { label: 'Remoto', value: remote, color: '#38bdf8' },
            { label: 'Ausente / Ferias', value: absent + vacation, color: '#f87171' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center"
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
                {stat.label}
              </p>
              <p className="mt-1 text-3xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {teams.map((team) => {
            const teamMembers = employees.filter((employee) => employee.team === team);

            return (
              <div
                key={team}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.03] px-5 py-3">
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  <h3 className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-white">
                    {team}
                  </h3>
                  <span className="ml-auto text-xs text-slate-400">{teamMembers.length} membros</span>
                </div>

                <table className="w-full text-sm overflow-visible">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-5 py-2 text-left text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
                        Nome
                      </th>
                      <th className="px-4 py-2 text-left text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
                        Nivel
                      </th>
                      <th className="px-4 py-2 text-left text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
                        Home Office
                      </th>
                      <th className="px-4 py-2 text-left text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
                        Erros
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((employee) => {
                      const statusConfig = STATUS_CONFIG[employee.status] || STATUS_CONFIG['on-site'];
                      const vacationTooltip =
                        employee.status === 'vacation'
                          ? `Inicio: ${formatVacationDate(employee.vacationStart)} | Fim: ${formatVacationDate(employee.vacationEnd)}`
                          : '';

                      return (
                        <tr key={employee.id} className="border-b border-white/5 transition hover:bg-white/5">
                          <td className="px-5 py-2 font-semibold text-white">{employee.name}</td>
                          <td className="px-4 py-2">
                            <span
                              className={`relative inline-flex items-center gap-2 ${
                                employee.status === 'vacation' ? 'group cursor-help' : ''
                              }`}
                              title={vacationTooltip}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                              <span style={{ color: statusConfig.color }} className="text-xs font-mono">
                                {statusConfig.label}
                              </span>
                              {employee.status === 'vacation' && (
                                <span className="pointer-events-none absolute bottom-full left-0 z-[200] mb-2 hidden min-w-[160px] whitespace-nowrap rounded-xl border border-amber-300/20 bg-[#081018] px-3 py-2 text-[10px] text-amber-100 shadow-[0_20px_50px_rgba(0,0,0,0.45)] group-hover:block">
                                  <span className="block">
                                    Início: {formatVacationDate(employee.vacationStart)}
                                  </span>
                                  <span className="mt-1 block">
                                    Fim: {formatVacationDate(employee.vacationEnd)}
                                  </span>
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-300">
                            {LEVEL_LABELS[employee.level]}
                          </td>
                          <td className="px-4 py-2">
                            {employee.homeOfficeDates && employee.homeOfficeDates.length > 0 ? (
                              <div className="flex flex-col gap-0.5">
                                {employee.homeOfficeDates.map((date) => (
                                  <span
                                    key={`${employee.id}-${date}`}
                                    className="w-fit rounded bg-sky-400/10 px-1.5 py-0.5 text-xs font-mono text-sky-300"
                                  >
                                    {date}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-600">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`text-xs font-bold ${
                                (employee.errors?.length || 0) > 0 ? 'text-red-400' : 'text-slate-500'
                              }`}
                            >
                              {employee.errors?.length || 0}
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
