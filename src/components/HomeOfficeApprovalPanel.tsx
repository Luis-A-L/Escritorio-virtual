import { Employee } from '../types';

interface HomeOfficeApprovalPanelProps {
  employees: Employee[];
  isOpen: boolean;
  onApprove: (employeeId: number, date: string) => void;
  onClose: () => void;
  onReject: (employeeId: number, date: string) => void;
}

interface PendingRequest {
  approvedByOthers: number;
  employee: Employee;
  sameDayPendingByOthers: number;
  sortableDate: number;
  date: string;
}

const parsePtBrDate = (value: string) => {
  const [day, month, year] = value.split('/').map(Number);
  return new Date(year, month - 1, day);
};

const buildPendingRequests = (employees: Employee[]): PendingRequest[] =>
  employees
    .flatMap((employee) =>
      (employee.pendingHomeOfficeDates || []).map((date) => ({
        approvedByOthers: employees.filter(
          (other) => other.id !== employee.id && other.homeOfficeDates?.includes(date),
        ).length,
        employee,
        sameDayPendingByOthers: employees.filter(
          (other) => other.id !== employee.id && other.pendingHomeOfficeDates?.includes(date),
        ).length,
        sortableDate: parsePtBrDate(date).getTime(),
        date,
      })),
    )
    .sort((a, b) => a.sortableDate - b.sortableDate || a.employee.name.localeCompare(b.employee.name));

export default function HomeOfficeApprovalPanel({
  employees,
  isOpen,
  onApprove,
  onClose,
  onReject,
}: HomeOfficeApprovalPanelProps) {
  if (!isOpen) return null;

  const pendingRequests = buildPendingRequests(employees);
  const employeesWithPending = new Set(pendingRequests.map((request) => request.employee.id)).size;
  const blockedRequests = pendingRequests.filter((request) => request.approvedByOthers >= 2).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-6xl flex-col gap-4 overflow-hidden rounded-[32px] border border-white/10 bg-[#07101a]/95 p-6 shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-300">Gestao</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Aprovacao de Home Office</h2>
            <p className="mt-2 text-sm text-slate-400">
              Revise os pedidos pendentes do mes e aprove ou recuse sem abrir perfil por perfil.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
          >
            Fechar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Pedidos</p>
            <p className="mt-1 text-3xl font-bold text-white">{pendingRequests.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Pessoas</p>
            <p className="mt-1 text-3xl font-bold text-sky-300">{employeesWithPending}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Conflitos</p>
            <p className="mt-1 text-3xl font-bold text-amber-300">{blockedRequests}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {pendingRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center">
              <p className="text-lg font-semibold text-white">Nenhum pedido pendente.</p>
              <p className="mt-2 text-sm text-slate-400">
                Quando alguem solicitar Home Office, a aprovacao aparecera aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => {
                const canApprove = request.approvedByOthers < 2;

                return (
                  <div
                    key={`${request.employee.id}-${request.date}`}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-bold text-white">{request.employee.name}</p>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400">
                            {request.employee.team}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                          <span className="rounded-xl border border-sky-400/20 bg-sky-400/10 px-2 py-1 font-mono text-sky-200">
                            {request.date}
                          </span>
                          <span>{request.employee.homeOfficeDates?.length || 0} dias aprovados no mes</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span
                            className={`rounded-full px-2 py-1 ${
                              canApprove
                                ? 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                                : 'border border-red-400/20 bg-red-400/10 text-red-300'
                            }`}
                          >
                            {canApprove
                              ? `${request.approvedByOthers} aprovados nessa data`
                              : `Limite atingido: ${request.approvedByOthers} aprovados`}
                          </span>
                          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-amber-300">
                            {request.sameDayPendingByOthers} outros pendentes
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() => onReject(request.employee.id, request.date)}
                          className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-400/20"
                        >
                          Recusar
                        </button>
                        <button
                          type="button"
                          onClick={() => onApprove(request.employee.id, request.date)}
                          disabled={!canApprove}
                          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                            canApprove
                              ? 'bg-emerald-400 text-black hover:bg-emerald-300'
                              : 'cursor-not-allowed border border-white/10 bg-white/5 text-slate-500'
                          }`}
                        >
                          Aprovar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
