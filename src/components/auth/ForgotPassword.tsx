import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, User, Check, Loader2, LifeBuoy } from 'lucide-react';
import { sendRecoveryToken } from '@/_base/services/user';
import { toast } from 'sonner';
import AuthLogo from './AuthLogo';

interface ForgotPasswordProps {
  onBack: () => void;
  onCodeSent: (identifier: string) => void;
  onSupport?: () => void;
}

type Step = 'RECOVER_BY_EMAIL' | 'RECOVER_BY_USERNAME' | 'TEACHER_SENT';

const ForgotPassword = ({ onBack, onCodeSent, onSupport }: ForgotPasswordProps) => {
  const [step, setStep] = useState<Step>('RECOVER_BY_EMAIL');
  const [value, setValue] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'RECOVER_BY_EMAIL') {
      inputRef.current?.focus();
    } else if (step === 'RECOVER_BY_USERNAME') {
      usernameInputRef.current?.focus();
    }
  }, [step]);

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = value.trim();
    if (!identifier) return;

    setLoading(true);
    try {
      await sendRecoveryToken(identifier);
      toast.success('Código de recuperação enviado!');
      onCodeSent(identifier);
    } catch (err: any) {
      console.error('Erro ao enviar token de recuperação:', err);
      const msg = err?.response?.data?.message || err?.message || 'Erro ao enviar código de recuperação.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Informe seu nome de usuário');
      return;
    }
    setStep('TEACHER_SENT');
  };

  if (step === 'TEACHER_SENT') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full text-center space-y-5"
      >
        <AuthLogo />

        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto ring-8 ring-primary/5">
          <Check className="w-8 h-8 stroke-[3]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Enviado com sucesso!</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Enviamos para o seu professor a solicitação de redefinição de senha. O professor poderá redefini-la diretamente na aba Alunos da sua turma.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="apple-btn mt-6"
        >
          Voltar para o Login
        </button>
      </motion.div>
    );
  }

  if (step === 'RECOVER_BY_USERNAME') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <button
          onClick={() => setStep('RECOVER_BY_EMAIL')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <AuthLogo />

        <h1 className="text-[22px] font-semibold text-center text-foreground mb-1">
          Recuperação por Usuário
        </h1>
        <p className="text-sm text-center text-muted-foreground mb-6">
          Informe seu nome de usuário cadastrado para solicitar a recuperação ao professor
        </p>

        <form onSubmit={handleSubmitUsername} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={usernameInputRef}
              type="text"
              placeholder="Seu nome de usuário"
              className="apple-input pl-10"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() => setStep('RECOVER_BY_EMAIL')}
              className="text-xs text-primary hover:underline font-medium cursor-pointer"
            >
              Vou informar um e-mail
            </button>
          </div>

          <button type="submit" className="apple-btn mt-2" disabled={!username.trim()}>
            Solicitar ao Professor
          </button>
        </form>

        {onSupport && (
          <div className="mt-6 pt-4 border-t border-border/60 text-center">
            <button
              type="button"
              onClick={onSupport}
              className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
            >
              <LifeBuoy className="w-3.5 h-3.5" /> Precisa de ajuda? Suporte PiCode
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <AuthLogo />

      <h1 className="text-[22px] font-semibold text-center text-foreground mb-1">
        Recuperar acesso
      </h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        Digite seu e-mail cadastrado para receber o código de recuperação
      </p>

      <form onSubmit={handleSubmitEmail} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Seu e-mail cadastrado"
            className="apple-input pl-10"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </div>

        <div className="text-right">
          <button
            type="button"
            onClick={() => setStep('RECOVER_BY_USERNAME')}
            className="text-xs text-primary hover:underline font-medium cursor-pointer"
          >
            Não tenho um e-mail cadastrado
          </button>
        </div>

        <button type="submit" className="apple-btn mt-2" disabled={loading || !value.trim()}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enviar código'}
        </button>
      </form>

      {onSupport && (
        <div className="mt-6 pt-4 border-t border-border/60 text-center">
          <button
            type="button"
            onClick={onSupport}
            className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
          >
            <LifeBuoy className="w-3.5 h-3.5" /> Precisa de ajuda? Suporte PiCode
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ForgotPassword;
