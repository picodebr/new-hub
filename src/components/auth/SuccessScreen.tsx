import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SuccessScreenProps {
  onGoToLogin: () => void;
}

const SuccessScreen = ({ onGoToLogin }: SuccessScreenProps) => {
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
      className="w-full flex flex-col items-center text-center py-8"
    >
      {/* Animated check circle */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{
          background: 'hsl(var(--success) / 0.12)',
          boxShadow: '0 0 40px hsl(var(--success) / 0.2)',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-[22px] font-semibold text-foreground mb-2"
      >
        Conta criada com sucesso!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="text-sm text-muted-foreground mb-8"
      >
        Você será redirecionado para o login
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileTap={{ scale: 0.97 }}
        onClick={onGoToLogin}
        className="apple-btn-secondary max-w-[200px]"
      >
        Ir para o login
      </motion.button>
    </motion.div>
  );
};

export default SuccessScreen;
