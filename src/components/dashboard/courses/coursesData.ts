export interface Lesson {
  id: string;
  title: string;
  type: 'video';
  duration: string;
  watched: boolean;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  color: string;
  modules: Module[];
}

export const coursesData: Course[] = [
  {
    id: '1',
    title: 'Tutoriais',
    status: 'not_started',
    progress: 0,
    color: 'from-blue-500 to-cyan-400',
    modules: [
      {
        id: 'm1',
        title: 'Componentes Eletrônicos',
        lessons: [
          { id: 'l1', title: 'Tutorial - SNAPI LED', type: 'video', duration: '2:38', watched: false },
          { id: 'l2', title: 'Tutorial - Sensor de Umidade', type: 'video', duration: '3:15', watched: false },
          { id: 'l3', title: 'Tutorial - Push Button', type: 'video', duration: '4:02', watched: false },
          { id: 'l4', title: 'Tutorial - Motor DC', type: 'video', duration: '2:50', watched: false },
          { id: 'l5', title: 'Tutorial - Motor e Botão 3 Estágios', type: 'video', duration: '5:10', watched: false },
          { id: 'l6', title: 'Tutorial - Buzzer', type: 'video', duration: '3:00', watched: false },
          { id: 'l7', title: 'Tutorial - Servo Motor', type: 'video', duration: '4:22', watched: false },
          { id: 'l8', title: 'Tutorial - Sensor de Luz (LDR)', type: 'video', duration: '3:45', watched: false },
        ],
      },
      {
        id: 'm2',
        title: 'PiMaker',
        lessons: [
          { id: 'l9', title: 'Introdução ao PiMaker', type: 'video', duration: '5:00', watched: false },
          { id: 'l10', title: 'Configuração Inicial', type: 'video', duration: '3:30', watched: false },
          { id: 'l11', title: 'Primeiro Projeto', type: 'video', duration: '6:15', watched: false },
          { id: 'l12', title: 'Funções Avançadas', type: 'video', duration: '4:45', watched: false },
          { id: 'l13', title: 'Sensores no PiMaker', type: 'video', duration: '5:20', watched: false },
          { id: 'l14', title: 'Projeto Integrado', type: 'video', duration: '7:00', watched: false },
          { id: 'l15', title: 'Automação Básica', type: 'video', duration: '4:10', watched: false },
          { id: 'l16', title: 'Desafio PiMaker', type: 'video', duration: '3:50', watched: false },
          { id: 'l17', title: 'Revisão Final', type: 'video', duration: '2:30', watched: false },
        ],
      },
      {
        id: 'm3',
        title: 'PiBoard 1.0',
        lessons: [
          { id: 'l18', title: 'Conhecendo a PiBoard', type: 'video', duration: '4:00', watched: false },
          { id: 'l19', title: 'Programação Básica', type: 'video', duration: '5:30', watched: false },
          { id: 'l20', title: 'LEDs e Sensores', type: 'video', duration: '3:45', watched: false },
          { id: 'l21', title: 'Projetos com PiBoard', type: 'video', duration: '6:00', watched: false },
          { id: 'l22', title: 'Display LCD', type: 'video', duration: '4:20', watched: false },
          { id: 'l23', title: 'Comunicação Serial', type: 'video', duration: '5:10', watched: false },
        ],
      },
      {
        id: 'm4',
        title: 'PiBoard 2.0',
        lessons: [
          { id: 'l24', title: 'Novidades da PiBoard 2.0', type: 'video', duration: '3:20', watched: false },
          { id: 'l25', title: 'WiFi e IoT', type: 'video', duration: '6:30', watched: false },
          { id: 'l26', title: 'Bluetooth', type: 'video', duration: '4:15', watched: false },
          { id: 'l27', title: 'Sensores Avançados', type: 'video', duration: '5:00', watched: false },
          { id: 'l28', title: 'Projeto IoT', type: 'video', duration: '7:20', watched: false },
          { id: 'l29', title: 'Dashboard Remoto', type: 'video', duration: '4:50', watched: false },
          { id: 'l30', title: 'Projeto Final', type: 'video', duration: '8:00', watched: false },
        ],
      },
      {
        id: 'm5',
        title: 'Glossário Maker',
        lessons: [
          { id: 'l31', title: 'Termos de Eletrônica', type: 'video', duration: '3:00', watched: false },
          { id: 'l32', title: 'Termos de Programação', type: 'video', duration: '3:30', watched: false },
          { id: 'l33', title: 'Termos de Robótica', type: 'video', duration: '2:45', watched: false },
        ],
      },
    ],
  },
  {
    id: '2',
    title: 'Formação Maker',
    status: 'completed',
    progress: 100,
    color: 'from-emerald-500 to-teal-400',
    modules: [
      {
        id: 'm6',
        title: 'Fundamentos Maker',
        lessons: [
          { id: 'l34', title: 'O que é Cultura Maker?', type: 'video', duration: '4:00', watched: true },
          { id: 'l35', title: 'Ferramentas Essenciais', type: 'video', duration: '5:00', watched: true },
          { id: 'l36', title: 'Segurança no Lab', type: 'video', duration: '3:00', watched: true },
        ],
      },
    ],
  },
  {
    id: '3',
    title: 'Makers Pro',
    status: 'completed',
    progress: 100,
    color: 'from-violet-500 to-purple-400',
    modules: [
      {
        id: 'm7',
        title: 'Projetos Avançados',
        lessons: [
          { id: 'l37', title: 'Robô Seguidor de Linha', type: 'video', duration: '8:00', watched: true },
          { id: 'l38', title: 'Estação Meteorológica', type: 'video', duration: '7:30', watched: true },
        ],
      },
    ],
  },
  {
    id: '4',
    title: 'Maker Empreendedor 6º ano',
    status: 'not_started',
    progress: 0,
    color: 'from-orange-500 to-amber-400',
    modules: [
      {
        id: 'm8',
        title: 'Empreendedorismo Maker',
        lessons: [
          { id: 'l39', title: 'Ideação de Produtos', type: 'video', duration: '5:00', watched: false },
          { id: 'l40', title: 'Prototipagem', type: 'video', duration: '6:00', watched: false },
          { id: 'l41', title: 'Modelo de Negócios', type: 'video', duration: '4:30', watched: false },
        ],
      },
    ],
  },
  {
    id: '5',
    title: 'Engenhoka PROF',
    status: 'not_started',
    progress: 0,
    color: 'from-rose-500 to-pink-400',
    modules: [
      {
        id: 'm9',
        title: 'Engenhoka para Professores',
        lessons: [
          { id: 'l42', title: 'Introdução à Engenhoka', type: 'video', duration: '4:00', watched: false },
          { id: 'l43', title: 'Planejamento de Aulas', type: 'video', duration: '5:30', watched: false },
        ],
      },
    ],
  },
  {
    id: '6',
    title: 'Engenhoka',
    status: 'not_started',
    progress: 0,
    color: 'from-sky-500 to-blue-400',
    modules: [
      {
        id: 'm10',
        title: 'Módulo Engenhoka',
        lessons: [
          { id: 'l44', title: 'Montagem Básica', type: 'video', duration: '3:45', watched: false },
          { id: 'l45', title: 'Circuitos Simples', type: 'video', duration: '4:20', watched: false },
        ],
      },
    ],
  },
  {
    id: '7',
    title: 'Comercial',
    status: 'not_started',
    progress: 0,
    color: 'from-indigo-500 to-blue-400',
    modules: [
      {
        id: 'm11',
        title: 'Apresentação Comercial',
        lessons: [
          { id: 'l46', title: 'Visão Geral PiCode', type: 'video', duration: '5:00', watched: false },
          { id: 'l47', title: 'Planos e Soluções', type: 'video', duration: '4:00', watched: false },
        ],
      },
    ],
  },
  {
    id: '8',
    title: 'Boas-vindas!',
    status: 'completed',
    progress: 100,
    color: 'from-green-500 to-emerald-400',
    modules: [
      {
        id: 'm12',
        title: 'Bem-vindo à PiCode',
        lessons: [
          { id: 'l48', title: 'Conheça a Plataforma', type: 'video', duration: '3:00', watched: true },
          { id: 'l49', title: 'Primeiros Passos', type: 'video', duration: '4:00', watched: true },
        ],
      },
    ],
  },
];
