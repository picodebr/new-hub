import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, HelpCircle, Check, X } from 'lucide-react';
import AuthLogo from './AuthLogo';

interface NewPasswordProps {
  onSuccess: () => void;
}

const NewPassword = ({ onSuccess }: NewPasswordProps) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const rules = [
    { label: 'Pelo menos 8 caracteres', met: password.length >= 8 },
    { label: 'Letra maiúscula', met: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', met: /[a-z]/.test(password) },
    { label: 'Um número', met: /\d/.test(password) },
    { label: 'Caractere especial (!@#$)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const allRulesMet = rules.every((r) => r.met);
  const passwordsMatch = password === confirm && confirm.length > 0;
  const canSubmit = allRulesMet && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <AuthLogo />

      <h1 className="text-[22px] font-semibold text-center text-foreground mb-1">
        Crie uma nova senha
      </h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        Escolha uma senha segura para sua conta
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* New password */}
        <div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nova senha"
              className="apple-input pl-10 pr-16"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onTouchStart={() => setShowTooltip(!showTooltip)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 top-full mt-2 w-64 p-3 rounded-xl bg-card border border-border shadow-lg z-20"
              >
                <p className="text-xs font-semibold text-foreground mb-2">Use uma senha forte!</p>
                {rules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs mb-1">
                    {rule.met ? (
                      <Check className="w-3 h-3 text-success shrink-0" />
                    ) : (
                      <X className="w-3 h-3 text-muted-foreground shrink-0" />
                    )}
                    <span className={rule.met ? 'text-success' : 'text-muted-foreground'}>{rule.label}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Password strength indicators inline */}
          {password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 space-y-1 ml-1"
            >
              {rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  {rule.met ? (
                    <Check className="w-3 h-3 text-success shrink-0" />
                  ) : (
                    <X className="w-3 h-3 text-destructive shrink-0" />
                  )}
                  <span className={rule.met ? 'text-success' : 'text-muted-foreground'}>{rule.label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirme a nova senha"
              className={`apple-input pl-10 pr-10 ${
                confirm && !passwordsMatch ? 'input-error' : ''
              }`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirm && !passwordsMatch && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive mt-1.5 ml-1"
            >
              As senhas não coincidem
            </motion.p>
          )}
          {passwordsMatch && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-success mt-1.5 ml-1 flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Senhas coincidem
            </motion.p>
          )}
        </div>

        <button type="submit" className="apple-btn mt-4" disabled={!canSubmit || loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Redefinir senha'}
        </button>
      </form>
    </motion.div>
  );
};

export default NewPassword;
