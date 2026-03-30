import React, { useState, useEffect, useRef } from 'react';
import HUD from './components/HUD';
import Desk from './components/Desk';
import Modal from './components/Modal';
import Character from './components/Character';
import DataDashboard from './components/DataDashboard';
import HomeOfficeApprovalPanel from './components/HomeOfficeApprovalPanel';
import { Employee, Status, Team, ErrorType, EducationLevel, Gender, UserProfile, PositionOffset, LayoutItemReference, DeskSlot, HardwareStyle, INITIAL_DESK_SLOTS } from './types';
import { supabase } from './lib/supabase';

const TEAMS: Team[] = ['Triagem Cível', 'Triagem Crime', 'Retorno Crime', 'Retorno Cível', 'Controle', 'I.A.'];
const EDUCATION_LEVELS: EducationLevel[] = ['Ensino Médio', 'Graduação', 'Pós-graduação'];
const ERROR_TYPES: ErrorType[] = [
  'Distribuição incorreta',
  'Fragmentação indevida de incidentes',
  'Encaminhamento equivocado (Ord/Ass)',
  'Envio desnecessário (Ordinatórios)',
  'Envio desnecessário (Assessores)',
  'Outras falhas funcionais/operacionais'
];

const WORKSPACE_WIDTH = 1680;
const WORKSPACE_HEIGHT = 1210;
const DEFAULT_DESK_COLORS: Record<HardwareStyle, string> = {
  simple: '#111111',
  medium: '#5b3a29',
  gamer: '#0a0a0a',
};

function getSeatNumber(employee: Employee) {
  return employee.deskPosition.row * 3 + employee.deskPosition.col + 1;
}

function getDeskPositionFromSeatNumber(seatNumber: number) {
  return {
    row: Math.floor((seatNumber - 1) / 3),
    col: (seatNumber - 1) % 3,
  };
}

function parsePtBrDate(value: string) {
  const [day, month, year] = value.split('/').map(Number);
  return new Date(year, month - 1, day).getTime();
}

function sortPtBrDates(dates: string[]) {
  return [...dates].sort((left, right) => parsePtBrDate(left) - parsePtBrDate(right));
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

  const [authCpf, setAuthCpf] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [awaitingEmailConfirmation, setAwaitingEmailConfirmation] = useState(false);
  const currentUserId = currentUser?.id;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && employees.length > 0) {
      const currentUserEmp = employees.find(e => e.linkedUserId === currentUser.id || e.email === currentUser.email);
      const isAdmin = currentUser.email === '04296771973@tjpr.jus.br' || currentUser.email?.includes('rodrigo.louzano') || currentUserEmp?.is_admin || false;
      setUserProfile({ 
        uid: currentUser.id, 
        name: currentUser.email || 'Usuário', 
        email: currentUser.email || '', 
        role: isAdmin ? 'admin' : 'user' 
      });

      // Auto-link employee
      const emp = employees.find(e => e.email === currentUser.email);
      if (emp && emp.linkedUserId !== currentUser.id) {
        const prepareEmployeeForSupabase = (e: Employee) => ({
          ...e,
          characterOffset: e.characterOffset || { x: 0, y: 0, rotation: 0 },
          deskPosition: e.deskPosition || { row: 0, col: 0 }
        });
        
        const updated = { ...emp, linkedUserId: currentUser.id };
        setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
        supabase.from('employees').upsert(prepareEmployeeForSupabase(updated)).then(({ error }) => {
          if (error) console.error("Error linking user to employee", error);
        });
      }
    } else {
      setUserProfile(null);
    }
  }, [currentUser, employees]);



  const [deskSlots, setDeskSlots] = useState<DeskSlot[]>([]);

  const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
  
  const [dragTarget, setDragTarget] = useState<LayoutItemReference | null>(null);
  const [selectedLayoutItems, setSelectedLayoutItems] = useState<LayoutItemReference[]>([]);
  
  const [dragStartPositions, setDragStartPositions] = useState<Map<string, {initialX: number, initialY: number}>>(new Map());
  const [dragStartInfo, setDragStartInfo] = useState<{ mouseX: number; mouseY: number }>({ mouseX: 0, mouseY: 0 });

  interface LayoutState {
    deskSlots: DeskSlot[];
    employeeOffsets: Record<number, any>;
  }
  const [layoutHistory, setLayoutHistory] = useState<LayoutState[]>([]);
  const stateRef = useRef({ deskSlots: [] as DeskSlot[], employees: [] as Employee[] });
  const dragStartedRef = useRef(false);

  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isHomeOfficeApprovalOpen, setIsHomeOfficeApprovalOpen] = useState(false);
  const [alignmentGuides, setAlignmentGuides] = useState<{type: 'h'|'v', pos: number}[]>([]);

  useEffect(() => {
    stateRef.current = { deskSlots, employees };
  }, [deskSlots, employees]);

  const saveHistoryState = () => {
    setLayoutHistory(prev => [
      ...prev,
      {
        deskSlots: JSON.parse(JSON.stringify(stateRef.current.deskSlots)),
        employeeOffsets: stateRef.current.employees.reduce((acc, emp) => {
          acc[emp.id] = {
            monitorOffset: emp.monitorOffset,
            mouseOffset: emp.mouseOffset,
            keyboardOffset: emp.keyboardOffset,
            characterOffset: emp.characterOffset,
          };
          return acc;
        }, {} as Record<number, any>)
      }
    ].slice(-50));
  };

  const duplicateSelectedItems = async () => {
    saveHistoryState();
    const newDesks: DeskSlot[] = [];
    let nextSeatId = Math.max(0, ...deskSlots.map(d => d.seatNumber)) + 1;

    for (const item of selectedLayoutItems) {
      if (item.type === 'desk') {
        const original = deskSlots.find(d => d.seatNumber === item.id);
        if (original) {
          const duplicate = {
            ...original,
            seatNumber: nextSeatId++,
            left_pos: original.left_pos + 40,
            top_pos: original.top_pos + 40
          };
          newDesks.push(duplicate);
        }
      }
    }

    if (newDesks.length > 0) {
      setDeskSlots(prev => [...prev, ...newDesks]);
      const { error } = await supabase.from('desk_slots').insert(newDesks);
      if (error) alert(`Erro ao duplicar mesa: ${error.message}`);
      
      setSelectedLayoutItems(newDesks.map(d => ({ type: 'desk', id: d.seatNumber })));
    }
  };

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [clickedEmptySeat, setClickedEmptySeat] = useState<number | null>(null);
  const [selectedDeskSlotToEdit, setSelectedDeskSlotToEdit] = useState<DeskSlot | null>(null);
  const [moveTargetSeat, setMoveTargetSeat] = useState<number | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  
  const [newMemberGender, setNewMemberGender] = useState<Gender>('male');
  const [newMemberAvatar, setNewMemberAvatar] = useState<string>('m1');
  const [newMemberCustomImage, setNewMemberCustomImage] = useState<string | undefined>();

  const [zoom, setZoom] = useState(1);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const renderHomeOfficeCalendar = (targetEmployee: Employee) => {
    const isOwner = targetEmployee.linkedUserId === currentUserId;
    const isAdmin = userProfile?.role === 'admin';
    const currentMonthDate = new Date();
    const daysInMonth = new Date(
      currentMonthDate.getFullYear(),
      currentMonthDate.getMonth() + 1,
      0,
    ).getDate();
    if (!isOwner && !isAdmin) return null;

    return (
      <div className="mt-4 p-3 bg-sky-950/20 border border-sky-400/20 rounded">
        <p className="text-sky-300 font-bold mb-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <span>📅 AGENDAR HOME OFFICE</span>
          <span className="text-[10px] bg-black/40 px-2 py-1 rounded border border-sky-400/30">
            {targetEmployee.homeOfficeDates?.length || 0} Aprovados / {targetEmployee.pendingHomeOfficeDates?.length || 0} Pendentes
          </span>
        </p>
        <div className="grid grid-cols-7 gap-1 text-[10px] mb-2 text-slate-500 text-center uppercase tracking-tighter">
            {['D','S','T','Q','Q','S','S'].map((d,i)=><div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = new Date(
              currentMonthDate.getFullYear(),
              currentMonthDate.getMonth(),
              day,
            ).toLocaleDateString('pt-BR');
            
            const isApproved = targetEmployee.homeOfficeDates?.includes(dateStr);
            const isPending = targetEmployee.pendingHomeOfficeDates?.includes(dateStr);
            
            const othersApproved = employees.filter(e => e.id !== targetEmployee.id && e.homeOfficeDates?.includes(dateStr)).length;
            const othersPending = employees.filter(e => e.id !== targetEmployee.id && e.pendingHomeOfficeDates?.includes(dateStr)).length;
            const isConflict = othersApproved >= 2;

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (isAdmin && !isOwner) {
                     if (isPending) {
                       approvePendingHomeOfficeDate(targetEmployee.id, dateStr);
                     } else if (isApproved) {
                       updateEmployee({ 
                         ...targetEmployee, 
                         homeOfficeDates: targetEmployee.homeOfficeDates?.filter(d => d !== dateStr)
                       });
                     }
                  } else if (isOwner) {
                     if (isApproved) {
                       if(!confirm('Deseja cancelar este dia de Home Office aprovado?')) return;
                       updateEmployee({ 
                         ...targetEmployee, 
                         homeOfficeDates: targetEmployee.homeOfficeDates?.filter(d => d !== dateStr)
                       });
                     } else if (isPending) {
                       updateEmployee({ 
                         ...targetEmployee, 
                         pendingHomeOfficeDates: targetEmployee.pendingHomeOfficeDates?.filter(d => d !== dateStr)
                       });
                     } else {
                       const totalRequestedAndApproved = (targetEmployee.homeOfficeDates?.length || 0) + (targetEmployee.pendingHomeOfficeDates?.length || 0);
                       if (totalRequestedAndApproved >= getHomeOfficeAllowance(targetEmployee.level)) {
                         alert(`Você atingiu o limite mensal de ${getHomeOfficeAllowance(targetEmployee.level)} dias permitidos pelo seu nível.`);
                         return;
                       }
                       if (isConflict) {
                         alert(`Esta data já possui ${othersApproved} pessoas aprovadas e não pode ser agendada.`);
                         return;
                       }
                        setConfirmDialog({
                          title: 'Confirmar Solicitação',
                          message: `Deseja realmente solicitar o dia ${dateStr} para Home Office? A solicitação ficará pendente de aprovação.`,
                          onConfirm: () => {
                            updateEmployee({ 
                              ...targetEmployee, 
                              pendingHomeOfficeDates: [...(targetEmployee.pendingHomeOfficeDates || []), dateStr]
                            });
                          }
                        });
                     }
                  }
                }}
                disabled={isOwner && isConflict && !isApproved && !isPending}
                className={`aspect-square flex items-center justify-center rounded transition-all text-[10px] ${
                  isApproved 
                  ? 'bg-emerald-500 text-black font-bold border-2 border-emerald-400' 
                  : isPending
                    ? 'bg-amber-400 text-black font-bold border-2 border-amber-300'
                    : isOwner && isConflict
                      ? 'bg-red-900/40 text-red-500 cursor-not-allowed border border-red-900/50 opacity-50' 
                      : isAdmin && !isOwner && isConflict
                        ? 'bg-red-900/40 text-red-500 border border-red-900/50'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
                title={
                  isApproved ? 'Aprovado' :
                  isPending ? 'Pendente de aprovação' :
                  isConflict ? `${othersApproved} aprovados, ${othersPending} pendentes` : 
                  'Disponível'
                }
              >
                {day}
              </button>
            );
          })}
        </div>
        {(isAdmin && !isOwner) && targetEmployee.pendingHomeOfficeDates && targetEmployee.pendingHomeOfficeDates.length > 0 && (
          <p className="text-[10px] text-amber-400 mt-2 text-center animate-pulse">
            👆 Clique nas datas em amarelo para Aprovar.
          </p>
        )}
        {isOwner && (
          <div className="flex justify-center gap-4 mt-2 text-[8px] text-gray-400">
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-sm"></div> Aprovado</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-400 rounded-sm"></div> Pendente</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-900/40 border border-red-900/50 rounded-sm"></div> Lotação</span>
          </div>
        )}
      </div>
    );
  };

  const renderSkinCustomization = (targetEmployee: Employee) => {
    if (!targetEmployee) return null;
    return (
      <div className="bg-black p-2 border border-gray-700 text-xs mt-3">
        <p className="text-[#00ff88] mb-2 uppercase text-[10px] font-bold tracking-widest border-b border-[#00ff88]/30 pb-1">PERSONAGEM (SKIN & AVATAR)</p>
        <div className="flex gap-4 mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name={`profileGender-${targetEmployee.id}`} 
              value="male" 
              checked={targetEmployee.gender === 'male'} 
              onChange={() => updateEmployee({ ...targetEmployee, gender: 'male', avatar: 'm1' })}
              className="accent-[#00ff88]"
            />
            Menino
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name={`profileGender-${targetEmployee.id}`} 
              value="female" 
              checked={targetEmployee.gender === 'female'} 
              onChange={() => updateEmployee({ ...targetEmployee, gender: 'female', avatar: 'f1' })}
              className="accent-[#00ff88]"
            />
            Menina
          </label>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(targetEmployee.gender === 'female' ? ['f1', 'f2', 'f3', 'f4', 'boss'] : ['m1', 'm2', 'm3', 'm4', 'boss']).map(avatarId => (
            <button
              key={avatarId}
              onClick={() => updateEmployee({ ...targetEmployee, avatar: avatarId, customImageUrl: undefined })}
              className={`p-2 border ${targetEmployee.avatar === avatarId && !targetEmployee.customImageUrl ? 'border-[#00ff88] bg-[#00ff88]/20' : 'border-gray-600 hover:border-gray-400'}`}
            >
              <div className="pointer-events-none">
                 <Character employee={{ ...targetEmployee, avatar: avatarId, customImageUrl: undefined }} size="md" />
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-700">
          <label className="block text-gray-500 mb-1">OU FAÇA UPLOAD DE UMA IMAGEM</label>
          <p className="text-[10px] text-gray-400 mb-2">(Dica: Use uma imagem PNG com fundo transparente)</p>
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/gif"
            onChange={(e) => handleImageUpload(e, (base64) => updateEmployee({ ...targetEmployee, customImageUrl: base64 }))}
            className="w-full bg-black border border-gray-600 p-1 text-white text-xs file:mr-4 file:py-1 file:px-2 file:border-0 file:text-xs file:bg-[#00ff88] file:text-black hover:file:bg-white cursor-pointer"
          />
          {targetEmployee.customImageUrl && (
            <div className="mt-2 flex items-center gap-4 bg-gray-900 p-2 border border-gray-700">
              <div className="w-16 h-16 flex items-center justify-center bg-black/50 overflow-hidden">
                <img src={targetEmployee.customImageUrl} className="max-w-full max-h-full object-contain" alt="Preview" style={{ imageRendering: 'pixelated' }} />
              </div>
              <button 
                onClick={() => updateEmployee({ ...targetEmployee, customImageUrl: undefined })}
                className="text-red-500 hover:text-red-400 hover:underline text-xs font-bold"
              >
                Remover Imagem
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setHasDragged(false);
    if (isLayoutEditMode) setSelectedLayoutItems([]);
    setDragStart({
      x: e.pageX - scrollContainerRef.current.offsetLeft,
      y: e.pageY - scrollContainerRef.current.offsetTop,
      scrollLeft: scrollContainerRef.current.scrollLeft,
      scrollTop: scrollContainerRef.current.scrollTop
    });
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const y = e.pageY - scrollContainerRef.current.offsetTop;
    const walkX = (x - dragStart.x);
    const walkY = (y - dragStart.y);
    
    if (Math.abs(walkX) > 2 || Math.abs(walkY) > 2) {
      setHasDragged(true);
    }
    
    scrollContainerRef.current.scrollLeft = dragStart.scrollLeft - walkX;
    scrollContainerRef.current.scrollTop = dragStart.scrollTop - walkY;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollContainerRef.current || !e.shiftKey) return;

    e.preventDefault();
    scrollContainerRef.current.scrollLeft += e.deltaY;
  };

  const panViewport = (dx: number, dy: number) => {
    if (!scrollContainerRef.current) return;

    scrollContainerRef.current.scrollLeft += dx;
    scrollContainerRef.current.scrollTop += dy;
  };

  const updateZoom = (delta: number) => {
    setZoom(prev => Math.max(0.7, Math.min(1.4, Number((prev + delta).toFixed(2)))));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: emps, error: empErr } = await supabase.from('employees').select('*');
        if (empErr) {
          console.error("ERRO EMPLOYEES:", empErr);
          // If 400, it's likely a schema mismatch. Let's try to be helpful.
          if (empErr.code === 'PGRST204' || (empErr as any).status === 400) {
            console.warn("Possível erro de esquema ou tabela não encontrada.");
          }
        }
        setEmployees((emps ?? []).map(normalizeEmployee));
        
        const { data: desks, error: deskErr } = await supabase.from('desk_slots').select('*');
        if (deskErr) console.error("ERRO DESKS:", deskErr);
        setDeskSlots(desks && desks.length > 0 ? desks : INITIAL_DESK_SLOTS);
      } catch (err) {
        console.error("Error loading data from Supabase:", err);
        setDeskSlots(INITIAL_DESK_SLOTS);
      }
    };
    loadData();

    const empSub = supabase.channel('employees_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setEmployees(prev => {
            const exists = prev.find(e => e.id === payload.new.id);
            const nextEmployee = normalizeEmployee(payload.new as Employee);
            if (exists) return prev.map(e => e.id === payload.new.id ? nextEmployee : e);
            return [...prev, nextEmployee];
          });
        } else if (payload.eventType === 'DELETE') {
          setEmployees(prev => prev.filter(e => e.id !== payload.old.id));
        }
      }).subscribe();

    const deskSub = supabase.channel('desks_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'desk_slots' }, payload => {
        if (payload.eventType === 'INSERT') {
          setDeskSlots(prev => [...prev, payload.new as DeskSlot].sort((a, b) => a.seatNumber - b.seatNumber));
        } else if (payload.eventType === 'UPDATE') {
          setDeskSlots(prev => prev.map(d => d.seatNumber === payload.new.seatNumber ? payload.new as DeskSlot : d));
        } else if (payload.eventType === 'DELETE') {
          setDeskSlots(prev => prev.filter(d => d.seatNumber !== payload.old.seatNumber));
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(empSub);
      supabase.removeChannel(deskSub);
    };
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isLayoutEditMode && dragTarget !== null) {
        if (!dragStartedRef.current) {
          saveHistoryState();
          dragStartedRef.current = true;
        }

        const dx = (e.clientX - dragStartInfo.mouseX) / zoom;
        const dy = (e.clientY - dragStartInfo.mouseY) / zoom;
        
        const snap = 5;
        const guides: {type: 'h'|'v', pos: number}[] = [];

        setDeskSlots(prev => {
          let updated = [...prev];
          selectedLayoutItems.forEach(item => {
            const startPos = dragStartPositions.get(`${item.type}-${item.id}`);
            if (startPos) {
              const newX = startPos.initialX + dx;
              const newY = startPos.initialY + dy;

              if (item.type === 'desk') {
                let finalX = newX;
                let finalY = newY;
                // Snapping for desks
                updated.forEach(other => {
                  if (other.seatNumber === item.id) return;
                  if (Math.abs(newX - other.left_pos) < snap) {
                    finalX = other.left_pos;
                    guides.push({type: 'v', pos: other.left_pos});
                  }
                  if (Math.abs(newY - other.top_pos) < snap) {
                    finalY = other.top_pos;
                    guides.push({type: 'h', pos: other.top_pos});
                  }
                });
                updated = updated.map(d => d.seatNumber === item.id ? { ...d, left_pos: finalX, top_pos: finalY } : d);
              } else if (item.type !== 'character') {
                // Peripherals: monitor, mouse, keyboard
                const propName = `${item.type}Offset` as keyof DeskSlot;
                updated = updated.map(d => {
                  // Find the desk that contains this peripheral
                  const occupant = stateRef.current.employees.find(e => e.id === item.id);
                  if (d.seatNumber === (occupant ? getSeatNumber(occupant) : 0)) {
                    const currentOffset = d[propName] as PositionOffset | undefined;
                    return { ...d, [propName]: { ...(currentOffset || {}), x: newX, y: newY } };
                  }
                  return d;
                });
              }
            }
          });
          return updated;
        });

        setAlignmentGuides(guides);

        setEmployees(prev => {
          let updated = [...prev];
          selectedLayoutItems.filter(i => i.type === 'character').forEach(item => {
             const startPos = dragStartPositions.get(`character-${item.id}`);
             if (startPos) {
               const newX = startPos.initialX + dx;
               const newY = startPos.initialY + dy;
               updated = updated.map(emp => emp.id === item.id ? { ...emp, characterOffset: { ...(emp.characterOffset || {}), x: newX, y: newY } } : emp);
             }
          });
          return updated;
        });
      }
    };

    const handleGlobalMouseUp = async () => {
      setAlignmentGuides([]);
      if (dragTarget !== null) {
        // Sync final position to Supabase for all selected items
        const desksToUpsert: DeskSlot[] = [];
        const empsToUpsert: Employee[] = [];

        for (const item of selectedLayoutItems) {
          if (item.type === 'desk') {
            const desk = stateRef.current.deskSlots.find(d => d.seatNumber === item.id);
            if (desk && !desksToUpsert.some(d => d.seatNumber === desk.seatNumber)) desksToUpsert.push(desk);
          } else if (item.type === 'character') {
            const emp = stateRef.current.employees.find(e => e.id === item.id);
            if (emp && !empsToUpsert.some(e => e.id === emp.id)) empsToUpsert.push(emp);
          } else {
            // Peripheral was moved
            const occupant = stateRef.current.employees.find(e => e.id === item.id);
            const desk = stateRef.current.deskSlots.find(d => d.seatNumber === (occupant ? getSeatNumber(occupant) : 0));
            if (desk && !desksToUpsert.some(d => d.seatNumber === desk.seatNumber)) desksToUpsert.push(desk);
          }
        }

        if (desksToUpsert.length > 0) {
          const { error } = await supabase.from('desk_slots').upsert(desksToUpsert);
          if (error) alert(`Erro ao salvar layout das mesas: ${error.message}`);
        }
        if (empsToUpsert.length > 0) {
          const toSave = empsToUpsert.map(prepareEmployeeForSupabase);
          const { error } = await supabase.from('employees').upsert(toSave);
          if (error) alert(`Erro ao salvar posição dos itens: ${error.message}`);
        }

        setDragTarget(null);
        dragStartedRef.current = false;
      }
    };

    if (isLayoutEditMode) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLayoutEditMode && e.ctrlKey && e.key === 'z') {
        setLayoutHistory(prev => {
          if (prev.length === 0) return prev;
          const newHistory = [...prev];
          const prevState = newHistory.pop()!;
          setDeskSlots(prevState.deskSlots);
          setEmployees(currentEmployees => currentEmployees.map(emp => ({
             ...emp,
             ...prevState.employeeOffsets[emp.id]
          })));
          return newHistory;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLayoutEditMode, dragTarget, dragStartInfo, zoom, selectedLayoutItems, dragStartPositions]);

  useEffect(() => {
    // Bypass auth
  }, []);

  useEffect(() => {
    // Bypass firestore
  }, [currentUser]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollLeft = 120;
      container.scrollTop = 0;
    });
  }, []);

  const normalizeEmployee = (emp: Employee): Employee => {
    const approvedHomeOfficeDays = emp.homeOfficeDates?.length || 0;
    return {
      ...emp,
      homeOfficeUsedThisMonth: approvedHomeOfficeDays,
      characterOffset: emp.characterOffset || { x: 0, y: 0, rotation: 0 },
      deskPosition: emp.deskPosition || { row: 0, col: 0 }
    };
  };

  const prepareEmployeeForSupabase = (emp: Employee) => {
    const normalized = normalizeEmployee(emp);
    return {
      ...normalized,
    };
  };

  const updateEmployee = async (updated: Employee) => {
    const normalized = normalizeEmployee(updated);
    const toSave = prepareEmployeeForSupabase(normalized);
    setEmployees(prev => prev.map(employee => employee.id === normalized.id ? normalized : employee));
    setSelectedEmployee(prev => prev?.id === normalized.id ? normalized : prev);
    const { error } = await supabase.from('employees').upsert(toSave);
    if (error) {
      console.error("Error updating employee", error);
      alert(`Erro ao salvar no banco: ${error.message}`);
    }
  };

  const updateEmployees = async (updates: Employee[]) => {
    const normalizedUpdates = updates.map(normalizeEmployee);
    setEmployees(prev => prev.map(emp => {
      const update = normalizedUpdates.find(u => u.id === emp.id);
      return update ? update : emp;
    }));
    const toSave = normalizedUpdates.map(prepareEmployeeForSupabase);
    const { error } = await supabase.from('employees').upsert(toSave);
    if (error) {
      console.error("Error updating employees", error);
      alert(`Erro ao salvar no banco: ${error.message}`);
    }
  };

  const getEmployeeById = (employeeId: number) => {
    return employees.find((employee) => employee.id === employeeId) || null;
  };

  const getApprovedHomeOfficeCount = (date: string, excludedEmployeeId?: number) => {
    return employees.filter(
      (employee) => employee.id !== excludedEmployeeId && employee.homeOfficeDates?.includes(date),
    ).length;
  };

  const approvePendingHomeOfficeDate = async (employeeId: number, date: string) => {
    const employee = getEmployeeById(employeeId);
    if (!employee) return;

    const approvedByOthers = getApprovedHomeOfficeCount(date, employee.id);
    if (approvedByOthers >= 2) {
      alert(`A data ${date} ja possui ${approvedByOthers} pessoas aprovadas.`);
      return;
    }

    const updatedEmployee = {
      ...employee,
      pendingHomeOfficeDates: (employee.pendingHomeOfficeDates || []).filter((item) => item !== date),
      homeOfficeDates: sortPtBrDates(Array.from(new Set([...(employee.homeOfficeDates || []), date]))),
    };

    await updateEmployee(updatedEmployee);
  };

  const rejectPendingHomeOfficeDate = async (employeeId: number, date: string) => {
    const employee = getEmployeeById(employeeId);
    if (!employee) return;

    const updatedEmployee = {
      ...employee,
      pendingHomeOfficeDates: (employee.pendingHomeOfficeDates || []).filter((item) => item !== date),
    };

    await updateEmployee(updatedEmployee);
  };

  const updateDeskSlot = async (updated: DeskSlot) => {
    setDeskSlots(prev => prev.map(d => d.seatNumber === updated.seatNumber ? updated : d));
    setSelectedDeskSlotToEdit(prev => prev?.seatNumber === updated.seatNumber ? updated : prev);
    const { error } = await supabase.from('desk_slots').upsert(updated);
    if (error) {
      console.error("Error updating desk slot", error);
      alert(`Erro ao salvar no banco: ${error.message}`);
    }
  };

  const deleteEmployee = async (id: number) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;

    setEmployees(prev => prev.filter(e => e.id !== id));
    if (selectedEmployee?.id === id) setSelectedEmployee(null);

    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      console.error("Error deleting employee", error);
      alert(`Erro ao excluir membro: ${error.message}`);
    }
  };

  const getHomeOfficeAllowance = (level: number) => {
    switch (level) {
      case 0: return 0;
      case 1: return 1;
      case 2: return 2; // 1 a cada 15 dias ~= 2 por mês
      case 3: return 4; // 1 por semana ~= 4 por mês
      default: return 0;
    }
  };
  const handleStatusChange = (emp: Employee, newStatus: Status) => {
    if (newStatus === 'remote' || newStatus === 'absent' || newStatus === 'vacation') {
      // Check if team has at least 1 other person on-site
      const teamOnSite = employees.filter(e => e.team === emp.team && e.status === 'on-site' && e.id !== emp.id);
      if (teamOnSite.length === 0 && (newStatus === 'remote' || newStatus === 'absent' || newStatus === 'vacation')) {
        alert(`A equipe ${emp.team} não pode ficar sem nenhum membro presencial!`);
        return;
      }

      if (newStatus === 'remote') {
        const allowance = getHomeOfficeAllowance(emp.level);
        const used = (emp.homeOfficeDates?.length || 0); // Use specific dates count
        if (used >= allowance && !emp.homeOfficeDates?.includes(new Date().toLocaleDateString('pt-BR'))) {
          alert(`${emp.name} já atingiu o limite de Home Office deste mês (Nível ${emp.level}: ${allowance} dias).`);
          return;
        }
      }
    }
    
    updateEmployee({ ...emp, status: newStatus });
  };

  const handleAddError = (emp: Employee, type: ErrorType) => {
    const newError = { id: Date.now(), date: new Date().toLocaleDateString(), type };
    updateEmployee({ ...emp, errors: [...(emp.errors || []), newError] });
    // addEvent(`⚠️ Ocorrência registrada para ${emp.name}: ${type}`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Find next available seat dynamically
    const selectedSeatStr = formData.get('seatNumber') as string;
    const nextSeatNumber = selectedSeatStr ? parseInt(selectedSeatStr, 10) : undefined;

    if (!nextSeatNumber || nextSeatNumber === 22) {
      alert(nextSeatNumber === 22 ? 'A mesa 22 é exclusiva do chefe.' : 'Selecione uma mesa válida.');
      return;
    }

    const newEmp: Employee = {
      id: Date.now(),
      name: formData.get('name') as string,
      team: formData.get('team') as Team,
      education: formData.get('education') as EducationLevel,
      status: 'on-site',
      level: 1,
      errors: [],
      homeOfficeUsedThisMonth: 0,
      mood: 'happy',
      gender: newMemberGender,
      avatar: newMemberAvatar,
      customImageUrl: newMemberCustomImage,
      deskPosition: getDeskPositionFromSeatNumber(nextSeatNumber),
      characterOffset: { x: 0, y: 0, rotation: 0 }
    };
    setEmployees(prev => [...prev, newEmp]);
    setIsAddMemberOpen(false);
    
    // Reset form states
    setNewMemberCustomImage(undefined);
    
    // Sync with Supabase
    const { error } = await supabase.from('employees').insert(prepareEmployeeForSupabase(newEmp));
    if (error) console.error("Error adding employee", error);
    // addEvent(`👋 ${newEmp.name} entrou para a equipe ${newEmp.team}!`);
  };



  const handleLevelChange = (emp: Employee, delta: number) => {
    const newLevel = Math.max(0, Math.min(3, emp.level + delta)) as 0 | 1 | 2 | 3;
    updateEmployee({ ...emp, level: newLevel });
    // addEvent(`⭐ Nível de ${emp.name} alterado para ${newLevel}`);
  };

  const changeEmployeeDesk = async (emp: Employee, newSeatNumber: number) => {
    // Mesa 22 é exclusiva do chefe
    if (newSeatNumber === 22) {
      alert("A mesa 22 é exclusiva do chefe e não pode ser ocupada por outros membros!");
      return;
    }

    const oldSeatNumber = getSeatNumber(emp);
    const occupant = employees.find(e => e.id !== emp.id && getSeatNumber(e) === newSeatNumber);
    
    // Swap Peripheral Styles
    const oldDesk = deskSlots.find(d => d.seatNumber === oldSeatNumber);
    const newDesk = deskSlots.find(d => d.seatNumber === newSeatNumber);
    if (oldDesk && newDesk) {
      const peripheralProps = ['deskStyle', 'deskColor', 'monitorStyle', 'monitorColor', 'mouseStyle', 'mouseColor', 'keyboardStyle', 'keyboardColor'] as const;
      const updatedOldDesk = { ...oldDesk };
      const updatedNewDesk = { ...newDesk };
      
      peripheralProps.forEach(prop => {
        updatedOldDesk[prop] = newDesk[prop] as any;
        updatedNewDesk[prop] = oldDesk[prop] as any;
      });
      
      setDeskSlots(prev => prev.map(d => 
        d.seatNumber === updatedOldDesk.seatNumber ? updatedOldDesk : 
        d.seatNumber === updatedNewDesk.seatNumber ? updatedNewDesk : d
      ));
      
      const { error } = await supabase.from('desk_slots').upsert([updatedOldDesk, updatedNewDesk]);
      if (error) console.error("Error updating desk slots", error);
    }

    if (occupant) {
      // Automatic Swap
      updateEmployees([
        { ...emp, deskPosition: getDeskPositionFromSeatNumber(newSeatNumber) },
        { ...occupant, deskPosition: getDeskPositionFromSeatNumber(oldSeatNumber) }
      ]);
      return;
    }
    updateEmployee({ ...emp, deskPosition: getDeskPositionFromSeatNumber(newSeatNumber) });
  };

  const endMonth = async () => {
    setConfirmDialog({
      title: "ENCERRAR O MÊS",
      message: "Encerrar o mês? Isso irá zerar o contador de Home Office e o histórico de erros de todos os estagiários após a avaliação.",
      onConfirm: async () => {
        const updatedEmployees = employees.map(emp => ({ ...emp, homeOfficeUsedThisMonth: 0, errors: [] }));
        setEmployees(updatedEmployees);
        
        // Update all employees in Supabase
        const toSaveList = updatedEmployees.map(prepareEmployeeForSupabase);
        const { error } = await supabase.from('employees').upsert(toSaveList);
        if (error) console.error("Error resetting month in Supabase", error);

        // addEvent("📅 Novo mês iniciado! Contadores zerados.");
        setIsEvaluationOpen(false);
        setConfirmDialog(null);
      }
    });
  };

  const employeesBySeat = new Map<number, Employee>(
    employees.map(employee => [getSeatNumber(employee), employee])
  );

  const orderedEmployees = [...employees]
    .sort((a, b) => getSeatNumber(a) - getSeatNumber(b));

  const selectedEmployeeSeatIndex = selectedEmployee
    ? orderedEmployees.findIndex(employee => employee.id === selectedEmployee.id)
    : -1;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const rawCpf = authCpf.replace(/\D/g, '');
    if (rawCpf.length !== 11) {
      setAuthError('Por favor, informe um CPF válido com 11 dígitos.');
      setAuthLoading(false);
      return;
    }
    const fullEmail = `${rawCpf}@tjpr.jus.br`;

    if (isSignUp) {
      if (authPassword !== authPasswordConfirm) {
        setAuthError('As senhas não coincidem. Verifique e tente novamente.');
        setAuthLoading(false);
        return;
      }
      const { error, data } = await supabase.auth.signUp({ email: fullEmail, password: authPassword });
      if (error) setAuthError(error.message);
      else if (data.session === null && data.user) {
        setAwaitingEmailConfirmation(true);
      } else {
        alert('Conta criada! Faça login para continuar.');
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: fullEmail, password: authPassword });
      if (error) {
        if (error.message.includes('Email not confirmed') || error.message.includes('confirm')) {
          setAwaitingEmailConfirmation(true);
        } else {
          setAuthError(error.message);
        }
      }
    }
    setAuthLoading(false);
  };

  if (!currentUser) {
    if (awaitingEmailConfirmation) {
      return (
        <div className="min-h-screen bg-checkerboard font-mono text-white flex flex-col items-center justify-center p-4">
          <div className="bg-[#1a1a2e] p-8 rounded-xl border-4 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)] max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-amber-400 mb-4">VERIFIQUE SEU EMAIL</h2>
            <div className="text-4xl mb-4">📧</div>
            <p className="text-gray-300 mb-6 text-sm">
              Para sua segurança, só é possível acessar o escritório após confirmar o endereço de email fornecido. Enviamos um link de confirmação para <b className="text-white">{authCpf.replace(/\D/g, '')}@tjpr.jus.br</b>.
            </p>
            <p className="text-gray-400 text-xs mb-6">
              Abra a caixa de entrada (ou pasta de spam), clique no link para ativar a conta e em seguida volte a esta página ou clique no botão abaixo para tentar o login novamente.
            </p>
            <button 
              onClick={() => setAwaitingEmailConfirmation(false)}
              className="w-full bg-amber-400 text-black font-bold py-3 hover:bg-amber-300 transition-colors uppercase tracking-widest"
            >
              Voltar para o Login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-checkerboard font-mono text-white flex flex-col items-center justify-center p-4">
        <div className="bg-[#1a1a2e] p-8 rounded-xl border-4 border-[#00ff88] shadow-[0_0_30px_rgba(0,255,136,0.3)] max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-[#00ff88] mb-2">P-SEP-AR Virtual</h1>
            <p className="text-gray-400 text-xs">Escritório Virtual — TJPR</p>
            <div className="w-16 h-16 mx-auto bg-[#1a1a2e] border-2 border-[#00ff88] rounded-full flex items-center justify-center mt-4 animate-pulse">
              <span className="text-2xl">🏢</span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {authError && <div className="bg-red-900/50 text-red-400 p-2 text-xs border border-red-500 rounded">{authError}</div>}
            
            <div>
              <label className="text-xs text-[#00ff88] tracking-widest uppercase mb-1 block">CPF</label>
              <div className="flex bg-black border border-gray-600 focus-within:border-[#00ff88] transition-colors relative">
                <input 
                  type="text" 
                  required 
                  value={authCpf}
                  onChange={e => {
                    let v = e.target.value.replace(/\D/g, '');
                    if (v.length > 11) v = v.slice(0, 11);
                    let formatted = v;
                    if (v.length > 9) formatted = `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6,9)}-${v.slice(9)}`;
                    else if (v.length > 6) formatted = `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6)}`;
                    else if (v.length > 3) formatted = `${v.slice(0,3)}.${v.slice(3)}`;
                    setAuthCpf(formatted);
                  }}
                  className="w-full bg-transparent p-3 text-white outline-none"
                  placeholder="000.000.000-00"
                />
                <span className="p-3 text-gray-400 bg-gray-900 border-l border-gray-600 pointer-events-none select-none flex items-center h-full">
                  @tjpr.jus.br
                </span>
              </div>
            </div>
            
            <div>
              <label className="text-xs text-[#00ff88] tracking-widest uppercase mb-1 block">Senha</label>
              <input 
                type="password" 
                required 
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                minLength={6}
                className="w-full bg-black border border-gray-600 p-3 text-white focus:border-[#00ff88] outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            {isSignUp && (
              <div>
                <label className="text-xs text-[#00ff88] tracking-widest uppercase mb-1 block">Confirmar Senha</label>
                <input 
                  type="password" 
                  required 
                  value={authPasswordConfirm}
                  onChange={e => setAuthPasswordConfirm(e.target.value)}
                  minLength={6}
                  className="w-full bg-black border border-gray-600 p-3 text-white focus:border-[#00ff88] outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full bg-[#00ff88] text-black font-bold py-3 mt-2 hover:bg-[#00cc6a] transition-colors uppercase disabled:opacity-50"
            >
              {authLoading ? 'Aguarde...' : isSignUp ? 'Criar Conta' : 'Entrar'}
            </button>
            
            <button 
              type="button" 
              onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); setAuthPasswordConfirm(''); }}
              className="text-xs text-gray-400 hover:text-white mt-1 text-center w-full underline-offset-2 hover:underline"
            >
              {isSignUp ? 'Já tem conta? Faça o Login' : 'Primeiro acesso? Crie sua senha do escritório'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-checkerboard font-mono text-white overflow-auto flex flex-col">
      <HUD 
        employees={employees} 
        totalXP={0} 
        onZoomIn={() => setZoom(prev => Math.min(prev + 0.1, 2))}
        onZoomOut={() => setZoom(prev => Math.max(prev - 0.1, 0.3))}
        zoomLevel={zoom}
      />

      <div 
        ref={scrollContainerRef}
        className={`flex-1 relative pt-24 pb-20 overflow-scroll ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        style={{ scrollbarGutter: 'stable both-edges' }}
      >
        <div className="min-w-max mx-auto p-8 relative px-16" style={{ minHeight: `${WORKSPACE_HEIGHT * zoom + 180}px` }}>
          <div onMouseDown={(e) => e.stopPropagation()} className="absolute top-6 left-1/2 z-20 -translate-x-1/2 rounded border border-gray-700 bg-black/55 px-5 py-3 text-center shadow-lg">
            <p className="text-xs font-bold tracking-[0.24em] text-[#00ff88]">LAYOUT DAS MESAS</p>
            <p className="mt-1 text-[10px] text-gray-400">
              {isLayoutEditMode 
                ? '💻 MODO DE EDIÇÃO: Arraste para mover, clique c/ direito p/ girar. Segure SHIFT p/ multi-seleção.'
                : 'Arraste a tela ou use Shift + roda do mouse.'}
            </p>
            {isLayoutEditMode && selectedLayoutItems.length > 0 && (
              <>
                <p className="text-[#00ff88] text-[10px] mt-2 font-bold bg-black/40 p-1 border border-[#00ff88]/30">
                  {selectedLayoutItems.length} item(s) selecionado(s)
                </p>
                <div className="mt-3 flex gap-2 justify-center">
                  <button 
                    onClick={duplicateSelectedItems}
                    className="bg-[#00ff88] text-black px-3 py-1 text-[10px] font-bold rounded hover:bg-[#00cc6a]"
                  >
                    DUPLICAR MESA(S)
                  </button>
                  <button 
                    onClick={() => setSelectedLayoutItems([])}
                    className="bg-transparent border border-gray-500 text-gray-300 px-3 py-1 text-[10px] rounded hover:border-gray-400"
                  >
                    LIMPAR
                  </button>
                </div>
              </>
            )}
          </div>



          <div className="relative z-10 mx-auto mt-20" style={{ width: `${WORKSPACE_WIDTH * zoom}px`, height: `${WORKSPACE_HEIGHT * zoom}px` }}>
            <div className={`absolute left-0 top-0 origin-top-left ${isLayoutEditMode ? 'pointer-events-auto' : ''}`} style={{ width: `${WORKSPACE_WIDTH}px`, height: `${WORKSPACE_HEIGHT}px`, transform: `scale(${zoom})` }}>
              {deskSlots.map(slot => {
                const employee = slot.isBoss ? undefined : employeesBySeat.get(slot.seatNumber);

                const handleContextMenu = (e: React.MouseEvent) => {
                  if (isLayoutEditMode) {
                    e.preventDefault();
                    e.stopPropagation();
                    const target = e.target as HTMLElement;
                    const dragTargetEl = target.closest('[data-drag-type]');
                    let clickedType: 'monitor'|'mouse'|'character'|'keyboard'|'desk';
                    let clickedId: number;
                    if (dragTargetEl) {
                       clickedType = dragTargetEl.getAttribute('data-drag-type') as any;
                       clickedId = Number(dragTargetEl.getAttribute('data-employee-id'));
                    } else {
                       clickedType = 'desk';
                       clickedId = slot.seatNumber;
                    }
                    if (selectedLayoutItems.some(i => i.type === clickedType && i.id === clickedId)) {
                      saveHistoryState();
                      setDeskSlots(prev => {
                        let updated = [...prev];
                        selectedLayoutItems.forEach(item => {
                           if (item.type === 'desk') {
                             updated = updated.map(desk => desk.seatNumber === item.id ? { ...desk, rotation: ((desk.rotation || 0) + 90) % 360 } : desk);
                           } else if (item.type !== 'character') {
                             const propName = `${item.type}Offset` as keyof DeskSlot;
                             updated = updated.map(d => {
                               const occupant = stateRef.current.employees.find(e => e.id === item.id);
                               if (d.seatNumber === (occupant ? getSeatNumber(occupant) : 0)) {
                                 const currentOffset = d[propName] as PositionOffset | undefined;
                                 return { ...d, [propName]: { ...(currentOffset || {x: 0, y: 0}), rotation: ((currentOffset?.rotation || 0) + 90) % 360 } };
                               }
                               return d;
                             });
                           }
                        });
                        return updated;
                      });
                      setEmployees(prev => {
                        let updated = [...prev];
                        selectedLayoutItems.filter(i => i.type === 'character').forEach(item => {
                           updated = updated.map(emp => {
                             if (emp.id === item.id) {
                               const currentOffset = emp.characterOffset as PositionOffset | undefined;
                               return { ...emp, characterOffset: { ...(currentOffset || {x: 0, y: 0}), rotation: ((currentOffset?.rotation || 0) + 90) % 360 } };
                             }
                             return emp;
                           });
                        });
                        return updated;
                      });
                    }
                  }
                };

                const handleMouseDown = (e: React.MouseEvent) => {
                  if (isLayoutEditMode) {
                    e.stopPropagation();
                    const target = e.target as HTMLElement;
                    const dragTargetEl = target.closest('[data-drag-type]');
                    let clickedItem: LayoutItemReference;
                    if (dragTargetEl) {
                      const type = dragTargetEl.getAttribute('data-drag-type') as 'monitor'|'mouse'|'character'|'keyboard';
                      const empId = Number(dragTargetEl.getAttribute('data-employee-id'));
                      clickedItem = { type, id: empId };
                    } else {
                      clickedItem = { type: 'desk', id: slot.seatNumber };
                    }
                    
                    let newSelection = [...selectedLayoutItems];
                    if (e.shiftKey) {
                      const existingIdx = newSelection.findIndex(i => i.type === clickedItem.type && i.id === clickedItem.id);
                      if (existingIdx >= 0) newSelection.splice(existingIdx, 1);
                      else newSelection.push(clickedItem);
                    } else {
                      const isAlreadySelected = newSelection.some(i => i.type === clickedItem.type && i.id === clickedItem.id);
                      if (!isAlreadySelected) newSelection = [clickedItem];
                    }
                    
                    const positions = new Map<string, {initialX: number, initialY: number}>();
                    newSelection.forEach(item => {
                      if (item.type === 'desk') {
                         const desk = deskSlots.find(d => d.seatNumber === item.id);
                         if (desk) positions.set(`desk-${item.id}`, { initialX: desk.left_pos, initialY: desk.top_pos });
                      } else if (item.type === 'character') {
                         const emp = employees.find(e => e.id === item.id);
                         if (emp) {
                           positions.set(`character-${item.id}`, { initialX: emp.characterOffset?.x || 0, initialY: emp.characterOffset?.y || 0 });
                         }
                      } else {
                         // Peripherals
                         const occupant = employees.find(e => e.id === item.id);
                         const desk = deskSlots.find(d => d.seatNumber === (occupant ? getSeatNumber(occupant) : 0));
                         if (desk) {
                           const propName = `${item.type}Offset` as keyof DeskSlot;
                           const offset = desk[propName] as PositionOffset | undefined;
                           positions.set(`${item.type}-${item.id}`, { initialX: offset?.x || 0, initialY: offset?.y || 0 });
                         }
                      }
                    });

                    setDragStartPositions(positions);
                    setDragStartInfo({ mouseX: e.clientX, mouseY: e.clientY });
                    setSelectedLayoutItems(newSelection);
                    setDragTarget(clickedItem);
                    dragStartedRef.current = false;
                  }
                };

                const handleClick = () => {
                  if (hasDragged) return;
                  if (isLayoutEditMode) {
                    setSelectedDeskSlotToEdit(slot);
                    return;
                  }
                  if (employee) {
                    if (employee.linkedUserId === currentUserId) {
                      setSelectedDeskSlotToEdit(slot);
                    } else {
                      setSelectedEmployee(employee);
                    }
                  } else {
                    setClickedEmptySeat(slot.seatNumber);
                  }
                };

                return (
                  <React.Fragment key={slot.seatNumber}>
                    {/* Surface Layer */}
                    <div
                      className={`absolute z-10 ${isLayoutEditMode ? 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-[#ff00ff]/50' : ''}`}
                      style={{ left: `${slot.left_pos}px`, top: `${slot.top_pos}px`, transform: `rotate(${slot.rotation || 0}deg)` }}
                      onContextMenu={handleContextMenu}
                      onMouseDown={handleMouseDown}
                    >
                      {isLayoutEditMode && (
                        <div className="absolute -top-6 left-0 bg-[#ff00ff] text-white text-[10px] font-bold px-2 py-1 rounded z-50 pointer-events-none">
                          #{slot.seatNumber}
                        </div>
                      )}
                      <div>
                        <Desk
                          deskSlot={slot}
                          employee={employee}
                          selectedItems={isLayoutEditMode ? selectedLayoutItems : []}
                          renderMode="surface"
                          onClick={handleClick}
                        />
                      </div>
                    </div>
                    
                    {/* Peripherals Layer */}
                    <div
                      className="absolute z-20 pointer-events-none"
                      style={{ left: `${slot.left_pos}px`, top: `${slot.top_pos}px`, transform: `rotate(${slot.rotation || 0}deg)` }}
                      onContextMenu={handleContextMenu}
                      onMouseDown={handleMouseDown}
                    >
                      <div>
                        <Desk
                          deskSlot={slot}
                          employee={employee}
                          selectedItems={isLayoutEditMode ? selectedLayoutItems : []}
                          renderMode="peripherals"
                          onClick={handleClick}
                        />
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* Alignment Guides Overlay */}
              {isLayoutEditMode && alignmentGuides.map((guide, i) => (
                <div 
                  key={i} 
                  className="absolute pointer-events-none z-[100] border-cyan-400/50"
                  style={{
                    left: guide.type === 'v' ? `${guide.pos}px` : 0,
                    top: guide.type === 'h' ? `${guide.pos}px` : 0,
                    width: guide.type === 'v' ? '1px' : '2000px',
                    height: guide.type === 'h' ? '1px' : '2000px',
                    borderLeftWidth: guide.type === 'v' ? '1px' : 0,
                    borderTopWidth: guide.type === 'h' ? '1px' : 0,
                    boxShadow: '0 0 4px rgba(34, 211, 238, 0.4)'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-[#1a1a2e] border-t-4 border-[#00ff88] p-2 flex justify-between items-center z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
        <div className="flex-1 overflow-hidden border-r-2 border-gray-700 mr-4">
          <div className="text-[#00ff88] text-[10px] md:text-xs">Modo {userProfile?.role === 'admin' ? 'Administrador' : 'Usuário'}</div>
        </div>
        <div className="flex gap-2">
          {userProfile?.role === 'admin' && (
            <>
              <button 
                onClick={() => setIsLayoutEditMode(!isLayoutEditMode)} 
                className={`border px-2 py-1 text-[8px] md:text-[10px] transition-colors ${
                  isLayoutEditMode 
                  ? 'bg-[#ff00ff] border-[#ff00ff] text-white hover:bg-[#cc00cc]' 
                  : 'bg-black border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-white'
                }`}
              >
                {isLayoutEditMode ? '💾 SALVAR MÓDULOS' : '🏗️ EDITAR LAYOUT'}
              </button>
              
              <button onClick={() => setIsAddMemberOpen(true)} className="bg-black border border-[#00ff88] text-[#00ff88] px-2 py-1 text-[8px] md:text-[10px] hover:bg-[#00ff88] hover:text-black transition-colors">
                + MEMBRO
              </button>
              
              <button onClick={() => setIsEvaluationOpen(true)} className="bg-black border border-[#ff6b35] text-[#ff6b35] px-2 py-1 text-[8px] md:text-[10px] hover:bg-[#ff6b35] hover:text-white transition-colors">
                ⚖️ AVALIAÇÃO MENSAL
              </button>
              
              <button onClick={() => setIsDashboardOpen(true)} className="bg-black border border-cyan-400 text-cyan-400 px-2 py-1 text-[8px] md:text-[10px] hover:bg-cyan-400 hover:text-black transition-colors font-bold">
                📋 LISTA (BETA)
              </button>
            </>
          )}

          <button onClick={() => setIsStatsOpen(true)} className="bg-black border border-[#6c63ff] text-[#6c63ff] px-2 py-1 text-[8px] md:text-[10px] hover:bg-[#6c63ff] hover:text-white transition-colors">
            📊 STATUS
          </button>
          
          {userProfile?.role === 'admin' && (
            <button onClick={() => setIsHomeOfficeApprovalOpen(true)} className="bg-black border border-amber-400 text-amber-300 px-2 py-1 text-[8px] md:text-[10px] hover:bg-amber-400 hover:text-black transition-colors font-bold">
              APROVAR HOME OFFICE
            </button>
          )}

          <button 
            onClick={() => supabase.auth.signOut()} 
            className="bg-red-900/40 border border-red-500 text-red-500 px-2 py-1 text-[8px] md:text-[10px] hover:bg-red-500 hover:text-white transition-colors font-bold ml-2"
          >
            🚪 SAIR
          </button>
        </div>
      </div>

      {/* Employee Modal */}
      <Modal isOpen={!!selectedEmployee} onClose={() => setSelectedEmployee(null)} title="PERFIL DO ESTAGIÁRIO">
        {selectedEmployee && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-black border-2 border-gray-600 flex items-center justify-center">
                <Character employee={selectedEmployee} size="lg" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  {userProfile?.role === 'admin' ? (
                    <input 
                      key={`name-${selectedEmployee.id}`}
                      type="text" 
                      className="text-xl text-white bg-transparent border-b-2 border-transparent hover:border-dashed hover:border-gray-600 focus:border-[#00ff88] focus:border-solid outline-none px-0 py-0 w-full font-bold transition-colors"
                      defaultValue={selectedEmployee.name}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== selectedEmployee.name) {
                          updateEmployee({ ...selectedEmployee, name: e.target.value.trim() });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      title="Clique para editar o nome"
                    />
                  ) : (
                    <h3 className="text-xl text-white mb-1">{selectedEmployee.name}</h3>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  {userProfile?.role === 'admin' ? (
                    <select 
                      className="bg-transparent border-b border-dashed border-gray-600 focus:border-[#00ff88] text-gray-400 text-xs outline-none cursor-pointer"
                      value={selectedEmployee.team}
                      onChange={(e) => updateEmployee({ ...selectedEmployee, team: e.target.value as Team })}
                    >
                      {TEAMS.map(t => <option key={t} value={t} className="bg-black text-white">{t}</option>)}
                    </select>
                  ) : (
                    <p className="text-gray-400 text-xs">{selectedEmployee.team}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {userProfile?.role === 'admin' ? (
                    <select 
                      className="bg-transparent border-b border-dashed border-gray-600 focus:border-[#00ff88] text-gray-500 text-[10px] outline-none cursor-pointer"
                      value={selectedEmployee.education}
                      onChange={(e) => updateEmployee({ ...selectedEmployee, education: e.target.value as EducationLevel })}
                    >
                      {EDUCATION_LEVELS.map(e => <option key={e} value={e} className="bg-black text-white">{e}</option>)}
                    </select>
                  ) : (
                    <p className="text-gray-500 text-[10px]">{selectedEmployee.education}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className="text-[#00ff88] font-bold">NÍVEL {selectedEmployee.level}</span>
                  {userProfile?.role === 'admin' && (
                    <button 
                      onClick={() => updateEmployee({ ...selectedEmployee, is_admin: !selectedEmployee.is_admin })}
                      className={`ml-2 px-2 py-0.5 rounded text-[10px] border ${selectedEmployee.is_admin ? 'bg-[#ff00ff] border-[#ff00ff] text-white hover:bg-transparent hover:text-[#ff00ff]' : 'border-gray-600 text-gray-400 hover:border-[#ff00ff] hover:text-[#ff00ff]'}`}
                      title={selectedEmployee.is_admin ? 'Remover privilégio de Admin' : 'Dar privilégio de Admin'}
                    >
                      {selectedEmployee.is_admin ? '★ ADMINISTRADOR' : 'TORNAR ADMIN'}
                    </button>
                  )}
                </div>
                
                {userProfile?.role === 'admin' && (
                  <div className="flex items-center gap-2 mt-2">
                    <label className="text-gray-400 text-xs">Mudar mesa:</label>
                    <select 
                      className="bg-black border border-gray-600 p-1 text-white text-xs outline-none focus:border-[#00ff88]"
                      value={getSeatNumber(selectedEmployee)}
                      onChange={(e) => {
                        const newSeat = parseInt(e.target.value, 10);
                        const occupant = employeesBySeat.get(newSeat);
                        
                        setConfirmDialog({
                          title: occupant && occupant.id !== selectedEmployee.id ? "CONFIRMAR TROCA" : "CONFIRMAR MUDANÇA",
                          message: occupant && occupant.id !== selectedEmployee.id 
                            ? `Deseja trocar ${selectedEmployee.name} de lugar com ${occupant.name} na Mesa ${newSeat}?`
                            : `Deseja mover ${selectedEmployee.name} para a Mesa ${newSeat}?`,
                          onConfirm: () => {
                            changeEmployeeDesk(selectedEmployee, newSeat);
                            setConfirmDialog(null);
                          }
                        });
                      }}
                    >
                      {deskSlots.filter(s => !s.isBoss).map(slot => {
                        const occupant = employeesBySeat.get(slot.seatNumber);
                        const isOccupiedByOther = occupant && occupant.id !== selectedEmployee.id;
                        return (
                          <option key={slot.seatNumber} value={slot.seatNumber}>
                            Mesa {slot.seatNumber} {isOccupiedByOther ? `(Trocar com ${occupant.name})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  Home Office: {selectedEmployee.homeOfficeDates?.length || 0} / {getHomeOfficeAllowance(selectedEmployee.level)} dias usados
                </p>
              </div>
            </div>

            {userProfile?.role === 'admin' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-black p-2 border border-gray-700">
                  <div className="flex flex-col gap-2">
                    {(['on-site', 'remote', 'vacation', 'absent'] as Status[]).map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedEmployee, status)}
                        className={`p-2 border text-left flex items-center gap-2 transition-all ${
                          selectedEmployee.status === status 
                          ? 'border-cyan-400 bg-cyan-400/20 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                          : 'border-white/10 text-slate-500 hover:border-white/30 hover:bg-white/5'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          status === 'on-site' ? 'bg-emerald-400' : 
                          status === 'remote' ? 'bg-sky-400' : 
                          status === 'vacation' ? 'bg-amber-400' : 'bg-slate-400'
                        }`} />
                        {status.toUpperCase().replace('-', ' ')}
                        {status === 'vacation' && ' 🏖️'}
                      </button>
                    ))}
                  </div>

                  {renderHomeOfficeCalendar(selectedEmployee)}

                  {selectedEmployee.status === 'vacation' && (
                    <div className="mt-4 p-3 bg-amber-950/20 border border-amber-400/20 rounded flex flex-col gap-3">
                      <p className="text-amber-300 font-bold flex items-center gap-2">
                         <span>🏖️</span> PERÍODO DE FÉRIAS
                      </p>
                      <div>
                        <label className="text-[10px] text-amber-300/60 uppercase block mb-1">Início</label>
                        <input 
                          type="date" 
                          className="w-full bg-black/40 border border-amber-400/30 p-2 text-white outline-none focus:border-amber-400"
                          value={selectedEmployee.vacationStart || ''}
                          onChange={(e) => updateEmployee({ ...selectedEmployee, vacationStart: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-amber-300/60 uppercase block mb-1">Fim</label>
                        <input 
                          type="date" 
                          className="w-full bg-black/40 border border-amber-400/30 p-2 text-white outline-none focus:border-amber-400"
                          value={selectedEmployee.vacationEnd || ''}
                          onChange={(e) => updateEmployee({ ...selectedEmployee, vacationEnd: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-black p-2 border border-gray-700 flex flex-col">
                  <p className="text-gray-500 mb-2">REGISTRAR OCORRÊNCIA</p>
                  <select 
                    className="w-full bg-black border border-gray-600 p-1 text-white mb-2 outline-none"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddError(selectedEmployee, e.target.value as ErrorType);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Selecione um erro...</option>
                    {ERROR_TYPES.map(err => <option key={err} value={err}>{err}</option>)}
                  </select>
                  <div className="flex-1 overflow-auto max-h-24 mt-2 border-t border-gray-800 pt-2">
                    <p className="text-gray-500 mb-1">Erros este mês: {selectedEmployee.errors?.length || 0}</p>
                    {selectedEmployee.errors?.map(err => (
                      <div key={err.id} className="flex items-center justify-between text-[10px] text-red-400 mb-1 gap-2">
                        <span>- {err.type} ({err.date})</span>
                        {userProfile?.role === 'admin' && (
                          <button
                            onClick={() => updateEmployee({ ...selectedEmployee, errors: selectedEmployee.errors?.filter(e => e.id !== err.id) })}
                            className="text-red-600 hover:text-red-400 shrink-0 font-bold"
                            title="Remover ocorrencia"
                          >
                            x
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(userProfile?.role === 'admin' || selectedEmployee.linkedUserId === currentUserId) && (
              <>
                <button
                  className="w-full bg-[#00ff88]/20 text-[#00ff88] hover:bg-[#00ff88]/40 py-2 border border-[#00ff88] mb-4 font-bold text-xs uppercase tracking-widest transition-colors"
                  onClick={() => {
                    const desk = deskSlots.find(d => d.seatNumber === getSeatNumber(selectedEmployee));
                    if (desk) {
                      setSelectedDeskSlotToEdit(desk);
                      setSelectedEmployee(null);
                    }
                  }}
                >
                  🛠️ PERSONALIZAR MÓDULOS DA MESA
                </button>




                <div className="mt-4 pt-4 border-t border-gray-800">
                  <button 
                    onClick={() => {
                      setConfirmDialog({
                        title: "CONFIRMAR EXCLUSÃO",
                        message: `Tem certeza que deseja apagar o membro ${selectedEmployee.name} da equipe permanente?`,
                        onConfirm: () => {
                          deleteEmployee(selectedEmployee.id);
                          setConfirmDialog(null);
                        }
                      });
                    }}
                    className="w-full bg-red-900/40 text-red-500 hover:bg-red-900/60 hover:text-red-400 py-3 rounded text-xs font-bold tracking-wider transition-colors border border-red-900/50"
                  >
                    EXCLUIR MEMBRO
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title="NOVO ESTAGIÁRIO">
        <form onSubmit={handleAddMember} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-gray-400 mb-1">NOME</label>
            <input name="name" required className="w-full bg-black border border-gray-600 p-2 text-white focus:border-[#00ff88] outline-none" />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">EQUIPE</label>
            <select name="team" className="w-full bg-black border border-gray-600 p-2 text-white focus:border-[#00ff88] outline-none">
              {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-1">ESCOLARIDADE</label>
            <select name="education" className="w-full bg-black border border-gray-600 p-2 text-white focus:border-[#00ff88] outline-none">
              {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-1">MESA INICIAL</label>
            <select name="seatNumber" required defaultValue={clickedEmptySeat?.toString() || ""} className="w-full bg-black border border-gray-600 p-2 text-white focus:border-[#00ff88] outline-none">
              <option value="">Selecione uma mesa disponível...</option>
              {deskSlots.map(slot => {
                const isOccupied = employees.some(e => getSeatNumber(e) === slot.seatNumber);
                if (isOccupied || slot.seatNumber === 22 || slot.isBoss) return null;
                return (
                  <option key={slot.seatNumber} value={slot.seatNumber}>
                    Mesa {slot.seatNumber}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-400 mb-1">GÊNERO E SKIN</label>
            <div className="bg-black p-3 border border-gray-600">
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="newGender" 
                    value="male" 
                    checked={newMemberGender === 'male'} 
                    onChange={() => { setNewMemberGender('male'); setNewMemberAvatar('m1'); }}
                    className="accent-[#00ff88]"
                  />
                  Menino
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="newGender" 
                    value="female" 
                    checked={newMemberGender === 'female'} 
                    onChange={() => { setNewMemberGender('female'); setNewMemberAvatar('f1'); }}
                    className="accent-[#00ff88]"
                  />
                  Menina
                </label>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(newMemberGender === 'female' ? ['f1', 'f2', 'f3', 'f4', 'boss'] : ['m1', 'm2', 'm3', 'm4', 'boss']).map(avatarId => (
                  <button
                    key={avatarId}
                    type="button"
                    onClick={() => { setNewMemberAvatar(avatarId); setNewMemberCustomImage(undefined); }}
                    className={`p-2 border ${newMemberAvatar === avatarId && !newMemberCustomImage ? 'border-[#00ff88] bg-[#00ff88]/20' : 'border-gray-600 hover:border-gray-400'}`}
                  >
                    <div className="pointer-events-none">
                       <Character employee={{ id: 0, name: '', team: 'Controle', education: 'Graduação', status: 'on-site', level: 1, errors: [], homeOfficeUsedThisMonth: 0, mood: 'happy', gender: newMemberGender, avatar: avatarId, deskPosition: {row:0, col:0} }} size="md" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-700">
                <label className="block text-gray-500 mb-1">OU FAÇA UPLOAD DE UMA IMAGEM</label>
                <p className="text-[10px] text-gray-400 mb-2">(Dica: Use uma imagem PNG com fundo transparente)</p>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/gif"
                  onChange={(e) => handleImageUpload(e, setNewMemberCustomImage)}
                  className="w-full bg-black border border-gray-600 p-1 text-white text-xs file:mr-4 file:py-1 file:px-2 file:border-0 file:text-xs file:bg-[#00ff88] file:text-black hover:file:bg-white cursor-pointer"
                />
                {newMemberCustomImage && (
                  <div className="mt-2 flex items-center gap-4 bg-gray-900 p-2 border border-gray-700">
                    <div className="w-16 h-16 flex items-center justify-center bg-black/50 overflow-hidden">
                      <img src={newMemberCustomImage} className="max-w-full max-h-full object-contain" alt="Preview" style={{ imageRendering: 'pixelated' }} />
                    </div>
                    <button type="button" onClick={() => setNewMemberCustomImage(undefined)} className="text-red-500 hover:text-red-400 hover:underline text-xs font-bold">Remover Imagem</button>
                  </div>
                )}
              </div>
            </div>
          </div>


          <button type="submit" className="mt-4 bg-[#00ff88] text-black py-3 hover:bg-white transition-colors">
            ADICIONAR
          </button>
        </form>
      </Modal>

      {/* Evaluation Modal */}

      <Modal isOpen={isEvaluationOpen} onClose={() => setIsEvaluationOpen(false)} title="AVALIAÇÃO MENSAL">

          <p className="text-gray-400 mb-2">Analise o desempenho e ajuste os níveis (máx 1 nível de subida por mês).</p>
        <div className="flex flex-col gap-4 text-xs max-h-[60vh] overflow-auto">
          {employees.map(emp => (
            <div key={emp.id} className="bg-black p-3 border border-gray-700 flex justify-between items-center">
              <div>
                <p className="text-white font-bold">{emp.name} <span className="text-gray-500 font-normal">({emp.team})</span></p>
                <p className="text-red-400">Erros: {emp.errors?.length || 0}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleLevelChange(emp, -1)} disabled={emp.level === 0} className="text-red-500 disabled:opacity-30 border border-red-500 px-2 py-1 hover:bg-red-500 hover:text-black">-1</button>
                <span className="text-[#00ff88] font-bold text-lg w-16 text-center">LVL {emp.level}</span>
                <button onClick={() => handleLevelChange(emp, 1)} disabled={emp.level === 3} className="text-[#00ff88] disabled:opacity-30 border border-[#00ff88] px-2 py-1 hover:bg-[#00ff88] hover:text-black">+1</button>
              </div>
            </div>
          ))}
          <button onClick={endMonth} className="mt-4 bg-[#ff6b35] text-white py-3 hover:bg-white hover:text-black transition-colors font-bold">
            ENCERRAR MÊS E ZERAR CONTADORES
          </button>
        </div>
      </Modal>


      {/* Stats Modal */}
      <Modal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} title="STATUS DA EQUIPE">
        <div className="flex flex-col gap-6 text-xs">
          <div className="flex justify-around items-center bg-black p-4 border border-gray-700">
            <div className="text-center">
              <p className="text-gray-500 mb-1">ON-SITE</p>
              <p className="text-2xl text-[#f7c948]">{employees.filter(e => e.status === 'on-site').length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 mb-1">REMOTE</p>
              <p className="text-2xl text-[#6c63ff]">{employees.filter(e => e.status === 'remote').length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 mb-1">ABSENT</p>
              <p className="text-2xl text-gray-500">{employees.filter(e => e.status === 'absent').length}</p>
            </div>
          </div>
        </div>
      </Modal>




      {clickedEmptySeat !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm border-2 border-[#00ff88] bg-[#1a1a2e] p-6 shadow-[0_0_30px_rgba(0,255,136,0.3)]">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white tracking-widest uppercase">
                MESA {clickedEmptySeat} {clickedEmptySeat === 22 && <span className="text-[#ff00ff] block text-[10px] mt-1">(RESERVADA: CHEFE)</span>}
              </h2>
              <button onClick={() => setClickedEmptySeat(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <p className="text-sm text-gray-400 mb-6">Esta mesa está {clickedEmptySeat === 22 ? 'reservada para o cargo de Chefe.' : 'livre. O que deseja fazer?'}</p>
            {clickedEmptySeat !== 22 && (
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { setIsAddMemberOpen(true); }} 
                  className="w-full bg-[#00ff88] py-2 text-black font-bold uppercase transition hover:bg-[#00cc6a]"
                >
                  Adicionar Novo Membro
                </button>
                <button 
                  onClick={() => { setMoveTargetSeat(clickedEmptySeat); setClickedEmptySeat(null); }} 
                  className="w-full border border-[#00ff88] py-2 text-[#00ff88] font-bold uppercase transition hover:bg-[#00ff88]/10"
                >
                  Mover Membro Existente
                </button>
              </div>
            )}
            {clickedEmptySeat === 22 && (
              <button 
                onClick={() => setClickedEmptySeat(null)} 
                className="w-full bg-gray-700 py-2 text-gray-400 font-bold uppercase cursor-not-allowed"
                disabled
              >
                ACESSO RESTRITO
              </button>
            )}
          </div>
        </div>
      )}

      {moveTargetSeat !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm border-2 border-[#00ff88] bg-[#1a1a2e] p-6">
            <h2 className="text-xl font-bold text-white tracking-widest mb-4">MOVER PARA MESA {moveTargetSeat}</h2>
            <select 
              onChange={(e) => {
                const emp = employees.find(emp => emp.id === parseInt(e.target.value, 10));
                if (emp) changeEmployeeDesk(emp, moveTargetSeat);
                setMoveTargetSeat(null);
              }} 
              defaultValue="" 
              className="w-full bg-black border border-gray-600 p-2 text-white outline-none mb-4 focus:border-[#00ff88]"
            >
              <option value="" disabled>Selecione um funcionário...</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
            <button 
              onClick={() => setMoveTargetSeat(null)} 
              className="w-full text-center text-gray-400 hover:text-white transition"
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}

      {confirmDialog && (
        <Modal isOpen={true} onClose={() => setConfirmDialog(null)} title={confirmDialog.title}>
          <div className="flex flex-col gap-6 text-sm">
            <p className="text-gray-300">{confirmDialog.message}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmDialog(null)} 
                className="flex-1 py-3 border border-gray-600 text-gray-400 font-bold hover:text-white hover:border-gray-400 transition"
              >
                CANCELAR
              </button>
              <button 
                onClick={confirmDialog.onConfirm} 
                className="flex-1 py-3 bg-red-600 font-bold text-white hover:bg-red-500 transition shadow-[0_0_15px_rgba(220,38,38,0.3)]"
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        </Modal>
      )}

      {selectedDeskSlotToEdit && (
        <Modal isOpen={true} onClose={() => setSelectedDeskSlotToEdit(null)} title={`EDITAR MESA #${selectedDeskSlotToEdit.seatNumber}`}>
          <div className="flex flex-col gap-6 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <p className="text-[#00ff88] font-bold border-b border-[#00ff88]/30 pb-1">HARDWARE</p>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-gray-500 text-[10px]">MONITOR</label>
                    <input type="color" className="w-4 h-4 p-0 border-0 bg-transparent cursor-pointer" 
                      value={selectedDeskSlotToEdit.monitorColor || '#ffffff'} 
                      onChange={(e) => updateDeskSlot({ ...selectedDeskSlotToEdit, monitorColor: e.target.value })} 
                    />
                  </div>
                  <div className="flex gap-1">
                    {['simple', 'medium', 'gamer'].map(style => (
                      <button key={style} onClick={() => updateDeskSlot({ ...selectedDeskSlotToEdit, monitorStyle: style as any })}
                        className={`flex-1 py-1 border text-[9px] uppercase ${selectedDeskSlotToEdit.monitorStyle === style ? 'border-[#00ff88] text-[#00ff88] bg-[#00ff88]/10' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
                      >
                        {style === 'simple' ? 'Tubo' : style === 'medium' ? 'Plano' : 'Curvo'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-gray-500 text-[10px]">MOUSE</label>
                    <input type="color" className="w-4 h-4 p-0 border-0 bg-transparent cursor-pointer" 
                      value={selectedDeskSlotToEdit.mouseColor || '#ffffff'} 
                      onChange={(e) => updateDeskSlot({ ...selectedDeskSlotToEdit, mouseColor: e.target.value })} 
                    />
                  </div>
                  <div className="flex gap-1">
                    {['simple', 'medium', 'gamer'].map(style => (
                      <button key={style} onClick={() => updateDeskSlot({ ...selectedDeskSlotToEdit, mouseStyle: style as any })}
                        className={`flex-1 py-1 border text-[9px] uppercase ${selectedDeskSlotToEdit.mouseStyle === style ? 'border-[#00ff88] text-[#00ff88] bg-[#00ff88]/10' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
                      >
                        {style === 'simple' ? 'Fio' : style === 'medium' ? 'Sem Fio' : 'RGB'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-gray-500 text-[10px]">TECLADO</label>
                    <input type="color" className="w-4 h-4 p-0 border-0 bg-transparent cursor-pointer" 
                      value={selectedDeskSlotToEdit.keyboardColor || '#ffffff'} 
                      onChange={(e) => updateDeskSlot({ ...selectedDeskSlotToEdit, keyboardColor: e.target.value })} 
                    />
                  </div>
                  <div className="flex gap-1">
                    {['simple', 'medium', 'gamer'].map(style => (
                      <button key={style} onClick={() => updateDeskSlot({ ...selectedDeskSlotToEdit, keyboardStyle: style as any })}
                        className={`flex-1 py-1 border text-[9px] uppercase ${selectedDeskSlotToEdit.keyboardStyle === style ? 'border-[#00ff88] text-[#00ff88] bg-[#00ff88]/10' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
                      >
                        {style === 'simple' ? 'Fio' : style === 'medium' ? 'Sem Fio' : 'Mecânico'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[#00ff88] font-bold border-b border-[#00ff88]/30 pb-1">ESTRUTURA</p>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-gray-500 text-[10px]">COR DA MESA</label>
                    <input type="color" className="w-4 h-4 p-0 border-0 bg-transparent cursor-pointer" 
                      value={selectedDeskSlotToEdit.deskColor || '#ffffff'} 
                      onChange={(e) => updateDeskSlot({ ...selectedDeskSlotToEdit, deskColor: e.target.value })} 
                    />
                  </div>
                  <div className="flex gap-1">
                    {(['simple', 'medium', 'gamer'] as HardwareStyle[]).map(style => (
                      <button
                        key={style}
                        onClick={() =>
                          updateDeskSlot({
                            ...selectedDeskSlotToEdit,
                            deskStyle: style,
                            deskColor:
                              !selectedDeskSlotToEdit.deskColor || selectedDeskSlotToEdit.deskColor === '#ffffff'
                                ? DEFAULT_DESK_COLORS[style]
                                : selectedDeskSlotToEdit.deskColor,
                          })
                        }
                        className={`flex-1 py-1 border text-[9px] uppercase ${selectedDeskSlotToEdit.deskStyle === style ? 'border-[#00ff88] text-[#00ff88] bg-[#00ff88]/10' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
                      >
                        {style === 'simple' ? 'Simples' : style === 'medium' ? 'Madeira' : 'Gamer'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-gray-500 text-[9px] italic">
                    Configurações físicas da estação de trabalho. Arraste os itens no mapa para ajustar as posições.
                  </p>
                </div>
              </div>
            </div>

            {(() => {
              const targetEmployeeForDesk = employeesBySeat.get(selectedDeskSlotToEdit.seatNumber);
              if (targetEmployeeForDesk) {
                return (
                  <>
                    {renderHomeOfficeCalendar(targetEmployeeForDesk)}
                    {renderSkinCustomization(targetEmployeeForDesk)}
                  </>
                );
              }
              return null;
            })()}

            <button 
              onClick={() => setSelectedDeskSlotToEdit(null)}
              className="mt-4 bg-[#00ff88] text-black font-bold py-3 hover:bg-white transition-colors uppercase tracking-widest"
            >
              CONCLUIR EDIÇÃO
            </button>
          </div>
        </Modal>
      )}

      {isDashboardOpen && (
        <DataDashboard 
          isOpen={isDashboardOpen}
          employees={employees} 
          onClose={() => setIsDashboardOpen(false)} 
        />
      )}

      {isHomeOfficeApprovalOpen && (
        <HomeOfficeApprovalPanel
          isOpen={isHomeOfficeApprovalOpen}
          employees={employees}
          onApprove={approvePendingHomeOfficeDate}
          onClose={() => setIsHomeOfficeApprovalOpen(false)}
          onReject={rejectPendingHomeOfficeDate}
        />
      )}

    </div>
  );
}


