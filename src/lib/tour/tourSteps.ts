import type { DriveStep } from 'driver.js';

export type TourKey =
  | 'navigation'
  | 'open-book'
  | 'new-project'
  | 'access-classes'
  | 'student-password'
  | 'request-product';

const popover = (title: string, description: string) => ({
  title,
  description,
  popoverClass: 'picode-tour',
});

/**
 * Optional per-step extension: a list of selectors that, when clicked while
 * the step is active, automatically advance the tour to the next step.
 * Used to make highlighted controls (e.g. category tabs) feel interactive.
 */
export type TourStep = DriveStep & { advanceOnClick?: string[] };

export const tourFlows: Record<TourKey, TourStep[]> = {
  navigation: [
    {
      element: '[data-tour="sidebar-toggle"]',
      popover: popover('Menu lateral', 'Use este botão para abrir ou recolher o menu de navegação a qualquer momento.'),
    },
    {
      element: '[data-tour="sidebar-nav"]',
      popover: popover('Seções da plataforma', 'Aqui estão Cursos, Turmas, Code Lab, Estoque, Biblioteca e Comunidade. Clique em qualquer item para navegar.'),
    },
    {
      element: '[data-tour="notifications"]',
      popover: popover('Notificações', 'Acompanhe avisos de estoque, novos alunos e atualizações dos seus cursos.'),
    },
  ],

  'open-book': [
    {
      element: '[data-tour="nav-biblioteca"]',
      popover: popover('Biblioteca', 'Clique em "Biblioteca" no menu lateral para acessar todos os materiais.'),
      advanceOnClick: ['[data-tour="nav-biblioteca"]'],
    },
    {
      element: '[data-tour="biblioteca-tabs"]',
      popover: popover(
        'Categorias',
        'Existem 3 categorias: Aluno, Professor e Materiais Complementares. Clique em uma delas para filtrar os livros.'
      ),
      advanceOnClick: [
        '[data-tour="biblioteca-tab-aluno"]',
        '[data-tour="biblioteca-tab-professor"]',
        '[data-tour="biblioteca-tab-complementar"]',
      ],
    },
    {
      element: '[data-tour="biblioteca-books"]',
      popover: popover('Escolha um livro', 'Selecione qualquer livro para abrir o leitor de PDF integrado.'),
    },
  ],

  'new-project': [
    {
      element: '[data-tour="nav-code-lab"]',
      popover: popover('Code Lab', 'Acesse o Code Lab pelo menu lateral.'),
      advanceOnClick: ['[data-tour="nav-code-lab"]'],
    },
    {
      element: '[data-tour="new-folder-btn"]',
      popover: popover('Nova Pasta', 'Use o botão "+ Nova Pasta" para criar uma pasta e organizar seus projetos. Dentro dela você poderá criar um Novo Projeto.'),
    },
  ],

  'access-classes': [
    {
      element: '[data-tour="nav-turmas"]',
      popover: popover('Turmas', 'Clique em "Turmas" no menu lateral para ver todas as suas turmas e alunos.'),
      advanceOnClick: ['[data-tour="nav-turmas"]'],
    },
    {
      element: '[data-tour="add-turma-btn"]',
      popover: popover(
        'Adicionar Turma',
        'Use este botão para adicionar uma nova turma conforme as turmas em que você dá aula.'
      ),
    },
    {
      element: '[data-tour="turmas-grid"]',
      popover: popover('Detalhes da turma', 'Selecione qualquer turma para acessar alunos, projetos, avaliações e presença.'),
    },
  ],

  'student-password': [
    {
      element: '[data-tour="nav-turmas"]',
      popover: popover('Turmas', 'Acesse "Turmas" no menu lateral.'),
      advanceOnClick: ['[data-tour="nav-turmas"]'],
    },
    {
      element: '[data-tour="turmas-grid"]',
      popover: popover('Acesse uma turma', 'Clique em um dos cards de turma para abri-la.'),
      advanceOnClick: ['[data-tour="turma-card"]'],
    },
    {
      element: '[data-tour="turma-tab-alunos"]',
      popover: popover('Aba Alunos', 'Selecione a categoria "Alunos" para ver a lista de estudantes.'),
      advanceOnClick: ['[data-tour="turma-tab-alunos"]'],
    },
    {
      element: '[data-tour="students-list"]',
      popover: popover('Selecione o aluno', 'Clique no aluno que esqueceu a senha para abrir o perfil.'),
      advanceOnClick: ['[data-tour="student-row"]'],
    },
    {
      element: '[data-tour="reset-password-btn"]',
      popover: popover('Resetar Senha', 'No perfil do aluno, use o botão "Resetar Senha" para gerar uma nova senha.'),
    },
  ],

  'request-product': [
    {
      element: '[data-tour="nav-estoque-maker"]',
      popover: popover('Estoque Maker', 'Abra o "Estoque Maker" pelo menu lateral.'),
    },
    {
      element: '[data-tour="sidebar-nav"]',
      popover: popover('Solicitações de revenda', 'Vá até a aba de Solicitações e abra uma nova solicitação de produto.'),
    },
  ],
};
