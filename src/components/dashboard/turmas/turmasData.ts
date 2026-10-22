export interface Student {
  id: string;
  name: string;
  username: string;
  initials: string;
  color: string;
  groups: string[];
  coins: number;
  lastAccess?: string;
}

export interface Project {
  id: string;
  name: string;
  status: 'Em Execução' | 'Pausado' | 'Finalizado' | 'Não Iniciado';
  date: string;
  teacherName?: string;
  teacherInitials?: string;
  hasCover: boolean;
  educator?: { id?: string; name: string; email?: string; avatar?: string } | null;
}

export interface Turma {
  id: string;
  name: string;
  code?: string;
  grade?: string;
  color?: string;
  studentCount: number;
  students: Student[];
  projects: Project[];
  raw?: any;
}

export const availableTurmas: Turma[] = [
  {
    id: '1', name: 'Turma G3', studentCount: 0, students: [], projects: [],
  },
  {
    id: '2', name: 'Turma G4', studentCount: 0, students: [], projects: [],
  },
  {
    id: '3', name: 'Turma G5', studentCount: 0, students: [], projects: [],
  },
  {
    id: '4', name: 'Turma 1º ano', studentCount: 0, students: [], projects: [],
  },
  {
    id: '5', name: 'Turma 2º ano', studentCount: 0, students: [], projects: [],
  },
  {
    id: '6', name: 'Turma 3º ano', studentCount: 0, students: [], projects: [],
  },
  {
    id: '7', name: 'Turma 4º ano', studentCount: 0, students: [], projects: [],
  },
  {
    id: '8', name: 'Turma 5º ano', studentCount: 0, students: [], projects: [],
  },
  {
    id: '9', name: 'Turma 6º ano', code: '#9837', studentCount: 2,
    students: [
      { id: 's1', name: 'Moises Picode', username: '@moises-picode', initials: 'MP', color: 'hsl(var(--primary))', groups: [], coins: 2.00, lastAccess: '20/02/26' },
      { id: 's2', name: 'Raffaela Suffi', username: '@raffaela-suffi', initials: 'RS', color: 'hsl(142 71% 35%)', groups: ['Grupo B', 'Projeto Teste 2025 v2'], coins: 210.36 },
    ],
    projects: [
      { id: 'p1', name: 'Pitch Deck', status: 'Em Execução', date: '16/02/2026', teacherName: 'João', teacherInitials: 'JE', hasCover: true },
      { id: 'p2', name: 'MVP', status: 'Em Execução', date: '16/02/2026', teacherName: 'João', teacherInitials: 'JE', hasCover: true },
      { id: 'p3', name: 'Outdoor', status: 'Em Execução', date: '16/02/2026', teacherName: 'João', teacherInitials: 'JE', hasCover: false },
      { id: 'p4', name: 'Startups', status: 'Pausado', date: '16/02/2026', teacherInitials: 'JE', teacherName: 'João', hasCover: true },
      { id: 'p5', name: 'Construindo uma Cidade Inteligente', status: 'Pausado', date: '14/01/2025', teacherInitials: 'JE', teacherName: 'João', hasCover: false },
      { id: 'p6', name: 'Projeto Final', status: 'Finalizado', date: '10/11/2024', teacherInitials: 'JE', teacherName: 'João', hasCover: false },
      { id: 'p7', name: 'Robótica Básica', status: 'Não Iniciado', date: '01/03/2026', hasCover: false },
    ],
  },
  {
    id: '10', name: 'Turma 7º ano', code: '#8757', studentCount: 5,
    students: [
      { id: 's3', name: 'teste do teste', username: '@teste-doteste', initials: 'TT', color: 'hsl(280 60% 45%)', groups: ['Grupo Pitch 26', 'Grupo NOVO 2025', 'Projeto Teste 2025 v2'], coins: 88.00 },
      { id: 's4', name: 'Aluno teste', username: '@aluno-teste66', initials: 'AT', color: 'hsl(280 60% 45%)', groups: ['Grupo Pitch 26', 'ALUNOS TESTE', 'Grupo NOVO 2025'], coins: 154.80 },
      { id: 's5', name: 'aluno teste', username: '@aluno-teste77', initials: 'AT', color: 'hsl(280 60% 45%)', groups: ['Grupo Pitch 26', 'ALUNOS TESTE', 'Grupo NOVO 2025'], coins: 131.07 },
      { id: 's6', name: 'aluno teste', username: '@aluno-teste88', initials: 'AT', color: 'hsl(280 60% 45%)', groups: ['Grupo Pitch 26', 'ALUNOS TESTE'], coins: 151.00 },
      { id: 's7', name: 'Aluno Teste Picode', username: '@aluno-testepic', initials: 'AT', color: 'hsl(280 60% 45%)', groups: ['Projeto Teste 2025 v2'], coins: 264.00 },
    ],
    projects: [
      { id: 'p8', name: 'Startup 3', status: 'Pausado', date: '05/11/2024', teacherInitials: 'JE', teacherName: 'João', hasCover: false },
      { id: 'p9', name: 'RTeste', status: 'Em Execução', date: '29/01/2024', teacherInitials: 'JE', teacherName: 'João', hasCover: false },
    ],
  },
  {
    id: '11', name: 'Turma 8º ano', code: '#2754', studentCount: 0, students: [], projects: [],
  },
  {
    id: '12', name: 'Turma 9º ano', code: '#3333', studentCount: 28,
    students: [
      { id: 's8', name: 'Moises Picode', username: '@moises-picode', initials: 'MP', color: 'hsl(var(--primary))', groups: [], coins: 2.00, lastAccess: '20/02/26' },
      { id: 's9', name: 'teste do teste', username: '@teste-doteste', initials: 'TT', color: 'hsl(280 60% 45%)', groups: ['Grupo Pitch 26', 'Grupo NOVO 2025', 'Projeto Teste 2025 v2'], coins: 88.00 },
      { id: 's10', name: 'Aluno teste', username: '@aluno-teste66', initials: 'AT', color: 'hsl(280 60% 45%)', groups: ['Grupo Pitch 26', 'ALUNOS TESTE', 'Grupo NOVO 2025', 'Projeto Teste 2025 v2'], coins: 154.80 },
      { id: 's11', name: 'aluno teste', username: '@aluno-teste77', initials: 'AT', color: 'hsl(280 60% 45%)', groups: ['Grupo Pitch 26', 'ALUNOS TESTE', 'Grupo NOVO 2025', 'Projeto Teste 2025 v2'], coins: 131.07 },
      { id: 's12', name: 'aluno teste', username: '@aluno-teste88', initials: 'AT', color: 'hsl(280 60% 45%)', groups: ['Grupo Pitch 26', 'ALUNOS TESTE'], coins: 151.00 },
      { id: 's13', name: 'Aluno teste', username: '@aluno-teste22', initials: 'AT', color: 'hsl(280 60% 45%)', groups: ['Grupo Pitch 26', 'ALUNOS TESTE', 'Grupo NOVO 2025', 'Projeto Teste 2025 v2'], coins: 159.00 },
      { id: 's14', name: 'aluno teste', username: '@aluno-teste99', initials: 'AT', color: 'hsl(280 60% 45%)', groups: ['Grupo Pitch 26', 'ALUNOS TESTE', 'Grupo NOVO 2025', 'Projeto Teste 2025 v2'], coins: 161.00 },
      { id: 's15', name: 'Raffaela Suffi', username: '@raffaela-suffi', initials: 'RS', color: 'hsl(25 60% 40%)', groups: ['Grupo B', 'Projeto Teste 2025 v2'], coins: 210.36 },
    ],
    projects: [],
  },
];
