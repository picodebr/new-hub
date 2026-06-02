import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, PenLine, ListChecks, FileText, Loader2, Stars, BrainCircuit } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Project } from './turmasData';

type Step = 'method' | 'manual-form' | 'stages-count' | 'stages-names' | 'ai-topic' | 'ai-loading' | 'ai-preview';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (project: Omit<Project, 'id'>) => void;
}

const NewProjectDialog = ({ open, onOpenChange, onCreateProject }: Props) => {
  const [step, setStep] = useState<Step>('method');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [stagesCount, setStagesCount] = useState(1);
  const [stageNames, setStageNames] = useState<string[]>(['']);
  const [aiTopic, setAiTopic] = useState('');
  const [aiResult, setAiResult] = useState<{ name: string; description: string; stages: string[] } | null>(null);

  const reset = () => {
    setStep('method');
    setProjectName('');
    setProjectDescription('');
    setStagesCount(1);
    setStageNames(['']);
    setAiTopic('');
    setAiResult(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const handleManualSubmit = () => {
    setStep('stages-count');
  };

  const handleStagesCountNext = () => {
    setStageNames(Array.from({ length: stagesCount }, (_, i) => stageNames[i] || ''));
    setStep('stages-names');
  };

  const handleFinalize = (name: string, stages: string[]) => {
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    onCreateProject({
      name,
      status: 'Não Iniciado',
      date: dateStr,
      hasCover: false,
    });
    handleClose();
  };

  const handleAiCreate = () => {
    setStep('ai-loading');
    // Simulate AI generation
    setTimeout(() => {
      const generated = {
        name: `Projeto: ${aiTopic}`,
        description: `Projeto interdisciplinar sobre ${aiTopic}, alinhado à BNCC, explorando competências gerais e habilidades específicas da área de conhecimento. Os alunos irão desenvolver pesquisas, criar protótipos e apresentar soluções inovadoras.`,
        stages: [
          'Pesquisa e Fundamentação',
          'Planejamento e Ideação',
          'Desenvolvimento do Protótipo',
          'Apresentação e Avaliação',
        ],
      };
      setAiResult(generated);
      setStep('ai-preview');
    }, 2500);
  };

  const slideVariants = {
    initial: { opacity: 0, x: 30, scale: 0.98 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -30, scale: 0.98 },
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 glass-card border-border/50 [&>button]:hidden">
        <AnimatePresence mode="wait">
          {/* Step 1: Method Selection */}
          {step === 'method' && (
            <motion.div key="method" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">Método de criação do projeto</h3>
                </div>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Antes de começarmos, você tem a opção de escolher como deseja criar o projeto. Selecione uma das opções abaixo:
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('manual-form')}
                  className="flex-1 px-5 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Manual
                </button>
                <button
                  onClick={() => setStep('ai-topic')}
                  className="flex-1 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Inteligência Artificial
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2a: Manual Form */}
          {step === 'manual-form' && (
            <motion.div key="manual-form" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <PenLine className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">Criação manual do projeto</h3>
                </div>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Forneça um nome e uma descrição para o seu projeto e, em seguida, você poderá adicionar detalhes.
              </p>
              <div className="space-y-4">
                <Input
                  placeholder="Nome do Projeto"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="bg-background/50 border-border/50"
                />
                <Textarea
                  placeholder="Descreva a ideia..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="bg-background/50 border-border/50 min-h-[100px] resize-none"
                />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep('method')} className="flex-1 px-5 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleManualSubmit}
                  disabled={!projectName.trim()}
                  className="flex-1 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Stages Count */}
          {step === 'stages-count' && (
            <motion.div key="stages-count" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ListChecks className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">Configuração das etapas</h3>
                </div>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Quantas etapas comporão o seu projeto?
              </p>
              <Input
                type="number"
                min={1}
                max={20}
                value={stagesCount}
                onChange={(e) => setStagesCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-background/50 border-border/50"
              />
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep('manual-form')} className="flex-1 px-5 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleStagesCountNext}
                  className="flex-1 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Prosseguir
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Stage Names */}
          {step === 'stages-names' && (
            <motion.div key="stages-names" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ListChecks className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">Nomes das etapas</h3>
                </div>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Informe os nomes das etapas do seu projeto.
              </p>
              <div className="space-y-3 max-h-[300px] overflow-y-auto px-1 py-1">
                {stageNames.map((name, i) => (
                  <div key={i}>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Etapa {i + 1}</label>
                    <Input
                      value={name}
                      onChange={(e) => {
                        const updated = [...stageNames];
                        updated[i] = e.target.value;
                        setStageNames(updated);
                      }}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep('stages-count')} className="flex-1 px-5 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={() => handleFinalize(projectName, stageNames)}
                  disabled={stageNames.some(n => !n.trim())}
                  className="flex-1 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Finalizar
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2b: AI Topic */}
          {step === 'ai-topic' && (
            <motion.div key="ai-topic" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">Selecione o tópico do projeto</h3>
                </div>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Escreva o tópico do seu projeto
              </p>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="(Ex: Biologia, Ecossistema)"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="bg-background/50 border-border/50 pl-10"
                />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep('method')} className="flex-1 px-5 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleAiCreate}
                  disabled={!aiTopic.trim()}
                  className="flex-1 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar com IA
                </button>
              </div>
            </motion.div>
          )}

          {/* AI Loading */}
          {step === 'ai-loading' && (
            <motion.div key="ai-loading" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="p-6 flex flex-col items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-10 h-10 text-primary" />
              </motion.div>
              <p className="text-sm text-muted-foreground mt-4 font-medium">Criando projeto com IA...</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Alinhando com a BNCC</p>
            </motion.div>
          )}

          {/* AI Preview */}
          {step === 'ai-preview' && aiResult && (
            <motion.div key="ai-preview" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Stars className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">Projeto gerado pela IA</h3>
                </div>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome do Projeto</label>
                  <div className="glass-card p-3 text-sm text-foreground font-medium">{aiResult.name}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
                  <div className="glass-card p-3 text-sm text-muted-foreground leading-relaxed">{aiResult.description}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Etapas ({aiResult.stages.length})</label>
                  <div className="space-y-2">
                    {aiResult.stages.map((stage, i) => (
                      <div key={i} className="glass-card p-2.5 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {i + 1}
                        </div>
                        <span className="text-sm text-foreground">{stage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep('ai-topic')} className="flex-1 px-5 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors">
                  Refazer
                </button>
                <button
                  onClick={() => handleFinalize(aiResult.name, aiResult.stages)}
                  className="flex-1 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Criar Projeto
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;
