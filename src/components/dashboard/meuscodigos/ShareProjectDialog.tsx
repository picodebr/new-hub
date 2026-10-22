import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Copy,
  Check,
  Link2,
  Users,
  GraduationCap,
  User,
  Globe,
  Lock,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { listRelatedUsers } from '@/_base/services/user';
import { shareCodeProject, updateCodeProject } from '@/_base/services/codeProject';
import { toast } from 'sonner';

interface ShareUser {
  id: string;
  name: string;
  initials: string;
  role: 'professor' | 'aluno';
  color: string;
}

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-emerald-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

interface ShareProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  targetProject?: any;
  initialIsPublished?: boolean;
  onSavePermissions?: (newPermissions: any, isPublished: boolean, privacyType?: string) => void;
}

const ShareProjectDialog = ({
  open,
  onOpenChange,
  projectName,
  targetProject,
  initialIsPublished = false,
  onSavePermissions,
}: ShareProjectDialogProps) => {
  const [users, setUsers] = useState<ShareUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  const [isPublic, setIsPublic] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'todos' | 'professor' | 'aluno'>('todos');

  // Load related users from API
  useEffect(() => {
    if (!open) return;

    let mounted = true;
    setLoadingUsers(true);

    listRelatedUsers()
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          const mapped: ShareUser[] = data.map((u: any) => {
            const displayName = u.name || u.display_name || u.username || 'Usuário';
            const roleStr = (u.role || '').toLowerCase();
            const role: 'professor' | 'aluno' = roleStr === 'teacher' || roleStr === 'master' ? 'professor' : 'aluno';
            return {
              id: u.id,
              name: displayName,
              initials: getInitials(displayName),
              role,
              color: getAvatarColor(displayName),
            };
          });
          setUsers(mapped);
        }
      })
      .catch((err) => {
        console.warn('Erro ao carregar usuários relacionados:', err);
      })
      .finally(() => {
        if (mounted) setLoadingUsers(false);
      });

    return () => {
      mounted = false;
    };
  }, [open]);

  // Sync initial selections from targetProject.share_links & privacy
  useEffect(() => {
    if (!open) return;

    const initialShareIds = (targetProject?.share_links || []).map((s: any) => s.hub_user_id || s.id);
    setSelectedUsers(initialShareIds);

    const publicStatus =
      targetProject?.privacy_type === 'public' ||
      targetProject?.isPublished ||
      initialIsPublished ||
      false;
    setIsPublic(publicStatus);
  }, [open, targetProject, initialIsPublished]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'todos' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/code/${targetProject?.folder_id || 'shared'}/${targetProject?.id || ''}`;
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSaveShare = async () => {
    if (!targetProject?.id) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    try {
      const existingIds = (targetProject?.share_links || []).map((s: any) => s.hub_user_id || s.id);
      const newUsersToShare = selectedUsers.filter((uId) => !existingIds.includes(uId));

      if (newUsersToShare.length > 0) {
        await Promise.all(
          newUsersToShare.map((uId) =>
            shareCodeProject({ hub_user_id: uId, code_project_id: targetProject.id })
          )
        );
        toast.success(`Projeto compartilhado com ${newUsersToShare.length} novo(s) usuário(s)!`);
      } else {
        toast.info('Permissões de compartilhamento salvas.');
      }

      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao compartilhar projeto:', err);
      toast.error('Erro ao salvar compartilhamento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePrivacy = async () => {
    if (!targetProject?.id) return;
    const nextPublic = !isPublic;
    setIsPublic(nextPublic);
    const nextPrivacyType = nextPublic ? 'public' : 'private';

    try {
      await updateCodeProject({
        id: targetProject.id,
        privacy_type: nextPrivacyType,
      } as any);

      if (onSavePermissions) {
        onSavePermissions(null, nextPublic, nextPrivacyType);
      }
      toast.success(
        nextPublic ? 'Projeto agora é público!' : 'Projeto agora é privado (apenas você e convidados)!'
      );
    } catch (err) {
      console.error('Erro ao alternar privacidade:', err);
      setIsPublic(!nextPublic);
      toast.error('Erro ao alterar privacidade do projeto');
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setSearch('');
      setActiveTab('users');
      setLinkCopied(false);
      setRoleFilter('todos');
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden glass-card border-border/50">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-bold text-foreground">Compartilhar Projeto</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {projectName}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pb-6 mt-2">
          <TabsList className="w-full rounded-2xl bg-muted/50 p-1 mb-4">
            <TabsTrigger value="users" className="flex-1 rounded-xl gap-2 text-xs">
              <Users className="w-3.5 h-3.5" />
              Usuários ({selectedUsers.length})
            </TabsTrigger>
            <TabsTrigger value="link" className="flex-1 rounded-xl gap-2 text-xs">
              <Link2 className="w-3.5 h-3.5" />
              Privacidade & Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-0 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-2xl text-xs"
              />
            </div>

            {/* Role filter */}
            <div className="flex gap-2">
              {([
                { key: 'todos', label: 'Todos', icon: Users },
                { key: 'professor', label: 'Professores', icon: GraduationCap },
                { key: 'aluno', label: 'Alunos', icon: User },
              ] as const).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setRoleFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    roleFilter === f.key
                      ? 'bg-primary text-primary-foreground font-semibold'
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
              const filteredIds = filteredUsers.map((u) => u.id);
              const allSelected = filteredIds.every((id) => selectedUsers.includes(id));
              const toggleAll = () => {
                setSelectedUsers((prev) =>
                  allSelected
                    ? prev.filter((id) => !filteredIds.includes(id))
                    : Array.from(new Set([...prev, ...filteredIds]))
                );
              };
              return (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                >
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                      allSelected ? 'bg-primary border-primary' : 'border-border'
                    }`}
                  >
                    {allSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                  </div>
                  {allSelected ? 'Desmarcar todos' : 'Selecionar todos os resultados'}
                </button>
              );
            })()}

            {/* User list */}
            <div className="h-56 overflow-y-auto p-1 space-y-1.5 pr-1">
              {loadingUsers ? (
                <div className="flex items-center justify-center h-full py-10 gap-2 text-muted-foreground text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Carregando usuários...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-12">
                  Nenhum usuário encontrado
                </p>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUsers.includes(user.id);
                  const isAlreadyShared = (targetProject?.share_links || []).some(
                    (s: any) => (s.hub_user_id || s.id) === user.id
                  );

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleUser(user.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-colors text-left ${
                        isSelected
                          ? 'bg-primary/10 ring-1 ring-primary/30'
                          : 'hover:bg-accent/50'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl ${user.color} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}
                      >
                        {user.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                        {isAlreadyShared && (
                          <span className="text-[10px] text-primary font-medium">Já compartilhado</span>
                        )}
                      </div>
                      <Badge variant="secondary" className="rounded-lg text-[10px] capitalize">
                        {user.role}
                      </Badge>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-primary border-primary' : 'border-border'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Confirm buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <p className="text-xs text-muted-foreground">
                {selectedUsers.length} selecionado(s)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleClose(false)}
                  className="rounded-2xl text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveShare}
                  disabled={isSaving}
                  className="rounded-2xl text-xs gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="link" className="mt-0 space-y-4">
            {/* Privacy toggle card */}
            <div className="p-4 rounded-2xl border border-border/50 bg-card/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isPublic ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isPublic ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {isPublic ? 'Projeto Público' : 'Projeto Privado'}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {isPublic
                      ? 'Qualquer pessoa com o link pode visualizar este projeto.'
                      : 'Apenas você e usuários com quem compartilhou podem ver.'}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant={isPublic ? 'default' : 'outline'}
                onClick={handleTogglePrivacy}
                className="rounded-xl text-xs"
              >
                {isPublic ? 'Tornar Privado' : 'Tornar Público'}
              </Button>
            </div>

            {/* Link box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Link do Projeto</label>
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-accent/40 border border-border/50">
                <Input
                  readOnly
                  value={`${window.location.origin}/code/${targetProject?.folder_id || 'shared'}/${targetProject?.id || ''}`}
                  className="border-0 bg-transparent text-xs h-8 focus-visible:ring-0"
                />
                <Button
                  size="sm"
                  onClick={handleCopyLink}
                  className="rounded-xl gap-1.5 shrink-0 text-xs"
                >
                  {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {linkCopied ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => handleClose(false)} className="rounded-2xl text-xs">
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
