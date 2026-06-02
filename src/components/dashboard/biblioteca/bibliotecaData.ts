export interface Material {
  id: string;
  title: string;
  cover: string;
  type: 'book' | 'guide' | 'worksheet';
  pdfUrl: string;
}

export interface YearCollection {
  year: string;
  materials: Material[];
}

export interface ContentTab {
  id: string;
  label: string;
  collections: YearCollection[];
}

const placeholderPdf = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

export const bibliotecaData: ContentTab[] = [
  {
    id: 'aluno',
    label: 'Aluno',
    collections: [
      {
        year: '1º Ano',
        materials: [
          { id: 'a1', title: 'Jornada Maker Start - Vol. I', cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&h=400&fit=crop', type: 'book', pdfUrl: placeholderPdf },
          { id: 'a2', title: 'Meu Portfólio Anos Iniciais', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop', type: 'book', pdfUrl: placeholderPdf },
          { id: 'a3', title: 'Atividades Complementares 1', cover: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=300&h=400&fit=crop', type: 'worksheet', pdfUrl: placeholderPdf },
          { id: 'a4', title: 'Guia do Aluno Maker', cover: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&h=400&fit=crop', type: 'guide', pdfUrl: placeholderPdf },
        ],
      },
      {
        year: '2º Ano',
        materials: [
          { id: 'a5', title: 'O Mito da Caverna', cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop', type: 'book', pdfUrl: placeholderPdf },
          { id: 'a6', title: 'Jornada Maker Start - Vol. II', cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop', type: 'book', pdfUrl: placeholderPdf },
          { id: 'a7', title: 'Meu Portfólio Anos Iniciais Vol. II', cover: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&h=400&fit=crop', type: 'book', pdfUrl: placeholderPdf },
        ],
      },
      {
        year: '3º Ano',
        materials: [
          { id: 'a8', title: 'Robótica Criativa', cover: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&h=400&fit=crop', type: 'book', pdfUrl: placeholderPdf },
          { id: 'a9', title: 'Programação Visual', cover: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=300&h=400&fit=crop', type: 'book', pdfUrl: placeholderPdf },
        ],
      },
    ],
  },
  {
    id: 'professor',
    label: 'Professor',
    collections: [
      {
        year: 'Guias Pedagógicos',
        materials: [
          { id: 'p1', title: 'Manual do Professor - 1º Ano', cover: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&h=400&fit=crop', type: 'guide', pdfUrl: placeholderPdf },
          { id: 'p2', title: 'Manual do Professor - 2º Ano', cover: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&h=400&fit=crop', type: 'guide', pdfUrl: placeholderPdf },
          { id: 'p3', title: 'Planejamento Anual Maker', cover: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=400&fit=crop', type: 'guide', pdfUrl: placeholderPdf },
        ],
      },
      {
        year: 'Formação Continuada',
        materials: [
          { id: 'p4', title: 'Metodologias Ativas', cover: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=400&fit=crop', type: 'book', pdfUrl: placeholderPdf },
          { id: 'p5', title: 'STEAM na Prática', cover: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&h=400&fit=crop', type: 'book', pdfUrl: placeholderPdf },
        ],
      },
    ],
  },
  {
    id: 'complementar',
    label: 'Materiais Complementares',
    collections: [
      {
        year: 'Atividades Extras',
        materials: [
          { id: 'c1', title: 'Fichas de Atividades', cover: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=300&h=400&fit=crop', type: 'worksheet', pdfUrl: placeholderPdf },
          { id: 'c2', title: 'Jogos e Dinâmicas', cover: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=300&h=400&fit=crop', type: 'worksheet', pdfUrl: placeholderPdf },
        ],
      },
      {
        year: 'Recursos Digitais',
        materials: [
          { id: 'c3', title: 'Guia de Ferramentas Online', cover: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=400&fit=crop', type: 'guide', pdfUrl: placeholderPdf },
          { id: 'c4', title: 'Templates de Projetos', cover: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=400&fit=crop', type: 'guide', pdfUrl: placeholderPdf },
        ],
      },
    ],
  },
];
