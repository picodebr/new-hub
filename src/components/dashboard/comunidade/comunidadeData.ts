export interface Reaction {
  type: 'like' | 'heart' | 'star' | 'clap';
  count: number;
  reacted: boolean;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  institution: string;
  text: string;
  timeAgo: string;
  reactions: Reaction[];
  replies: Comment[];
}

export interface Post {
  id: string;
  author: string;
  avatar: string;
  institution: string;
  text: string;
  images: string[];
  timeAgo: string;
  reactions: Reaction[];
  comments: Comment[];
}

export interface Story {
  id: string;
  author: string;
  avatar: string;
  imageUrl: string;
  viewed: boolean;
  createdAt: string;
}

export const initialStories: Story[] = [
  { id: '1', author: 'Seu story', avatar: '', imageUrl: '', viewed: false, createdAt: '' },
  { id: '2', author: 'Maria Silva', avatar: '', imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400', viewed: false, createdAt: 'há 2h' },
  { id: '3', author: 'Prof. Carlos', avatar: '', imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400', viewed: false, createdAt: 'há 5h' },
  { id: '4', author: 'Ana Beatriz', avatar: '', imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400', viewed: true, createdAt: 'há 8h' },
  { id: '5', author: 'Lucas Piovani', avatar: '', imageUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400', viewed: true, createdAt: 'há 12h' },
  { id: '6', author: 'Julia Costa', avatar: '', imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400', viewed: false, createdAt: 'há 3h' },
];

export const initialPosts: Post[] = [
  {
    id: '1',
    author: 'Katiane Aparecida Almeida',
    avatar: '',
    institution: 'SF do Guaporé - SABER',
    text: 'Componentes do grupo: João Guilherme do Carmo Peruchi, Paulo Rezende Monteiro e Ytalo Heictor Zeferino da Silva, alunos do 6º ano. A inovação pode mudar vidas. Pensando na acessibilidade e na inclusão, um projeto simples, acessível e de grande impacto foi desenvolvido: óculos com sensores que detectam obstáculos, ajudando pessoas com deficiência visual a se locomover com mais segurança e autonomia.',
    images: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600',
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600',
    ],
    timeAgo: 'há 7 meses',
    reactions: [
      { type: 'like', count: 9, reacted: false },
      { type: 'heart', count: 6, reacted: false },
      { type: 'star', count: 3, reacted: false },
      { type: 'clap', count: 2, reacted: false },
    ],
    comments: [
      {
        id: 'c1',
        author: 'Lucas Piovani',
        avatar: '',
        institution: 'Instituição PiCode',
        text: 'Os alunos arrebentaram nesse projeto! Parabéns pelo empenho! 🚀',
        timeAgo: 'há 6 meses',
        reactions: [
          { type: 'like', count: 0, reacted: false },
          { type: 'heart', count: 2, reacted: false },
          { type: 'star', count: 0, reacted: false },
          { type: 'clap', count: 0, reacted: false },
        ],
        replies: [],
      },
    ],
  },
  {
    id: '2',
    author: 'Prof. Carlos Mendes',
    avatar: '',
    institution: 'Escola Municipal Inovação',
    text: 'Hoje tivemos uma aula incrível sobre robótica com Arduino! Os alunos do 7º ano montaram seus primeiros robôs seguidores de linha. Muito orgulho dessa turma! 🤖✨',
    images: [
      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600',
    ],
    timeAgo: 'há 2 dias',
    reactions: [
      { type: 'like', count: 15, reacted: true },
      { type: 'heart', count: 8, reacted: false },
      { type: 'star', count: 5, reacted: false },
      { type: 'clap', count: 12, reacted: false },
    ],
    comments: [],
  },
];
