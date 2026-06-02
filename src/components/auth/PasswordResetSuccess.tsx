import { useEffect } from 'react';
import { motion } from 'framer-motion';
import AuthLogo from './AuthLogo';

interface PasswordResetSuccessProps {
  onGoToLogin: () => void;
}

const PasswordResetSuccess = ({ onGoToLogin }: PasswordResetSuccessProps) => {
  useEffect(() => {
    const timer = setTimeout(onGoToLogin, 3000);
    return () => clearTimeout(timer);
  }, [onGoToLogin]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="w-full text-center"
    >
      <AuthLogo />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
        style={{ background: 'hsl(var(--success) / 0.15)' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke="hsl(var(--success))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-check-draw"
          />
        </svg>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-[22px] font-semibold text-foreground mb-2"
      >
        Senha redefinida!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="text-sm text-muted-foreground mb-6"
      >
        Você será redirecionado para o login
      </motion.p>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={onGoToLogin}
        className="apple-btn-secondary"
      >
        Ir para o login
      </motion.button>
    </motion.div>
  );
};

export default PasswordResetSuccess;
