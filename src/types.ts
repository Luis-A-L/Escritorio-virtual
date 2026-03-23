export type Team = 'Triagem Cível' | 'Triagem Crime' | 'Retorno Crime' | 'Retorno Cível' | 'Controle' | 'I.A.';
export type EducationLevel = 'Ensino Médio' | 'Graduação' | 'Pós-graduação';
export type Status = 'on-site' | 'remote' | 'absent';
export type Mood = 'focused' | 'happy' | 'tired' | 'blocked';
export type DeskVariant = 'corner-tl' | 'corner-tr' | 'corner-bl' | 'corner-br' | 'pillar' | 'boss';

export type ErrorType = 
  | 'Distribuição incorreta'
  | 'Fragmentação indevida de incidentes'
  | 'Encaminhamento equivocado (Ord/Ass)'
  | 'Envio desnecessário (Ordinatórios)'
  | 'Envio desnecessário (Assessores)'
  | 'Outras falhas funcionais/operacionais';

export interface EmployeeError {
  id: number;
  date: string;
  type: ErrorType;
}

export type Gender = 'male' | 'female';

export interface PositionOffset {
  x: number;
  y: number;
  rotation?: number;
}

export type LayoutItemReference = 
  | { type: 'desk', id: number }
  | { type: 'monitor', id: number }
  | { type: 'mouse', id: number }
  | { type: 'keyboard', id: number }
  | { type: 'character', id: number };

export interface Employee {
  id: number;
  name: string;
  team: Team;
  education: EducationLevel;
  status: Status;
  level: 0 | 1 | 2 | 3;
  errors: EmployeeError[];
  homeOfficeUsedThisMonth: number;
  mood: Mood;
  gender?: Gender;
  avatar: string;
  customImageUrl?: string;
  deskPosition: { row: number; col: number };
  deskStyle?: 'simple' | 'medium' | 'gamer';
  monitorStyle?: 'simple' | 'medium' | 'gamer';
  mouseStyle?: 'simple' | 'medium' | 'gamer';
  keyboardStyle?: 'simple' | 'medium' | 'gamer';
  deskColor?: string;
  monitorColor?: string;
  mouseColor?: string;
  keyboardColor?: string;
  linkedUserId?: string;
  monitorOffset?: PositionOffset;
  mouseOffset?: PositionOffset;
  keyboardOffset?: PositionOffset;
  characterOffset?: PositionOffset;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Task {
  id: number;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
}

export interface DeskSlot {
  seatNumber: number;
  left_pos: number;
  top_pos: number;
  variant: DeskVariant;
  isBoss?: boolean;
  rotation?: number;
}

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 1, name: 'Ana Silva', team: 'Triagem Cível', education: 'Graduação', status: 'on-site', level: 1, errors: [], homeOfficeUsedThisMonth: 0, mood: 'focused', gender: 'female', avatar: 'f1', deskPosition: { row: 0, col: 0 } },
  { id: 2, name: 'Carlos Costa', team: 'Triagem Crime', education: 'Graduação', status: 'on-site', level: 1, errors: [], homeOfficeUsedThisMonth: 0, mood: 'happy', gender: 'male', avatar: 'm1', deskPosition: { row: 0, col: 1 } },
  { id: 3, name: 'Beatriz Lima', team: 'Retorno Cível', education: 'Graduação', status: 'on-site', level: 1, errors: [], homeOfficeUsedThisMonth: 0, mood: 'focused', gender: 'female', avatar: 'f2', deskPosition: { row: 0, col: 2 } },
  { id: 4, name: 'João Santos', team: 'Controle', education: 'Graduação', status: 'on-site', level: 1, errors: [], homeOfficeUsedThisMonth: 0, mood: 'tired', gender: 'male', avatar: 'm2', deskPosition: { row: 1, col: 0 } },
  { id: 5, name: 'Mariana Alves', team: 'I.A.', education: 'Graduação', status: 'on-site', level: 1, errors: [], homeOfficeUsedThisMonth: 0, mood: 'happy', gender: 'female', avatar: 'f3', deskPosition: { row: 1, col: 1 } },
  { id: 6, name: 'Pedro Rocha', team: 'Retorno Crime', education: 'Graduação', status: 'on-site', level: 1, errors: [], homeOfficeUsedThisMonth: 0, mood: 'blocked', gender: 'male', avatar: 'm3', deskPosition: { row: 1, col: 2 } }
];

export const INITIAL_TASKS: Task[] = [
  { id: 1, title: 'Revisar processos pendentes', status: 'todo' },
  { id: 2, title: 'Atualizar planilhas de controle', status: 'in-progress' },
];

export const INITIAL_DESK_SLOTS: DeskSlot[] = [
  { seatNumber: 1, left_pos: 40, top_pos: 30, variant: 'corner-tl' },
  { seatNumber: 2, left_pos: 40, top_pos: 185, variant: 'corner-bl' },
  { seatNumber: 3, left_pos: 45, top_pos: 360, variant: 'pillar' },
  { seatNumber: 4, left_pos: 45, top_pos: 530, variant: 'pillar' },
  { seatNumber: 5, left_pos: 45, top_pos: 700, variant: 'pillar' },
  { seatNumber: 6, left_pos: 430, top_pos: 80, variant: 'corner-br' },
  { seatNumber: 7, left_pos: 590, top_pos: 80, variant: 'corner-bl' },
  { seatNumber: 8, left_pos: 430, top_pos: 240, variant: 'corner-tr' },
  { seatNumber: 9, left_pos: 590, top_pos: 240, variant: 'corner-tl' },
  { seatNumber: 10, left_pos: 320, top_pos: 540, variant: 'corner-br' },
  { seatNumber: 11, left_pos: 480, top_pos: 540, variant: 'corner-bl' },
  { seatNumber: 12, left_pos: 320, top_pos: 700, variant: 'corner-tr' },
  { seatNumber: 13, left_pos: 480, top_pos: 700, variant: 'corner-tl' },
  { seatNumber: 14, left_pos: 980, top_pos: 80, variant: 'corner-br' },
  { seatNumber: 15, left_pos: 1140, top_pos: 80, variant: 'corner-bl' },
  { seatNumber: 16, left_pos: 980, top_pos: 240, variant: 'corner-tr' },
  { seatNumber: 17, left_pos: 1140, top_pos: 240, variant: 'corner-tl' },
  { seatNumber: 18, left_pos: 1250, top_pos: 560, variant: 'corner-br' },
  { seatNumber: 19, left_pos: 1410, top_pos: 560, variant: 'corner-bl' },
  { seatNumber: 20, left_pos: 1250, top_pos: 720, variant: 'corner-tr' },
  { seatNumber: 21, left_pos: 1410, top_pos: 720, variant: 'corner-tl' },
  { seatNumber: 22, left_pos: 790, top_pos: 930, variant: 'boss', isBoss: true },
];
