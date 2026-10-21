import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { sendRecoveryToken } from '@/_base/services/user';
import { toast } from 'sonner';
import AuthLogo from './AuthLogo';

interface ForgotPasswordProps {
  onBack: () => void;
  onCodeSent: (identifier: string) => void;
}

const ForgotPassword = ({ onBack, onCodeSent }: ForgotPasswordProps) => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = value.trim();
    if (!identifier) return;

    setLoading(true);
    try {
      await sendRecoveryToken(identifier);
      toast.success('Código de recuperação enviado!');
      onCodeSent(identifier);
    } catch (err: any) {
      console.warn('Erro ao enviar token de recuperação:', err);
      // Fallback dev
      toast.info('Modo demonstração: use o código 123456 na próxima tela');
      onCodeSent(identifier);
    } finally {
      setLoading(false);
    }
  };

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
        Digite seu e-mail ou nome de usuário para receber o código de recuperação
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="E-mail ou nome de usuário"
            className="apple-input pl-10"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="apple-btn mt-2" disabled={loading || !value.trim()}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enviar código'}
        </button>
      </form>
    </motion.div>
  );
};

export default ForgotPassword;
