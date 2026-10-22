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
import { signup, checkUsername, checkEmail } from '@/_base/services/user';
import { toast } from 'sonner';
import AuthLogo from './AuthLogo';

interface RegistrationFormProps {
  profile?: 'student' | 'teacher';
  primaryCode?: string;
  schoolCodes?: string[];
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

const RegistrationForm = ({
  profile = 'student',
  primaryCode = '1234',
  schoolCodes = [],
  onBack,
  onSubmit,
}: RegistrationFormProps) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameManual, setUsernameManual] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
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

  // Geração e checagem automática de username
  useEffect(() => {
    if (!usernameManual && name.length >= 3) {
      const gen = generateUsername(name);
      setUsername(gen);
      checkUsername(gen)
        .then((res: any) => setUsernameAvailable(res.is_available ?? res.is_valid ?? true))
        .catch(() => setUsernameAvailable(true));
    } else if (!name) {
      setUsername('');
      setUsernameAvailable(null);
    }
  }, [name, usernameManual]);

  const handleUsernameChange = (val: string) => {
    setUsernameManual(true);
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setUsername(clean);
    if (clean.length >= 3) {
      checkUsername(clean)
        .then((res: any) => setUsernameAvailable(res.is_available ?? res.is_valid ?? true))
        .catch(() => setUsernameAvailable(true));
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (valid) {
      checkEmail(val)
        .then((res: any) => setEmailAvailable(res.is_available ?? res.is_valid ?? true))
        .catch(() => setEmailAvailable(true));
    } else {
      setEmailAvailable(null);
    }
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const formValid =
    name &&
    username &&
    usernameAvailable !== false &&
    email &&
    emailValid &&
    emailAvailable !== false &&
    dob &&
    passwordValid &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;

    setLoading(true);
    try {
      await signup({
        name,
        username,
        email,
        birthdate: new Date(dob),
        password,
        password_confirmation: confirmPassword,
        user_type: profile,
        primary_code: primaryCode,
        school_codes: schoolCodes,
      });
      toast.success('Conta criada com sucesso!');
      onSubmit();
    } catch (err: any) {
      console.warn('Erro ao criar conta via API:', err);
      const msg = err?.response?.data?.message || err?.message || 'Erro ao realizar cadastro';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
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

      <h1 className="text-[22px] font-semibold text-center text-foreground mb-1">
        Crie sua conta
      </h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        Preencha os campos abaixo para concluir seu cadastro
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: fields[0].delay }} className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={nameRef}
            type="text"
            placeholder="Nome completo"
            className="apple-input pl-10"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </motion.div>

        {/* Username */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: fields[1].delay }}>
          <div className="relative">
            <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Nome de usuário"
              className="apple-input pl-10 pr-10"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              required
            />
            {usernameAvailable !== null && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                {usernameAvailable ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
              </div>
            )}
          </div>
          {usernameAvailable === false && (
            <p className="text-xs text-destructive mt-1 ml-1">Este nome de usuário já está em uso</p>
          )}
        </motion.div>

        {/* Email */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: fields[2].delay }}>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="E-mail"
              className="apple-input pl-10 pr-10"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
            />
            {emailAvailable !== null && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                {emailAvailable ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
              </div>
            )}
          </div>
          {email && !emailValid && (
            <p className="text-xs text-destructive mt-1 ml-1">Formato de e-mail inválido</p>
          )}
        </motion.div>

        {/* DOB */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: fields[3].delay }} className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            className="apple-input pl-10 text-muted-foreground focus:text-foreground"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
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
            required
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
                  <p className="font-semibold text-foreground mb-1.5">Use uma senha segura!</p>
                  <ul className="space-y-0.5 text-muted-foreground">
                    <li>• Pelo menos 6 caracteres</li>
                    <li>• Letras e números</li>
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
              confirmPassword && !passwordsMatch ? 'input-error border-destructive' : ''
            }`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
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
