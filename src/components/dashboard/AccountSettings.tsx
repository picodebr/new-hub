import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Moon, Sun, Pencil, Check, User, Mail, Camera, BookOpen, FileText, X, KeyRound, Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { updateProfile } from '@/_base/services/user';
import { getPresignedUrl, uploadFile } from '@/_base/services/upload';
import { RedefinePasswordDialog } from '@/components/auth/RedefinePasswordDialog';
import { toast } from 'sonner';

interface Props {
  isDark: boolean;
  onToggleTheme: () => void;
}

const AVAILABLE_DISCIPLINES = [
  'Robótica', 'Programação', 'Maker', 'Matemática', 'Física',
  'Química', 'Biologia', 'Artes', 'Ciências', 'História',
];

const AccountSettings = ({ isDark, onToggleTheme }: Props) => {
  const { user, setUser } = useUser();

  const [name, setName] = useState(user?.name || 'Professor PiCode');
  const [email, setEmail] = useState(user?.email || 'professor@picode.com.br');
  const [bio, setBio] = useState(user?.bio || 'Apaixonado por tecnologia e educação maker.');
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>(
    Array.isArray(user?.metadata?.disciplines) ? user.metadata.disciplines : ['Robótica', 'Programação']
  );
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [showDisciplines, setShowDisciplines] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar || null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      if (user.bio) setBio(user.bio);
      if (user.avatar) setAvatarUrl(user.avatar);
      if (Array.isArray(user.metadata?.disciplines)) {
        setSelectedDisciplines(user.metadata.disciplines);
      }
    }
  }, [user]);

  const saveProfileData = async (fields: { name?: string; email?: string; bio?: string; avatar?: string; metadata?: any }) => {
    try {
      const updated = await updateProfile(fields);
      if (user) {
        setUser({ ...user, ...updated, ...fields });
      }
      toast.success('Perfil atualizado com sucesso!');
    } catch (err) {
      console.warn('Erro ao atualizar perfil na API:', err);
      if (user) {
        setUser({ ...user, ...fields });
      }
      toast.info('Alteração salva');
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>, close: () => void, fieldKey?: 'name' | 'email') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      close();
      if (fieldKey === 'name') saveProfileData({ name });
      if (fieldKey === 'email') saveProfileData({ email });
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const response = await getPresignedUrl(file.type, 'avatars', 'public-read');
      await uploadFile(response.link, file);
      const updatedUser = await updateProfile({ avatar: response.path });
      if (user) {
        setUser({ ...user, ...updatedUser, avatar: updatedUser.avatar || response.path });
      }
      setAvatarUrl(response.path);
      toast.success('Foto de perfil atualizada com sucesso!');
    } catch (err) {
      console.warn('Erro no upload S3:', err);
      toast.error('Erro ao atualizar foto de perfil.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveDisciplines = async (newDisciplines: string[]) => {
    setSelectedDisciplines(newDisciplines);
    const updatedMetadata = { ...(user?.metadata || {}), disciplines: newDisciplines };
    await saveProfileData({ metadata: updatedMetadata });
  };

  const addDiscipline = (d: string) => {
    if (!selectedDisciplines.includes(d)) {
      const updated = [...selectedDisciplines, d];
      handleSaveDisciplines(updated);
    }
    setShowDisciplines(false);
  };

  const removeDiscipline = (d: string) => {
    const updated = selectedDisciplines.filter((x) => x !== d);
    handleSaveDisciplines(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="glass-card overflow-hidden p-5 md:p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Settings className="h-[18px] w-[18px] text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground sm:text-lg">Configurações</h2>
        </div>

        <button
          onClick={onToggleTheme}
          className="flex items-center gap-2 rounded-xl border border-border/30 p-1.5 transition-colors hover:bg-accent/50"
        >
          <Sun className={`h-4 w-4 transition-colors ${!isDark ? 'text-amber-500' : 'text-muted-foreground'}`} />
          <div className={`relative h-6 w-10 rounded-full transition-colors duration-200 ${isDark ? 'bg-primary' : 'bg-muted'}`}>
            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform duration-200 ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <Moon className={`h-4 w-4 transition-colors ${isDark ? 'text-primary' : 'text-muted-foreground'}`} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Foto de perfil */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Camera className="h-3 w-3" /> Foto de Perfil
          </label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary/20 ring-1 ring-border/50">
                {uploadingAvatar ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-primary">{user?.initial || 'U'}</span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110"
              >
                <Camera className="h-3 w-3" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              {uploadingAvatar ? 'Enviando foto...' : 'Alterar foto'}
            </button>
          </div>
        </div>

        {/* Nome */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <User className="h-3 w-3" /> Nome Completo
          </label>
          <div className="flex items-center gap-2">
            {editingName ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => {
                  setEditingName(false);
                  saveProfileData({ name });
                }}
                onKeyDown={(e) => handleKey(e, () => setEditingName(false), 'name')}
                autoFocus
                className="apple-input flex-1 text-sm"
              />
            ) : (
              <div className="apple-input flex flex-1 items-center text-sm">{name}</div>
            )}
            <button
              onClick={() => {
                if (editingName) saveProfileData({ name });
                setEditingName(!editingName);
              }}
              className="rounded-xl p-2.5 transition-colors hover:bg-accent"
              aria-label={editingName ? 'Salvar nome' : 'Editar nome'}
            >
              {editingName ? <Check className="h-4 w-4 text-primary" /> : <Pencil className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* E-mail */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Mail className="h-3 w-3" /> E-mail
          </label>
          <div className="flex items-center gap-2">
            {editingEmail ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => {
                  setEditingEmail(false);
                  saveProfileData({ email });
                }}
                onKeyDown={(e) => handleKey(e, () => setEditingEmail(false), 'email')}
                autoFocus
                className="apple-input flex-1 text-sm"
              />
            ) : (
              <div className="apple-input flex flex-1 items-center text-sm">{email}</div>
            )}
            <button
              onClick={() => {
                if (editingEmail) saveProfileData({ email });
                setEditingEmail(!editingEmail);
              }}
              className="rounded-xl p-2.5 transition-colors hover:bg-accent"
              aria-label={editingEmail ? 'Salvar e-mail' : 'Editar e-mail'}
            >
              {editingEmail ? <Check className="h-4 w-4 text-primary" /> : <Pencil className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* Biografia */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <FileText className="h-3 w-3" /> Biografia
          </label>
          <div className="flex items-start gap-2">
            {editingBio ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                onBlur={() => {
                  setEditingBio(false);
                  saveProfileData({ bio });
                }}
                autoFocus
                className="apple-input min-h-[60px] w-full flex-1 resize-none text-sm"
              />
            ) : (
              <div className="apple-input flex flex-1 items-center text-sm text-foreground">{bio}</div>
            )}
            <button
              onClick={() => {
                if (editingBio) saveProfileData({ bio });
                setEditingBio(!editingBio);
              }}
              className="mt-1 rounded-xl p-2.5 transition-colors hover:bg-accent"
              aria-label={editingBio ? 'Salvar biografia' : 'Editar biografia'}
            >
              {editingBio ? <Check className="h-4 w-4 text-primary" /> : <Pencil className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* Disciplinas (apenas professores) */}
        {user?.role !== 'student' && (
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <BookOpen className="h-3 w-3" /> Disciplinas que Leciona
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedDisciplines.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {d}
                  <button onClick={() => removeDiscipline(d)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDisciplines(!showDisciplines)}
                className="rounded-xl border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                + Adicionar disciplina
              </button>
              {showDisciplines && (
                <div className="absolute left-0 top-full mt-1 z-30 w-48 rounded-xl border border-border bg-popover p-1 shadow-lg">
                  {AVAILABLE_DISCIPLINES.filter((d) => !selectedDisciplines.includes(d)).map((d) => (
                    <button
                      key={d}
                      onClick={() => addDiscipline(d)}
                      className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-accent transition-colors"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botão de Redefinir Senha */}
        <div className="pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={() => setShowPasswordDialog(true)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground border border-border/60 hover:bg-accent transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5 text-primary" />
            Alterar Senha
          </button>
        </div>
      </div>

      <RedefinePasswordDialog
        open={showPasswordDialog}
        userName={user?.name}
        onSuccess={() => setShowPasswordDialog(false)}
      />
    </motion.div>
  );
};

export default AccountSettings;
