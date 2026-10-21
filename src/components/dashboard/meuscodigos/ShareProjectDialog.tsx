import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Copy, Check, Link2, Users, GraduationCap, User } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ShareUser {
  id: string;
  name: string;
  initials: string;
  role: 'professor' | 'aluno';
  color: string;
}

const mockUsers: ShareUser[] = [
  { id: '1', name: 'Professor Picode', initials: 'PP', role: 'professor', color: 'bg-green-500' },
  { id: '2', name: 'Prof Picode', initials: 'PP', role: 'professor', color: 'bg-emerald-500' },
  { id: '3', name: 'Milena Picode', initials: 'MP', role: 'aluno', color: 'bg-purple-500' },
  { id: '4', name: 'Rafaela Suffi', initials: 'RS', role: 'aluno', color: 'bg-blue-500' },
  { id: '5', name: 'Moises Picode', initials: 'MP', role: 'aluno', color: 'bg-teal-500' },
  { id: '6', name: 'Carlos Silva', initials: 'CS', role: 'aluno', color: 'bg-orange-500' },
  { id: '7', name: 'Ana Costa', initials: 'AC', role: 'aluno', color: 'bg-pink-500' },
];

interface ShareProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  initialIsPublished?: boolean;
  onSavePermissions?: (newPermissions: any, isPublished: boolean) => void;
}

const ShareProjectDialog = ({ open, onOpenChange, projectName }: ShareProjectDialogProps) => {
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'todos' | 'professor' | 'aluno'>('todos');

  const filteredUsers = mockUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'todos' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const toggleUser = (id: string) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleGenerateLink = () => {
    setLinkGenerated(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://picode.app/share/${Date.now()}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setSearch('');
      setSelectedUsers([]);
      setActiveTab('users');
      setLinkGenerated(false);
      setLinkCopied(false);
      setRoleFilter('todos');
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg">Compartilhar Projeto</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {projectName}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pb-6">
          <TabsList className="w-full rounded-2xl bg-muted/50 p-1 mb-4">
            <TabsTrigger value="users" className="flex-1 rounded-xl gap-2 text-xs">
              <Users className="w-3.5 h-3.5" />
              Compartilhar com Usuários
            </TabsTrigger>
            <TabsTrigger value="link" className="flex-1 rounded-xl gap-2 text-xs">
              <Link2 className="w-3.5 h-3.5" />
              Publicar Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-0 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 rounded-2xl"
              />
            </div>

            {/* Role filter */}
            <div className="flex gap-2">
              {([
                { key: 'todos', label: 'Todos', icon: Users },
                { key: 'professor', label: 'Professores', icon: GraduationCap },
                { key: 'aluno', label: 'Alunos', icon: User },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setRoleFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    roleFilter === f.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <f.icon className="w-3 h-3" />
                  {f.label}
                </button>
              ))}
            </div>

            {/* Select all */}
            {filteredUsers.length > 0 && (() => {
              const filteredIds = filteredUsers.map(u => u.id);
              const allSelected = filteredIds.every(id => selectedUsers.includes(id));
              const toggleAll = () => {
                setSelectedUsers(prev =>
                  allSelected
                    ? prev.filter(id => !filteredIds.includes(id))
                    : Array.from(new Set([...prev, ...filteredIds]))
                );
              };
              return (
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                >
                  <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-colors ${
                    allSelected ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                    {allSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                  </div>
                  {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
              );
            })()}

            {/* User list */}
            <div className="h-56 overflow-y-auto p-1">
              <motion.div
                key={roleFilter}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-1.5"
              >
                {filteredUsers.map((user) => {
                  const isSelected = selectedUsers.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-colors duration-150 ${
                        isSelected
                          ? 'bg-primary/10 ring-1 ring-primary/30'
                          : 'hover:bg-accent/50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl ${user.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {user.initials}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                      </div>
                      <Badge variant="secondary" className="rounded-lg text-[10px] capitalize">
                        {user.role}
                      </Badge>
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors duration-150 ${
                        isSelected ? 'bg-primary border-primary' : 'border-border'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </button>
                  );
                })}
              </motion.div>
              {filteredUsers.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nenhum usuário encontrado
                </p>
              )}
            </div>

            {/* Confirm */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {selectedUsers.length} selecionado(s)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleClose(false)} className="rounded-2xl">
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleClose(false)}
                  disabled={selectedUsers.length === 0}
                  className="rounded-2xl"
                >
                  Compartilhar
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="link" className="mt-0 space-y-4">
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Publicar Projeto</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Gere um link público para que qualquer pessoa possa acessar seu projeto
              </p>
            </div>

            {!linkGenerated ? (
              <Button onClick={handleGenerateLink} className="w-full rounded-2xl gap-2">
                <Link2 className="w-4 h-4" />
                Gerar Link Público
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-muted/50 border border-border/50">
                  <Input
                    readOnly
                    value={`https://picode.app/share/${Date.now().toString(36)}`}
                    className="border-0 bg-transparent text-xs h-8 focus-visible:ring-0"
                  />
                  <Button
                    size="sm"
                    onClick={handleCopyLink}
                    className="rounded-xl gap-1.5 shrink-0"
                  >
                    {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {linkCopied ? 'Copiado!' : 'Copiar'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Qualquer pessoa com este link poderá visualizar seu projeto
                </p>
              </motion.div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => handleClose(false)} className="rounded-2xl">
                Fechar
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ShareProjectDialog;
