export type CourseLessonType = 'video' | 'quiz' | 'algorithm' | 'map';

export interface Lesson {
  id: string;
  title: string;
  type: CourseLessonType;
  duration: string;
  watched: boolean;
  video_url?: string;
  description?: string;
  quiz_data?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  };
  algorithm_data?: {
    title: string;
    description: string;
    rawBlocks: string[];
    correctSequence: string[];
  };
  maze_data?: {
    theme: 'drone' | 'car' | 'ant' | 'bicicle';
    matrix: number[][]; // 0: path, 1: wall, 2: start, 3: goal
    start: { x: number; y: number };
    goal: { x: number; y: number };
  };
  attachments?: Array<{ name: string; url: string; size: string }>;
  challenge_data?: any;
  [key: string]: any;
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
  certificate_available?: boolean;
}

export const coursesData: Course[] = [
  {
    id: '1',
    title: 'Tutoriais Maker & Robótica',
    status: 'in_progress',
    progress: 25,
    color: 'from-blue-500 to-cyan-400',
    modules: [
      {
        id: 'm1',
        title: 'Componentes Eletrônicos',
        lessons: [
          {
            id: 'l1',
            title: 'Tutorial - SNAPI LED',
            type: 'video',
            duration: '2:38',
            watched: true,
            video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            description: 'Aprenda como conectar o LED e controlar sua luminosidade com sinal digital.',
            attachments: [
              { name: 'Guia_Conexao_LED.pdf', url: '#', size: '1.2 MB' },
              { name: 'Esquema_Eletrico.png', url: '#', size: '450 KB' },
            ],
          },
          {
            id: 'l2',
            title: 'Quiz - Teste seus conhecimentos sobre LEDs',
            type: 'quiz',
            duration: '3:00',
            watched: false,
            quiz_data: {
              question: 'Qual a função de um resistor ligado em série com o LED?',
              options: [
                'Limitar a corrente para não queimar o LED',
                'Aumentar o brilho do LED ao máximo',
                'Inverter a polaridade do sinal',
                'Transformar corrente contínua em alternada',
              ],
              correctIndex: 0,
              explanation: 'O resistor limita a corrente elétrica que atravessa o diodo, protegendo-o contra queima.',
            },
          },
          {
            id: 'l3',
            title: 'Desafio - Algoritmo de Semáforo Inteligente',
            type: 'algorithm',
            duration: '5:00',
            watched: false,
            algorithm_data: {
              title: 'Ciclo do Semáforo',
              description: 'Ordene os comandos na ordem correta para acionar o ciclo seguro de trânsito.',
              rawBlocks: [
                'Ligar LED Verde',
                'Aguardar 10 segundos',
                'Ligar LED Amarelo',
                'Aguardar 3 segundos',
                'Ligar LED Vermelho',
                'Aguardar 8 segundos',
              ],
              correctSequence: [
                'Ligar LED Verde',
                'Aguardar 10 segundos',
                'Ligar LED Amarelo',
                'Aguardar 3 segundos',
                'Ligar LED Vermelho',
                'Aguardar 8 segundos',
              ],
            },
          },
          {
            id: 'l4',
            title: 'Missão Labirinto - Navegação com Drone',
            type: 'map',
            duration: '6:00',
            watched: false,
            maze_data: {
              theme: 'drone',
              matrix: [
                [1, 1, 1, 1, 1, 1],
                [1, 2, 0, 0, 1, 1],
                [1, 1, 1, 0, 1, 1],
                [1, 1, 1, 0, 0, 1],
                [1, 1, 1, 1, 3, 1],
                [1, 1, 1, 1, 1, 1],
              ],
              start: { x: 1, y: 1 },
              goal: { x: 4, y: 4 },
            },
          },
        ],
      },
      {
        id: 'm2',
        title: 'PiMaker & Motores',
        lessons: [
          {
            id: 'l5',
            title: 'Tutorial - Motor DC e Ponte H',
            type: 'video',
            duration: '5:00',
            watched: false,
            description: 'Compreenda o controle bidirecional e de velocidade de motores DC.',
          },
          {
            id: 'l6',
            title: 'Quiz - Controle de Motores',
            type: 'quiz',
            duration: '3:30',
            watched: false,
            quiz_data: {
              question: 'Qual sinal é utilizado para controlar a velocidade do motor DC via software?',
              options: ['PWM (Modulação por Largura de Pulso)', 'I2C', 'SPI', 'Sinal Analógico Puro'],
              correctIndex: 0,
            },
          },
        ],
      },
    ],
  },
  {
    id: '2',
    title: 'Pensamento Computacional & Lógica',
    status: 'not_started',
    progress: 0,
    color: 'from-purple-500 to-indigo-500',
    modules: [
      {
        id: 'm3',
        title: 'Estruturas Condicionais',
        lessons: [
          {
            id: 'l7',
            title: 'Vídeo - Condições SE e SENÃO',
            type: 'video',
            duration: '4:15',
            watched: false,
          },
          {
            id: 'l8',
            title: 'Quiz - Tomada de Decisão em Robótica',
            type: 'quiz',
            duration: '2:45',
            watched: false,
            quiz_data: {
              question: 'Se a distância for menor que 10 cm, o que o robô deve fazer?',
              options: ['Parar e desviar do obstáculo', 'Acelerar para frente', 'Desligar a bateria', 'Emitir luz contínua sem parar'],
              correctIndex: 0,
            },
          },
          {
            id: 'l9',
            title: 'Desafio do Labirinto - Resgate do Carro Autônomo',
            type: 'map',
            duration: '7:00',
            watched: false,
            maze_data: {
              theme: 'car',
              matrix: [
                [1, 1, 1, 1, 1],
                [1, 2, 0, 1, 1],
                [1, 1, 0, 0, 1],
                [1, 1, 1, 3, 1],
                [1, 1, 1, 1, 1],
              ],
              start: { x: 1, y: 1 },
              goal: { x: 3, y: 3 },
            },
          },
        ],
      },
    ],
  },
];
