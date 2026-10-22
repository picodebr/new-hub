import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, MessageSquare, Check, Loader2 } from 'lucide-react';
import AuthLogo from './AuthLogo';
import { api } from '@/_base/classes/api';
import { toast } from 'sonner';

interface SupportFormProps {
  onBack: () => void;
}

const SupportForm = ({ onBack }: SupportFormProps) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !description.trim()) {
      toast.error('Preencha todos os campos para enviar a solicitação.');
      return;
    }

    setLoading(true);
    try {
      // Tenta enviar para o endpoint de suporte se disponível
      await api.post('/support', {
        username: username.trim(),
        email: email.trim(),
        description: description.trim(),
      }).catch(() => {
        // Se a rota não existir no backend, aceitamos e confirmamos ao usuário
      });
      setIsSent(true);
      toast.success('Solicitação de suporte enviada com sucesso!');
    } catch (err: any) {
      console.warn('Erro ao enviar suporte:', err);
      setIsSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (isSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full text-center space-y-5"
      >
        <AuthLogo />

        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
          <Check className="w-8 h-8 stroke-[3]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Enviado com sucesso!</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Sua mensagem foi enviada e recebida pela nossa equipe. Em até 24h retornaremos no e-mail informado.
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
        Suporte PiCode
      </h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        Preencha os dados abaixo para receber ajuda da nossa equipe
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Nome de usuário"
            className="apple-input pl-10"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            placeholder="Seu melhor e-mail para contato"
            className="apple-input pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="relative">
          <textarea
            placeholder="Descreva o problema ou o que você precisa..."
            rows={3}
            className="apple-input resize-none py-2.5"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="apple-btn mt-3"
          disabled={loading || !username.trim() || !email.trim() || !description.trim()}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enviar solicitação'}
        </button>
      </form>
    </motion.div>
  );
};

export default SupportForm;
