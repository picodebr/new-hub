import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';
import AuthLogo from './AuthLogo';

interface LoginFormProps {
  onSignUp: () => void;
  onForgotPassword: () => void;
}

const LoginForm = ({ onSignUp, onForgotPassword }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { login } = useUser();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      login(email);
      navigate('/dashboard');
    }, 700);
  };

  const quickLogin = (identifier: string) => {
    setEmail(identifier);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      login(identifier);
      navigate('/dashboard');
    }, 300);
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
      <h1 className="text-xl font-semibold text-center text-foreground mb-1">
        Entrar na sua conta
      </h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        Ainda não tem conta?{' '}
        <button onClick={onSignUp} className="link-animated text-primary font-medium cursor-pointer">
          Cadastre-se
        </button>
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={emailRef}
            type="text"
            placeholder="E-mail ou usuário"
            className="apple-input pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Senha"
            className="apple-input pl-10 pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${
                rememberMe ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform duration-200 ${
                  rememberMe ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-muted-foreground">Manter conectado</span>
          </label>
          <button type="button" className="link-animated text-xs" onClick={onForgotPassword}>
            Esqueceu sua senha?
          </button>
        </div>

        <button type="submit" className="apple-btn mt-4" disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Entrar'}
        </button>
      </form>

      {/* Dev: quick role login */}
      <div className="mt-5 pt-4 border-t border-border/60">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80 text-center mb-2 font-semibold">
          Acesso rápido (dev)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => quickLogin('prof@picode')}
            disabled={loading}
            className="text-xs font-medium px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
          >
            Entrar como Professor
          </button>
          <button
            type="button"
            onClick={() => quickLogin('aluno@picode')}
            disabled={loading}
            className="text-xs font-medium px-3 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Entrar como Aluno
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginForm;
