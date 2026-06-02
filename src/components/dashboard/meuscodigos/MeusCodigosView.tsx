import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Plus, Share2, MoreVertical, ArrowLeft, Calendar, Layers,
  Pencil, Trash2, Sparkles, Code2, BrainCircuit,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FolderDetailView from './FolderDetailView';
import CodeThumbnail from './CodeThumbnail';

interface Folder {
  id: string;
  name: string;
  projectCount: number;
  createdAt: string;
  gradient: string;
  codePreview: string[];
}

interface SharedProject {
  id: string;
  name: string;
  sharedBy: string;
  sharedAt: string;
  codePreview: string[];
}

const FOLDER_GRADIENTS = [
  'from-sky-400 to-blue-600',
  'from-violet-400 to-purple-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-600',
  'from-pink-400 to-rose-600',
  'from-cyan-400 to-sky-600',
];

const PLACEHOLDER_CODE = [
  '#include <Arduino.h>',
  'int LED = 13;',
  'void setup() {',
  '  pinMode(LED, OUTPUT);',
  '  Serial.begin(9600);',
  '}',
  'void loop() {',
];

const initialFolders: Folder[] = [
  {
    id: '1', name: 'Teste', projectCount: 3, createdAt: 'há 9 meses', gradient: FOLDER_GRADIENTS[0],
    codePreview: PLACEHOLDER_CODE,
  },
  {
    id: '2', name: 'Robótica 2024', projectCount: 5, createdAt: 'há 3 meses', gradient: FOLDER_GRADIENTS[1],
    codePreview: ['#include <Servo.h>', 'Servo myServo;', 'int pos = 0;', 'void setup() {', '  myServo.attach(9);', '}', 'void loop() {'],
  },
  {
    id: '3', name: 'Projetos BNCC', projectCount: 2, createdAt: 'há 1 mês', gradient: FOLDER_GRADIENTS[2],
    codePreview: ['int RED = 9;', 'int GREEN = 11;', 'void setup() {', '  pinMode(RED, OUTPUT);', '  pinMode(GREEN, OUTPUT);', '}', 'void loop() {'],
  },
];

const sharedProjects: SharedProject[] = [
  {
    id: '1', name: 'Robô Seguidor de Linha', sharedBy: 'Maria Silva', sharedAt: 'há 2 dias',
    codePreview: ['#include <Servo.h>', 'int sensor = A0;', 'void setup() {', '  pinMode(sensor, INPUT);', '  Serial.begin(9600);', '}', 'void loop() {', '  int val = analogRead(sensor);', '  Serial.println(val);', '}'],
  },
  {
    id: '2', name: 'Semáforo Inteligente', sharedBy: 'Carlos Souza', sharedAt: 'há 1 semana',
    codePreview: ['int RED = 9;', 'int YELLOW = 10;', 'int GREEN = 11;', 'void setup() {', '  pinMode(RED, OUTPUT);', '  pinMode(YELLOW, OUTPUT);', '}', 'void loop() {', '  digitalWrite(RED, HIGH);', '  delay(2000);', '}'],
  },
  {
    id: '3', name: 'Braço Mecânico', sharedBy: 'Ana Costa', sharedAt: 'há 3 semanas',
    codePreview: ['#include <Servo.h>', 'Servo base;', 'Servo arm;', 'void setup() {', '  base.attach(9);', '  arm.attach(10);', '}', 'void loop() {', '  base.write(90);', '}'],
  },
];

interface MeusCodigosViewProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
}

const MeusCodigosView = ({
  title = 'Code Lab',
  subtitle = 'Organize seus projetos em pastas',
  icon: HeaderIcon = Code2,
}: MeusCodigosViewProps = {}) => {
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showShared, setShowShared] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    setFolders(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newFolderName.trim(),
        projectCount: 0,
        createdAt: 'agora',
        gradient: FOLDER_GRADIENTS[prev.length % FOLDER_GRADIENTS.length],
        codePreview: PLACEHOLDER_CODE,
      },
    ]);
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const handleDeleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
  };

  const handleRenameFolder = (id: string) => {
    if (!editFolderName.trim()) {
      setEditingFolderId(null);
      return;
    }
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name: editFolderName.trim() } : f));
    setEditingFolderId(null);
    setEditFolderName('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <AnimatePresence mode="wait">
        {selectedFolder ? (
          <motion.div
            key="folder-detail"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <FolderDetailView
              folderName={selectedFolder.name}
              onBack={() => setSelectedFolder(null)}
            />
          </motion.div>
        ) : showShared ? (
          <motion.div
            key="shared"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowShared(false)}
                  className="rounded-2xl"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Compartilhados Comigo</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Projetos que outros compartilharam com você
                  </p>
                </div>
              </div>
            </div>

            {/* Shared cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sharedProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -4 }}
                  className="group glass-card rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer border border-border/50"
                >
                  {/* Code thumbnail */}
                  <div className="p-3 pb-2 h-36">
                    <CodeThumbnail lines={project.codePreview} />
                  </div>

                  {/* Footer info */}
                  <div className="px-4 pb-4 pt-1">
                    <h3 className="font-semibold text-foreground text-sm mb-2 truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                        {project.sharedBy.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate flex-1">
                        {project.sharedBy}
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">{project.sharedAt}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="folders"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HeaderIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {subtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowShared(true)}
                  className="rounded-2xl gap-2 border-border/60 hover:bg-accent"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhados Comigo
                </Button>
                <Button
                  onClick={() => setShowNewFolder(true)}
                  data-tour="new-folder-btn"
                  className="rounded-2xl gap-2 shadow-md shadow-primary/20"
                >
                  <Plus className="w-4 h-4" />
                  Nova Pasta
                </Button>
              </div>
            </div>

            {/* Folder cards */}
            {folders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">Nenhuma pasta ainda</p>
                <Button onClick={() => setShowNewFolder(true)} variant="outline" className="mt-4 rounded-2xl gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Primeira Pasta
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {folders.map((folder, i) => (
                  <motion.div
                    key={folder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -4 }}
                    onClick={() => editingFolderId !== folder.id && setSelectedFolder(folder)}
                    className="group relative glass-card rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer border border-border/50"
                  >
                    {/* Gradient "image" header with folder icon */}
                    <div className="p-3 pb-2 h-36">
                      <div className={`relative w-full h-full overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br ${folder.gradient}`}>
                        {/* Soft highlight */}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.35),transparent_60%)]" />
                        {/* Subtle grid pattern */}
                        <div
                          className="absolute inset-0 opacity-[0.12]"
                          style={{
                            backgroundImage:
                              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                            backgroundSize: '14px 14px',
                          }}
                        />
                        {/* Decorative oversized folder */}
                        <FolderOpen
                          className="absolute -bottom-3 -right-3 w-24 h-24 text-white/20"
                          strokeWidth={1.5}
                        />
                        {/* Centered folder icon emblem */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center ring-1 ring-white/30 shadow-lg transition-transform duration-300 group-hover:scale-110">
                            <FolderOpen className="w-7 h-7 text-white" strokeWidth={2} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Floating menu */}
                    <div className="absolute top-4 right-4" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-xl bg-background/80 backdrop-blur-md border border-border/50 opacity-0 group-hover:opacity-100 hover:bg-background transition-all">
                            <MoreVertical className="w-4 h-4 text-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl min-w-[160px]">
                          <DropdownMenuItem
                            onClick={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name); }}
                            className="gap-2 rounded-xl"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Renomear
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="gap-2 rounded-xl text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Apagar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Footer info */}
                    <div className="px-4 pb-4 pt-1">
                      {editingFolderId === folder.id ? (
                        <Input
                          autoFocus
                          value={editFolderName}
                          onChange={e => setEditFolderName(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRenameFolder(folder.id);
                            if (e.key === 'Escape') setEditingFolderId(null);
                          }}
                          onBlur={() => handleRenameFolder(folder.id)}
                          className="h-8 text-sm rounded-xl mb-2"
                        />
                      ) : (
                        <h3 className="font-semibold text-foreground text-sm mb-2 truncate group-hover:text-primary transition-colors">
                          {folder.name}
                        </h3>
                      )}
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${folder.gradient} flex items-center justify-center text-white shrink-0`}>
                          <FolderOpen className="w-3 h-3" />
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate flex-1 flex items-center gap-1.5">
                          <Layers className="w-3 h-3" />
                          {folder.projectCount} {folder.projectCount === 1 ? 'projeto' : 'projetos'}
                        </p>
                        <span className="text-[10px] text-muted-foreground/60 shrink-0">{folder.createdAt}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Folder Modal */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 ring-1 ring-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle>Nova Pasta</DialogTitle>
            <DialogDescription>
              Dê um nome para sua nova pasta de projetos
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              autoFocus
              placeholder="Ex: Robótica Avançada"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
              className="h-11 rounded-2xl bg-accent/30 border-border/60 hover:border-primary/50 focus-visible:border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
              maxLength={40}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
              className="rounded-2xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="rounded-2xl"
            >
              Criar pasta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default MeusCodigosView;
