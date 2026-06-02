import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, User, Loader2 } from 'lucide-react';
import AuthLogo from './AuthLogo';

interface ForgotPasswordProps {
  onBack: () => void;
  onCodeSent: (email: string) => void;
}

const ForgotPassword = ({ onBack, onCodeSent }: ForgotPasswordProps) => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isUsername, setIsUsername] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const detectType = (v: string) => {
    // If contains @ it's email, otherwise username
    return !v.includes('@');
  };

  const handleChange = (v: string) => {
    setValue(v);
    setIsUsername(detectType(v));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (detectType(value)) {
        // Username → teacher notification
        setSent(true);
      } else {
        // Email → code sent
        onCodeSent(value);
      }
    }, 1500);
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full text-center"
      >
        <AuthLogo />

        <div className="w-16 h-16 rounded-full bg-warning/15 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-warning" />
        </div>

        <h1 className="text-[22px] font-semibold text-foreground mb-2">
          Solicitação enviada
        </h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Um aviso foi enviado para o seu <span className="font-medium text-foreground">professor</span>. 
          Ele irá resetar sua senha e informar a nova senha para você.
        </p>

        <button onClick={onBack} className="apple-btn-secondary">
          Voltar ao login
        </button>
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
        Esqueceu sua senha?
      </h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        Informe seu e-mail ou nome de usuário
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            {isUsername && value ? (
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            ) : (
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            )}
            <input
              ref={inputRef}
              type="text"
              placeholder="E-mail ou nome de usuário"
              className="apple-input pl-10"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
            />
          </div>
          {value && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-muted-foreground mt-2 ml-1"
            >
              {isUsername
                ? '👤 Identificado como nome de usuário (aluno)'
                : '📧 Identificado como e-mail'}
            </motion.p>
          )}
        </div>

        <button
          type="submit"
          className="apple-btn"
          disabled={!value.trim() || loading}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Continuar'}
        </button>
      </form>
    </motion.div>
  );
};

export default ForgotPassword;
