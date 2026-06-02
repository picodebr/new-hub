import { useState, useRef, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Settings, Moon, Sun, Pencil, Check, User, Mail, Camera, BookOpen, FileText, X } from 'lucide-react';

interface Props {
  isDark: boolean;
  onToggleTheme: () => void;
}

const AccountSettings = ({ isDark, onToggleTheme }: Props) => {
  const [name, setName] = useState('João Ênfáse');
  const [email, setEmail] = useState('ana@picode.com.br');
  const [bio, setBio] = useState('Apaixonado por tecnologia e educação maker.');
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>(['Robótica', 'Programação']);
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [showDisciplines, setShowDisciplines] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>, close: () => void) => {
    if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); close(); }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setAvatarUrl(ev.target.result as string);
    };
    reader.readAsDataURL(file);
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

      <div className="space-y-3">
        {/* Foto de perfil */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Camera className="h-3 w-3" /> Foto de Perfil
          </label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary/20">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-primary">J</span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110"
              >
                <Camera className="h-3 w-3" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              Alterar foto
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
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => handleKey(e, () => setEditingName(false))}
                autoFocus
                className="apple-input flex-1 text-sm"
              />
            ) : (
              <div className="apple-input flex flex-1 items-center text-sm">{name}</div>
            )}
            <button
              onClick={() => setEditingName(!editingName)}
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
                onBlur={() => setEditingEmail(false)}
                onKeyDown={(e) => handleKey(e, () => setEditingEmail(false))}
                autoFocus
                className="apple-input flex-1 text-sm"
              />
            ) : (
              <div className="apple-input flex flex-1 items-center text-sm">{email}</div>
            )}
            <button
              onClick={() => setEditingEmail(!editingEmail)}
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
                onBlur={() => setEditingBio(false)}
                autoFocus
                className="apple-input min-h-[60px] w-full flex-1 resize-none text-sm"
              />
            ) : (
              <div className="apple-input flex flex-1 items-center text-sm text-foreground">{bio}</div>
            )}
            <button
              onClick={() => setEditingBio(!editingBio)}
              className="mt-1 rounded-xl p-2.5 transition-colors hover:bg-accent"
              aria-label={editingBio ? 'Salvar biografia' : 'Editar biografia'}
            >
              {editingBio ? <Check className="h-4 w-4 text-primary" /> : <Pencil className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* Disciplinas */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <BookOpen className="h-3 w-3" /> Disciplinas que leciono
          </label>

          {/* Tags selecionadas */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedDisciplines.map((d) => (
              <span
                key={d}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {d}
                <button onClick={() => setSelectedDisciplines((prev) => prev.filter((x) => x !== d))} className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-primary/20">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => setShowDisciplines(!showDisciplines)}
              className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent"
            >
              + Adicionar
            </button>
          </div>

          {/* Seletor de disciplinas */}
          {showDisciplines && (
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/30 bg-accent/30 p-3">
              {['Matemática', 'Português', 'História', 'Geografia', 'Ciências', 'Física', 'Química', 'Biologia', 'Inglês', 'Educação Física', 'Artes', 'Robótica', 'Programação', 'Informática', 'Filosofia', 'Sociologia'].map((d) => {
                const isSelected = selectedDisciplines.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() =>
                      setSelectedDisciplines((prev) =>
                        isSelected ? prev.filter((x) => x !== d) : [...prev, d]
                      )
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-card border border-border/50 text-foreground hover:bg-accent'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AccountSettings;
