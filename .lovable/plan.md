## Objetivo

Transformar cada item do **Guia Rápido** (home do dashboard) num gatilho que inicia um **tour guiado encadeado** com `driver.js`, começando no elemento relacionado à pergunta clicada e seguindo passo-a-passo pelos próximos pontos do fluxo.

## Como vai funcionar

1. Usuário clica em uma pergunta do Guia Rápido (ex.: "Como acessar minhas turmas?").
2. O tour é iniciado a partir do passo correspondente (ex.: destaca "Turmas" no menu lateral) e segue encadeado pelos passos seguintes daquele fluxo.
3. Spotlight escurece o resto da tela, popover mostra título + descrição + botões Próximo / Anterior / Pular.
4. Ao terminar (ou pular), o tour fecha suavemente.

## Implementação

### Dependência

- Adicionar `driver.js` (`bun add driver.js`) e importar o CSS base.

### Estrutura nova

- `src/lib/tour/tourSteps.ts` — define os fluxos encadeados. Cada FAQ vira uma chave que mapeia para uma sequência de passos (`element` por seletor + `popover` com título/descrição).
- `src/hooks/useGuidedTour.ts` — hook que instancia o `driver()` com tema (cores Apple Blue, glass), abre o tour numa chave e garante que o sidebar fique aberto antes de destacar itens do menu.

### Fluxos (encadeados)

Cada item do `QuickGuide` dispara um fluxo:

- **Navegar pela plataforma** → Sidebar → Navbar → Conteúdo principal → Tema/Perfil.
- **Abrir o livro** → Sidebar "Biblioteca" → card de livro → botão de abrir leitor.
- **Criar novo projeto** → Sidebar "Code Lab" → pasta → botão "Novo Projeto".
- **Acessar turmas** → Sidebar "Turmas" → lista → entrar em uma turma.
- **Aluno esqueceu senha** → Sidebar "Turmas" → lista → entrar em uma turma → Alunos → Selecionar aluno → Avatar/Perfil → resetar senha.
- **Pedir produto** → Sidebar "Suporte" → aba Abrir chamado.

### Marcação no DOM

- Adicionar `data-tour="..."` em elementos-chave já existentes:
  - `DashboardSidebar` itens de menu (`data-tour="nav-turmas"`, `nav-biblioteca`, `nav-codelab`, `nav-estoque`, `nav-comunidade`).
  - `DashboardNavbar` (toggle sidebar, tema, avatar).
  - Containers de cada view (Biblioteca card, Code Lab pasta, Estoque tab Solicitações, etc.).
- Seletores no `tourSteps.ts` usam `[data-tour="..."]`.

### Integração

- `QuickGuide.tsx`: além do accordion existente, adicionar botão "Iniciar tour" no painel expandido de cada FAQ (mantém o comportamento atual de mostrar resposta + opção de tour). Clicar chama `startTour(key)` do hook.
- Antes de iniciar, se o tour precisar do sidebar aberto e estiver fechado no mobile/desktop, o hook abre via um pequeno contexto ou evento (`window.dispatchEvent(new CustomEvent('open-sidebar'))` escutado em `Dashboard.tsx`).
- Após o último passo de um fluxo que muda de tela (ex.: "entrar em uma turma"), o tour termina — não navegamos automaticamente; o destaque indica o próximo clique do usuário.

### Estilo

- Customizar CSS do driver.js para combinar com o visual (glass, primary Apple Blue, radius grande, sombra suave). Arquivo `src/lib/tour/tour.css` importado uma vez em `main.tsx` (ou no hook).

## Detalhes técnicos

- `driver.js` v1.x (`import { driver } from 'driver.js'; import 'driver.js/dist/driver.css';`).
- Tipos: `DriveStep[]` por fluxo.
- Acessibilidade: usar `allowClose: true`, `showProgress: true`, textos em PT-BR (`nextBtnText`, `prevBtnText`, `doneBtnText`).
- Mobile: driver.js já lida com viewport pequeno; sidebar é aberto via overlay antes dos passos de menu.

## Arquivos afetados

- novo: `src/lib/tour/tourSteps.ts`, `src/lib/tour/tour.css`, `src/hooks/useGuidedTour.ts`
- editar: `src/components/dashboard/QuickGuide.tsx` (botão iniciar tour), `src/components/dashboard/DashboardSidebar.tsx` + `DashboardNavbar.tsx` + views relevantes (atributos `data-tour`), `src/pages/Dashboard.tsx` (listener para abrir sidebar)
- `package.json` (+ `driver.js`)