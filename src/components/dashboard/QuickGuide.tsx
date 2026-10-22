import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Lightbulb, PlayCircle } from 'lucide-react';
import { useGuidedTour } from '@/hooks/useGuidedTour';
import type { TourKey } from '@/lib/tour/tourSteps';

const faqs: { q: string; a: string; tour: TourKey }[] = [
  { q: 'Como navegar pela plataforma?', a: 'Use o menu lateral para acessar as seções: Cursos, Turmas, Meus Códigos, Estoque, Biblioteca e Comunidade.', tour: 'navigation' },
  { q: 'Como abrir o livro na plataforma?', a: 'Acesse a Biblioteca, selecione o material desejado e clique para abrir o leitor de PDF.', tour: 'open-book' },
  { q: 'Como criar um novo projeto?', a: 'Para criar um novo projeto, entre em \'Turmas\', selecione a turma, navegue até a aba \'Projetos\' e clique em \'Novo Projeto\'. Você pode usar nossa IA para mapear tudo rapidamente.', tour: 'new-project' },
  { q: 'Como acessar minhas turmas?', a: 'Clique em "Turmas" no menu lateral para ver suas turmas e alunos.', tour: 'access-classes' },
  { q: 'O que fazer se meu aluno esquecer a senha?', a: 'Acesse \'Turmas\' > Selecione a Turma > Aba \'Alunos\' > Clique no aluno > Clique no botão \'Resetar Senha\'.', tour: 'student-password' },
  { q: 'Como pedir um novo produto na loja?', a: 'Os alunos compram no ambiente do projeto (Meus Grupos > Loja Online). Você deve aprovar o pedido deles pelo Hub, na seção \'Estoque Maker\', aba \'Pedidos\'.', tour: 'request-product' },
];

const QuickGuide = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { startTour } = useGuidedTour();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card overflow-hidden p-5 md:p-6"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
          <Lightbulb className="h-[18px] w-[18px] text-amber-500" />
        </div>
        <h2 className="text-base font-semibold text-foreground sm:text-lg">Guia Rápido</h2>
      </div>

      <div className="space-y-2.5">
        {faqs.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={`group relative overflow-hidden rounded-2xl border bg-card/60 transition-all duration-300 hover:bg-card hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)] ${
                isOpen ? 'border-primary/30 bg-card' : 'border-border/40 hover:border-border'
              }`}
            >
              {/* Accent bar */}
              <span
                className={`absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all duration-300 ${
                  isOpen ? 'h-12 opacity-100' : 'h-8 opacity-60 group-hover:h-12 group-hover:opacity-100'
                }`}
              />

              <motion.button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                whileTap={{ scale: 0.995 }}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-transform duration-300 group-hover:scale-105">
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </div>
                  <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                    {item.q}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-all duration-300 ${
                    isOpen ? 'rotate-180 text-primary' : 'group-hover:text-foreground'
                  }`}
                />
              </motion.button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/30 px-4 py-3.5 pl-[60px] space-y-3">
                      <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                      <button
                        onClick={() => startTour(item.tour)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/15 hover:scale-[1.02]"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        Iniciar tour guiado
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default QuickGuide;
