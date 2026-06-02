import { motion } from 'framer-motion';
import { BookOpen, Users } from 'lucide-react';
import AuthLogo from './AuthLogo';

interface ProfileSelectionProps {
  onSelect: (profile: 'student' | 'teacher') => void;
  onLogin: () => void;
}

const profiles = [
  {
    id: 'student' as const,
    label: 'Aluno',
    icon: BookOpen,
    color: 'hsl(142, 71%, 45%)',
    bgColor: 'hsl(142, 71%, 45%, 0.1)',
    borderColor: 'hsl(142, 71%, 45%, 0.3)',
  },
  {
    id: 'teacher' as const,
    label: 'Professor',
    icon: Users,
    color: 'hsl(211, 100%, 50%)',
    bgColor: 'hsl(211, 100%, 50%, 0.1)',
    borderColor: 'hsl(211, 100%, 50%, 0.3)',
  },
];

const ProfileSelection = ({ onSelect, onLogin }: ProfileSelectionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className="w-full"
  >
    <AuthLogo />
    <p className="text-sm text-center text-muted-foreground mb-6">
      Já tem conta?{' '}
      <button onClick={onLogin} className="link-animated text-primary font-medium cursor-pointer">
        Fazer login
      </button>
    </p>

    <h1 className="text-2xl font-semibold text-center text-foreground mb-1">Eu sou...</h1>
    <p className="text-sm text-center text-muted-foreground mb-8">
      Selecione como deseja se cadastrar
    </p>

    <div className="grid grid-cols-2 gap-4">
      {profiles.map((profile, i) => (
        <motion.button
          key={profile.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(profile.id)}
          className="flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 transition-colors duration-200 cursor-pointer"
          style={{
            background: profile.bgColor,
            borderColor: profile.borderColor,
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: `${profile.color}20` }}
          >
            <profile.icon className="w-7 h-7" style={{ color: profile.color }} />
          </div>
          <span className="text-base font-semibold text-foreground">{profile.label}</span>
        </motion.button>
      ))}
    </div>
  </motion.div>
);

export default ProfileSelection;
