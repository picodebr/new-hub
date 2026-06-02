import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  AtSign,
  Mail,
  Calendar,
  Lock,
  HelpCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import AuthLogo from './AuthLogo';

interface RegistrationFormProps {
  onBack: () => void;
  onSubmit: () => void;
}

const removeAccents = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const generateUsername = (name: string) =>
  removeAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const TAKEN_USERNAMES = ['joao-maria', 'maria-silva'];

const RegistrationForm = ({ onBack, onSubmit }: RegistrationFormProps) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameManual, setUsernameManual] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!usernameManual && name) {
      let gen = generateUsername(name);
      let count = 0;
      while (TAKEN_USERNAMES.includes(gen + (count ? count : ''))) {
        count++;
      }
      const final = gen + (count ? count : '');
      setUsername(final);
      setUsernameAvailable(true);
    } else if (!name) {
      setUsername('');
      setUsernameAvailable(null);
    }
  }, [name, usernameManual]);

  const handleUsernameChange = (val: string) => {
    setUsernameManual(true);
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setUsername(clean);
    if (clean) {
      setUsernameAvailable(!TAKEN_USERNAMES.includes(clean));
    } else {
      setUsernameAvailable(null);
    }
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const formValid =
    name && username && usernameAvailable && email && emailValid && dob && passwordValid && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubmit();
    }, 1500);
  };

  const fields = [
    { delay: 0.1 },
    { delay: 0.15 },
    { delay: 0.2 },
    { delay: 0.25 },
    { delay: 0.3 },
    { delay: 0.35 },
  ];

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

      <h1 className="text-2xl font-semibold text-center text-foreground mb-1">Crie sua conta</h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        Preencha seus dados para continuar
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: fields[0].delay }} className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={nameRef}
            type="text"
            placeholder="Seu nome completo"
            className="apple-input pl-10"
            value={name}
            onChange={(e) => { setName(e.target.value); setUsernameManual(false); }}
          />
        </motion.div>

        {/* Username */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: fields[1].delay }} className="relative">
          <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Nome de usuário"
            className="apple-input pl-10 pr-10"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
          />
          {usernameAvailable !== null && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {usernameAvailable ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <XCircle className="w-4 h-4 text-destructive" />
              )}
            </div>
          )}
          {usernameAvailable === false && (
            <p className="text-xs text-destructive mt-1 ml-1">Nome de usuário já está em uso</p>
          )}
        </motion.div>

        {/* Email */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: fields[2].delay }} className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            placeholder="Seu e-mail"
            className={`apple-input pl-10 ${email && !emailValid ? 'input-error' : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {email && !emailValid && (
            <p className="text-xs text-destructive mt-1 ml-1">E-mail inválido</p>
          )}
        </motion.div>

        {/* DOB */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: fields[3].delay }} className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            placeholder="Data de nascimento"
            className="apple-input pl-10"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </motion.div>

        {/* Password */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: fields[4].delay }} className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Crie uma senha"
            className="apple-input pl-10 pr-16"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 bottom-full mb-2 w-56 p-3 bg-card rounded-xl shadow-lg border border-border text-xs z-20"
                >
                  <p className="font-semibold text-foreground mb-1.5">Use uma senha forte!</p>
                  <ul className="space-y-0.5 text-muted-foreground">
                    <li>• Pelo menos 8 caracteres</li>
                    <li>• Letras maiúsculas e minúsculas</li>
                    <li>• Números</li>
                    <li>• Caracteres especiais (!, @, #)</li>
                  </ul>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Confirm password */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: fields[5].delay }} className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirme sua senha"
            className={`apple-input pl-10 pr-10 ${
              confirmPassword && !passwordsMatch ? 'input-error' : ''
            }`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-destructive mt-1 ml-1">As senhas não coincidem</p>
          )}
        </motion.div>

        <button type="submit" className="apple-btn mt-4" disabled={!formValid || loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Criar conta'}
        </button>
      </form>
    </motion.div>
  );
};

export default RegistrationForm;
