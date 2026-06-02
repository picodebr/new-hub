import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, MoreVertical, Pencil, Trash2, Share2, Code2, Sparkles, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ShareProjectDialog from './ShareProjectDialog';
import CodeThumbnail from './CodeThumbnail';

interface Project {
  id: string;
  name: string;
  createdAt: string;
  codePreview: string[];
  isPublished?: boolean;
}

interface FolderDetailViewProps {
  folderName: string;
  onBack: () => void;
}

const initialProjects: Project[] = [
  {
    id: '1',
    name: 'Projeto Moisés',
    createdAt: 'há 9 meses',
    codePreview: [
      '#include <Arduino.h>',
      'int LED = 13;',
      'void setup() {',
      '  pinMode(LED, OUTPUT);',
      '  Serial.begin(9600);',
      '}',
      'void loop() {',
      '  digitalWrite(LED, HIGH);',
      '  delay(1000);',
      '}',
    ],
  },
  {
    id: '2',
    name: 'Teste 2',
    createdAt: 'há um ano',
    codePreview: [
      '#include <Servo.h>',
      'Servo myServo;',
      'int pos = 0;',
      'void setup() {',
      '  myServo.attach(9);',
      '}',
      'void loop() {',
      '  myServo.write(90);',
      '  delay(500);',
      '}',
    ],
  },
  {
    id: '3',
    name: 'Anderson',
    createdAt: 'há um ano',
    codePreview: [
      '// Sensor analógico',
      'int sensorVal = 0;',
      'int LED = 9;',
      'void setup() {',
      '  pinMode(A0, INPUT);',
      '  pinMode(LED, OUTPUT);',
      '}',
      'void loop() {',
      '  sensorVal = analogRead(A0);',
      '  analogWrite(LED, sensorVal / 4);',
      '}',
    ],
  },
];

const FolderDetailView = ({ folderName, onBack }: FolderDetailViewProps) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [shareProject, setShareProject] = useState<Project | null>(null);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    setProjects(prev => [
      {
        id: Date.now().toString(),
        name: newProjectName.trim(),
        createdAt: 'agora',
        codePreview: ['// Novo projeto', 'void setup() {', '  ', '}', 'void loop() {', '  ', '}'],
      },
      ...prev,
    ]);
    setNewProjectName('');
    setShowNewProject(false);
  };

  const handleDelete = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleRename = (id: string) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name: editName.trim() } : p));
    setEditingId(null);
    setEditName('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-2xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{folderName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {projects.length} {projects.length === 1 ? 'projeto' : 'projetos'}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowNewProject(true)} className="rounded-2xl gap-2 shadow-md shadow-primary/20">
          <Plus className="w-4 h-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Project cards */}
      {projects.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Code2 className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground">Nenhum projeto nesta pasta</p>
          <Button onClick={() => setShowNewProject(true)} variant="outline" className="mt-4 rounded-2xl gap-2">
            <Plus className="w-4 h-4" />
            Criar Primeiro Projeto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="group glass-card rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer border border-border/50"
            >
              {/* Code thumbnail */}
              <div className="p-3 pb-2 h-40">
                <CodeThumbnail lines={project.codePreview} />
              </div>

              {/* Info */}
              <div className="px-4 pb-4 pt-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {editingId === project.id ? (
                      <Input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRename(project.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onBlur={() => handleRename(project.id)}
                        className="h-7 text-sm rounded-xl px-2"
                      />
                    ) : (
                      <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-accent transition-all shrink-0">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl min-w-[160px]">
                      <DropdownMenuItem
                        onClick={() => { setEditingId(project.id); setEditName(project.name); }}
                        className="gap-2 rounded-xl"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Renomear
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShareProject(project)}
                        className="gap-2 rounded-xl"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Compartilhar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(project.id)}
                        className="gap-2 rounded-xl text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Apagar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground/70 truncate">{project.createdAt}</p>
                  {(() => {
                    const isPrivate = !!project.isPublished;
                    return (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          isPrivate
                            ? 'bg-foreground/10 text-foreground border-foreground/20'
                            : 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400'
                        }`}
                        title={isPrivate ? 'Projeto publicado — visível apenas para você' : 'Projeto público — visível para todos'}
                      >
                        {isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                        {isPrivate ? 'PRIVADO' : 'PÚBLICO'}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Project Dialog */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 ring-1 ring-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle>Novo Projeto</DialogTitle>
            <DialogDescription>Dê um nome para o seu novo projeto</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              autoFocus
              placeholder="Ex: Robô Seguidor"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
              className="h-11 rounded-2xl bg-accent/30 border-border/60 hover:border-primary/50 focus-visible:border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
              maxLength={40}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setShowNewProject(false); setNewProjectName(''); }} className="rounded-2xl">
              Cancelar
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()} className="rounded-2xl">
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <ShareProjectDialog
        open={!!shareProject}
        onOpenChange={(val) => { if (!val) setShareProject(null); }}
        projectName={shareProject?.name ?? ''}
      />
    </motion.div>
  );
};

export default FolderDetailView;
