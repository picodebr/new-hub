import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Headphones,
  Calendar,
  MessageSquare,
  ChevronDown,
  Clock,
  ArrowLeft,
  Wrench,
  GraduationCap,
  Sparkles,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type StepType = 'FAQ' | 'SELECT_SUPPORT' | 'TECH_CALENDAR' | 'PEDAGO_CALENDAR';

interface GuideType {
  label: string;
  instructions: string;
}

const FAQ_GUIDES: GuideType[] = [
  {
    label: 'Como navegar pela plataforma?',
    instructions:
      'Você pode navegar pelo PiCode Hub utilizando o menu lateral à esquerda e selecionando a seção que deseja acessar, como Turmas, Cursos, Biblioteca, Estoque Maker ou Code Lab.',
  },
  {
    label: 'Como abrir os livros e apostilas na plataforma?',
    instructions:
      'Para abrir um livro, acesse a seção "Biblioteca" no menu lateral. Lá você encontrará as abas por categoria e série com opções para visualização direta em tela cheia ou download do PDF.',
  },
  {
    label: 'Como criar um novo projeto pedagógico com minha turma?',
    instructions:
      'Acesse a seção "Turmas", clique na turma desejada, navegue até a aba "Projetos" e clique em "Adicionar Novo". Você pode cadastrar os objetivos, materiais do estoque e competências BNCC.',
  },
  {
    label: 'Como acessar e gerenciar minhas turmas?',
    instructions:
      'Certifique-se de que a escola correta está selecionada na barra superior (caso você lecione em mais de uma). No menu "Turmas", você pode visualizar alunos, chamada/frequência e avaliações.',
  },
  {
    label: 'O que fazer se um aluno esquecer a senha?',
    instructions:
      'Acesse a turma do aluno, abra a aba "Alunos" e clique no aluno em questão. No perfil dele, utilize o botão "Resetar Senha" para definir uma nova senha provisória de acesso imediato.',
  },
  {
    label: 'Como iniciar um curso ou módulo?',
    instructions:
      'No menu lateral, selecione "Cursos", escolha o curso de seu interesse e navegue pelos módulos e aulas práticas interativas (vídeos, quizzes, desafios de labirinto e algoritmos).',
  },
  {
    label: 'Como solicitar novos componentes ou suporte físico?',
    instructions:
      'Você pode abrir um chamado na área de "Relatórios / Chamados" ou agendar uma reunião remota de suporte técnico ou pedagógico diretamente com nosso time pelo calendário integrado.',
  },
];

export const SupportAppointmentsView: React.FC = () => {
  const [step, setStep] = useState<StepType>('FAQ');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState('');
  const navigate = useNavigate();

  const filteredFaqs = FAQ_GUIDES.filter(
    (item) =>
      item.label.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.instructions.toLowerCase().includes(faqSearch.toLowerCase())
  );

  useEffect(() => {
    if (step === 'TECH_CALENDAR' || step === 'PEDAGO_CALENDAR') {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        try {
          document.body.removeChild(script);
        } catch {}
      };
    }
  }, [step]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Suporte e Agendamentos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tire dúvidas rápidas, abra chamados ou agende uma reunião com nossos especialistas
            </p>
          </div>
        </div>

        {step !== 'FAQ' && (
          <button
            onClick={() => setStep(step === 'SELECT_SUPPORT' ? 'FAQ' : 'SELECT_SUPPORT')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 'FAQ' && (
          <motion.div
            key="faq"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => navigate('/reports')}
                className="glass-card !rounded-2xl p-6 cursor-pointer hover:border-primary/50 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">
                    Chamados
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  Abrir um Chamado
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Reporte dúvidas sobre kits físicos, placas Arduino, bugs na plataforma ou solicitação de materiais.
                </p>
              </div>

              <div
                onClick={() => setStep('SELECT_SUPPORT')}
                className="glass-card !rounded-2xl p-6 cursor-pointer hover:border-emerald-500/50 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500 group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-full">
                    Online 1:1
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                  Marcar uma Reunião
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Agende um horário exclusivo de 30 minutos com nossos consultores técnicos ou pedagógicos.
                </p>
              </div>
            </div>

            {/* FAQ Accordion */}
            <div className="glass-card !rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Perguntas Frequentes (FAQ)</h2>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Buscar pergunta ou palavra-chave..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border/50 bg-accent/30 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>

              {filteredFaqs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-6 text-center">
                  Nenhuma pergunta encontrada para "{faqSearch}".
                </p>
              ) : (
                <div className="divide-y divide-border/40">
                  {filteredFaqs.map((item, idx) => {
                    const isOpen = expandedFaq === idx;
                    return (
                      <div key={idx} className="py-4">
                        <button
                          onClick={() => setExpandedFaq(isOpen ? null : idx)}
                          className="w-full flex items-center justify-between text-left gap-4 group"
                        >
                          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {item.label}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-primary' : ''
                            }`}
                          />
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed bg-accent/20 p-3.5 rounded-xl">
                                {item.instructions}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Operating Hours Info */}
            <div className="glass-card !rounded-2xl p-5 flex items-center gap-3 text-muted-foreground text-xs">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span>
                Horário de atendimento humano: Segunda a sexta-feira, das 07h às 18h (horário de Brasília), exceto feriados nacionais.
              </span>
            </div>
          </motion.div>
        )}

        {step === 'SELECT_SUPPORT' && (
          <motion.div
            key="select_support"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6 max-w-2xl mx-auto py-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Como podemos te ajudar hoje?</h2>
              <p className="text-sm text-muted-foreground">
                Selecione a área com a qual deseja falar para ver os horários disponíveis
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div
                onClick={() => setStep('TECH_CALENDAR')}
                className="glass-card !rounded-2xl p-6 cursor-pointer hover:border-primary/60 hover:shadow-lg transition-all group flex flex-col items-center text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Wrench className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    Suporte Técnico
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Fale com nosso time de engenharia sobre placas Arduino, componentes eletrônicos, firmwares e montagem dos robôs físicos.
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary mt-auto flex items-center gap-1">
                  Agendar horário com Giovanni <Sparkles className="w-3.5 h-3.5" />
                </span>
              </div>

              <div
                onClick={() => setStep('PEDAGO_CALENDAR')}
                className="glass-card !rounded-2xl p-6 cursor-pointer hover:border-emerald-500/60 hover:shadow-lg transition-all group flex flex-col items-center text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                    Suporte Pedagógico
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Tire dúvidas com coordenadores de ensino sobre planejamento de aulas, BNCC, aplicação de metodologias ativas e materiais didáticos.
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-auto flex items-center gap-1">
                  Agendar horário com Moisés <Sparkles className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'TECH_CALENDAR' && (
          <motion.div
            key="tech_calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card !rounded-2xl p-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4 px-2">
              <Wrench className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Agenda de Suporte Técnico (Engenharia PiCode)</h3>
            </div>
            <div
              className="calendly-inline-widget rounded-xl overflow-hidden"
              data-url="https://calendly.com/giovanni-marin-picode/30min"
              style={{ minWidth: '320px', height: '700px' }}
            />
          </motion.div>
        )}

        {step === 'PEDAGO_CALENDAR' && (
          <motion.div
            key="pedago_calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card !rounded-2xl p-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4 px-2">
              <GraduationCap className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base font-bold text-foreground">Agenda de Suporte Pedagógico (Coordenação PiCode)</h3>
            </div>
            <div
              className="calendly-inline-widget rounded-xl overflow-hidden"
              data-url="https://calendly.com/moises-silva-picode/30min"
              style={{ minWidth: '320px', height: '700px' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SupportAppointmentsView;
