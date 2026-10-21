import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Lock, Eye, EyeOff, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { redefinePassword } from '@/_base/services/user';
import { toast } from 'sonner';

interface RedefinePasswordDialogProps {
  open: boolean;
  userName?: string;
  onSuccess: () => void;
}

export const RedefinePasswordDialog: React.FC<RedefinePasswordDialogProps> = ({ open, userName, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMinLength = password.length >= 6;
  const isMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = isMinLength && isMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      await redefinePassword(password);
      toast.success('Senha redefinida com sucesso!');
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Falha ao redefinir a senha';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="glass-card max-w-md border-border/50 p-6 sm:rounded-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Olá, {userName?.split(' ')[0] || 'Usuário'}!
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Este é o seu primeiro acesso. Por segurança, crie uma nova senha para a sua conta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo de 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="apple-input pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repita sua nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="apple-input pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Validações visuais */}
          <div className="rounded-xl border border-border/50 bg-card/40 p-3 space-y-1.5 text-xs text-muted-foreground">
            <div className={`flex items-center gap-2 ${isMinLength ? 'text-emerald-500 font-medium' : ''}`}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Pelo menos 6 caracteres</span>
            </div>
            <div className={`flex items-center gap-2 ${isMatch ? 'text-emerald-500 font-medium' : ''}`}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>As senhas coincidem</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="apple-btn w-full mt-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Salvar Nova Senha'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
