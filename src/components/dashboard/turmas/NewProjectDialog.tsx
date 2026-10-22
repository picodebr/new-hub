import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Wand2,
  PenLine,
  FileText,
  Loader2,
  RotateCcw,
  Plus,
  Minus,
  Sparkles,
  Layers,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addProject } from '@/_base/services/project';
import { generateProjectWithAI, generateProjectToolsWithAI } from '@/_base/classes/gpt';
import { IHubProjectStep } from '@/_base/interfaces/project';
import { toast } from 'sonner';

type ModalStep =
  | 'creation_type'
  | 'creation_topic'
  | 'edit_draft'
  | 'man_project_name'
  | 'man_task_quantity'
  | 'man_task_naming';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turmaId: string;
  onProjectCreated: (project: any) => void;
}

const NewProjectDialog = ({ open, onOpenChange, turmaId, onProjectCreated }: Props) => {
  const [modalStep, setModalStep] = useState<ModalStep>('creation_type');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingIa, setIsLoadingIa] = useState(false);

  // Manual Creation State
  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [stepCount, setStepCount] = useState(1);
  const [manualSteps, setManualSteps] = useState<IHubProjectStep[]>([
    { title: '', description: null, position: 1 },
  ]);

  // AI Creation State
  const [aiTopic, setAiTopic] = useState('');
  const [aiDraft, setAiDraft] = useState<{
    title: string;
    description: string;
    tools: string[];
    bncc: string[];
    steps: IHubProjectStep[];
  } | null>(null);

  const reset = () => {
    setModalStep('creation_type');
    setIsSubmitting(false);
    setIsLoadingIa(false);
    setManualTitle('');
    setManualDescription('');
    setStepCount(1);
    setManualSteps([{ title: '', description: null, position: 1 }]);
    setAiTopic('');
    setAiDraft(null);
  };

  const handleClose = () => {
    if (isSubmitting || isLoadingIa) return;
    onOpenChange(false);
    setTimeout(reset, 250);
  };

  // --- Manual Flow Handlers ---
  const handleProceedToQuantity = () => {
    if (!manualTitle.trim()) return;
    setModalStep('man_task_quantity');
  };

  const handleSetQuantity = (qty: number) => {
    const clamped = Math.max(1, Math.min(6, qty));
    setStepCount(clamped);
    setManualSteps((prev) =>
      Array.from({ length: clamped }, (_, i) => ({
        title: prev[i]?.title || '',
        description: prev[i]?.description || null,
        position: i + 1,
      }))
    );
  };

  const handleProceedToNaming = () => {
    setModalStep('man_task_naming');
  };

  const handleCreateManualProject = async () => {
    if (!manualTitle.trim() || manualSteps.some((s) => !s.title.trim())) return;
    setIsSubmitting(true);
    try {
      const project = await addProject({
        title: manualTitle.trim(),
        class_id: turmaId,
        description: manualDescription.trim() || undefined,
        metadata: { steps: manualSteps },
      });
      toast.success('Projeto criado com sucesso!');
      onProjectCreated(project);
      handleClose();
    } catch (err) {
      console.error('Erro ao criar projeto manual:', err);
      toast.error('Erro ao criar projeto. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- AI Flow Handlers ---
  const handleGenerateWithAI = async () => {
    if (!aiTopic.trim()) return;
    setIsLoadingIa(true);
    try {
      const resultIA = await generateProjectWithAI({ grade: turmaId, topic: aiTopic.trim() });
      const rawContent = resultIA.response.content;

      const oldTools = (rawContent.materials || []).slice(0, 2);
      let tools = rawContent.materials || [];
      try {
        if (oldTools.length > 0) {
          const newTools = await generateProjectToolsWithAI({
            tools: oldTools,
            previousResponse: JSON.stringify(rawContent),
          });
          if (newTools && newTools.length > 0) {
            tools = newTools;
          }
        }
      } catch (toolErr) {
        console.warn('Erro ao refinar materiais com IA:', toolErr);
      }

      const iaSteps: IHubProjectStep[] = (rawContent.steps || []).map((step, idx) => ({
        title: step.title || `Etapa ${idx + 1}`,
        description: step.description || null,
        position: step.position || idx + 1,
        parent: 'default',
      }));

      setAiDraft({
        title: rawContent.title || `Projeto: ${aiTopic}`,
        description: rawContent.objective || '',
        tools: tools,
        bncc: rawContent.bnccTags || [],
        steps: iaSteps,
      });

      setModalStep('edit_draft');
    } catch (err) {
      console.error('Erro ao gerar projeto com IA:', err);
      toast.error('Não foi possível gerar o projeto com IA. Verifique sua conexão ou tente outro tópico.');
    } finally {
      setIsLoadingIa(false);
    }
  };

  const handleSaveAiProject = async () => {
    if (!aiDraft || !aiDraft.title.trim()) return;
    setIsSubmitting(true);
    try {
      const project = await addProject({
        title: aiDraft.title.trim(),
        class_id: turmaId,
        description: aiDraft.description.trim() || undefined,
        metadata: {
          steps: aiDraft.steps,
          bncc: aiDraft.bncc,
          tools: aiDraft.tools,
        },
      });
      toast.success('Projeto gerado e salvo com sucesso!');
      onProjectCreated(project);
      handleClose();
    } catch (err) {
      console.error('Erro ao salvar projeto gerado pela IA:', err);
      toast.error('Erro ao salvar projeto. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 border border-border/70 shadow-2xl bg-card rounded-2xl overflow-hidden [&>button]:hidden">
        <AnimatePresence mode="wait">
          {/* STEP 1: Método de criação */}
          {modalStep === 'creation_type' && (
            <motion.div
              key="creation_type"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Método de criação do projeto</h3>
                    <p className="text-xs text-muted-foreground">
                      Escolha como deseja iniciar a elaboração do projeto para a turma.
                    </p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-2 rounded-xl hover:bg-accent text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalStep('creation_topic')}
                  className="group relative flex flex-col items-start p-5 rounded-2xl border-2 border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground mb-3 shadow-md group-hover:scale-105 transition-transform">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-foreground text-base mb-1">Inteligência Artificial</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Gere o título, objetivo, etapas e alinhamento BNCC automaticamente a partir de um tópico.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setModalStep('man_project_name')}
                  className="group relative flex flex-col items-start p-5 rounded-2xl border-2 border-border/70 bg-card hover:border-border hover:bg-accent/40 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground mb-3 group-hover:scale-105 transition-transform">
                    <PenLine className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-foreground text-base mb-1">Criação Manual</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Personalize o nome, objetivo pedagógico e as etapas do seu projeto passo a passo.
                  </p>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP AI 1: Seleção do Tópico */}
          {modalStep === 'creation_topic' && (
            <motion.div
              key="creation_topic"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Selecione o tópico do projeto</h3>
                    <p className="text-xs text-muted-foreground">
                      Escreva o assunto principal para a IA estruturar o projeto maker.
                    </p>
                  </div>
                </div>
                <button disabled={isLoadingIa} onClick={handleClose} className="p-2 rounded-xl hover:bg-accent text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-foreground">Tópico do projeto</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder="Ex: Biologia, Ecossistema, Robótica Sustentável, Cidades Inteligentes..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    disabled={isLoadingIa}
                    className="pl-10 h-11 rounded-xl"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateWithAI()}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <button
                  type="button"
                  disabled={isLoadingIa}
                  onClick={() => setModalStep('creation_type')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={!aiTopic.trim() || isLoadingIa}
                  onClick={handleGenerateWithAI}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:brightness-105 transition-all disabled:opacity-50"
                >
                  {isLoadingIa ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Criando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Criar com IA
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP AI 2: Revisar dados gerados (edit_draft) */}
          {modalStep === 'edit_draft' && aiDraft && (
            <motion.div
              key="edit_draft"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="p-6 space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Revise os dados gerados pela IA</h3>
                    <p className="text-xs text-muted-foreground">
                      Você pode ajustar os títulos, objetivo e etapas antes de salvar o projeto.
                    </p>
                  </div>
                </div>
                <button disabled={isSubmitting} onClick={handleClose} className="p-2 rounded-xl hover:bg-accent text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setModalStep('creation_topic')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Gerar novamente
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Título do Projeto</label>
                  <Input
                    value={aiDraft.title}
                    onChange={(e) => setAiDraft({ ...aiDraft, title: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Descrição / Objetivo</label>
                  <Textarea
                    value={aiDraft.description}
                    onChange={(e) => setAiDraft({ ...aiDraft, description: e.target.value })}
                    rows={3}
                    className="rounded-xl resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Materiais Sugeridos</label>
                  <Input
                    readOnly
                    value={aiDraft.tools?.join(', ') || 'Nenhum material listado'}
                    className="h-10 rounded-xl bg-muted/30 cursor-default text-muted-foreground text-xs"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-foreground block">
                    Etapas do Projeto ({aiDraft.steps.length})
                  </label>
                  {aiDraft.steps.map((step, idx) => (
                    <div
                      key={step.position || idx}
                      className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          {step.position || idx + 1}
                        </span>
                        <Input
                          value={step.title}
                          onChange={(e) => {
                            const newSteps = [...aiDraft.steps];
                            newSteps[idx] = { ...newSteps[idx], title: e.target.value };
                            setAiDraft({ ...aiDraft, steps: newSteps });
                          }}
                          placeholder={`Nome da etapa ${idx + 1}`}
                          className="h-8 text-xs font-semibold"
                        />
                      </div>
                      <Textarea
                        value={step.description || ''}
                        onChange={(e) => {
                          const newSteps = [...aiDraft.steps];
                          newSteps[idx] = { ...newSteps[idx], description: e.target.value };
                          setAiDraft({ ...aiDraft, steps: newSteps });
                        }}
                        placeholder="Descrição da atividade..."
                        rows={2}
                        className="text-xs rounded-lg resize-none min-h-[60px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setModalStep('creation_topic')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={!aiDraft.title.trim() || isSubmitting}
                  onClick={handleSaveAiProject}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:brightness-105 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      Salvar e criar projeto
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP MANUAL 1: Nome e Descrição */}
          {modalStep === 'man_project_name' && (
            <motion.div
              key="man_project_name"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <PenLine className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Criação manual do projeto</h3>
                    <p className="text-xs text-muted-foreground">
                      Forneça um nome e uma descrição para o seu projeto.
                    </p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-2 rounded-xl hover:bg-accent text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Nome do Projeto *</label>
                  <Input
                    autoFocus
                    placeholder="Ex: Pitch Deck Maker, Carro Solar..."
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Descrição / Ideia</label>
                  <Textarea
                    placeholder="Descreva a ideia e os objetivos pedagógicos..."
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    rows={4}
                    className="rounded-xl resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setModalStep('creation_type')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={!manualTitle.trim()}
                  onClick={handleProceedToQuantity}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:brightness-105 transition-all disabled:opacity-50"
                >
                  Prosseguir
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP MANUAL 2: Quantidade de Etapas */}
          {modalStep === 'man_task_quantity' && (
            <motion.div
              key="man_task_quantity"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Configuração das etapas</h3>
                    <p className="text-xs text-muted-foreground">
                      Quantas etapas comporão o seu projeto? (de 1 a 6)
                    </p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-2 rounded-xl hover:bg-accent text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-8 flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    disabled={stepCount <= 1}
                    onClick={() => handleSetQuantity(stepCount - 1)}
                    className="w-12 h-12 rounded-2xl border border-border/70 bg-card hover:bg-accent flex items-center justify-center text-foreground font-bold text-lg disabled:opacity-40 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <div className="w-24 h-16 rounded-2xl bg-primary/10 border-2 border-primary flex items-center justify-center text-3xl font-extrabold text-primary">
                    {stepCount}
                  </div>

                  <button
                    type="button"
                    disabled={stepCount >= 6}
                    onClick={() => handleSetQuantity(stepCount + 1)}
                    className="w-12 h-12 rounded-2xl border border-border/70 bg-card hover:bg-accent flex items-center justify-center text-foreground font-bold text-lg disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">
                  Mínimo de 1 etapa e máximo de 6 etapas
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setModalStep('man_project_name')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleProceedToNaming}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:brightness-105 transition-all"
                >
                  Prosseguir
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP MANUAL 3: Nomes das Etapas */}
          {modalStep === 'man_task_naming' && (
            <motion.div
              key="man_task_naming"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="p-6 space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Nomes das etapas</h3>
                    <p className="text-xs text-muted-foreground">
                      Informe os títulos das {stepCount} etapas do seu projeto.
                    </p>
                  </div>
                </div>
                <button disabled={isSubmitting} onClick={handleClose} className="p-2 rounded-xl hover:bg-accent text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {manualSteps.map((step, idx) => (
                  <div key={step.position || idx} className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Etapa {step.position || idx + 1} *
                    </label>
                    <Input
                      autoFocus={idx === 0}
                      placeholder={`Ex: ${
                        idx === 0
                          ? 'Contextualização'
                          : idx === 1
                          ? 'Planejamento'
                          : idx === 2
                          ? 'Construção'
                          : 'Apresentação'
                      }`}
                      value={step.title}
                      onChange={(e) => {
                        const updated = [...manualSteps];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setManualSteps(updated);
                      }}
                      className="h-10 rounded-xl"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setModalStep('man_task_quantity')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={manualSteps.some((s) => !s.title.trim()) || isSubmitting}
                  onClick={handleCreateManualProject}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:brightness-105 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Criando projeto...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      Finalizar e Criar
                    </>
                  )}
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
