import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  Rocket,
  Award,
  Sparkles,
  Users,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface EventItem {
  id: string;
  title: string;
  category: 'Hackathon' | 'Workshop' | 'Desafio Maker' | 'Olimpíada';
  description: string;
  date: string;
  rewardCoins: number;
  participants: number;
  isActive: boolean;
  timeLeft: { hours: number; minutes: number; seconds: number };
}

const EVENTS_DATA: EventItem[] = [
  {
    id: '1',
    title: 'Desafio Maker: Robô Seguidor de Linha Inteligente',
    category: 'Desafio Maker',
    description:
      'Programe no Blockly e implemente sensores infravermelhos para o robô percorrer uma pista cheia de curvas fechadas no menor tempo possível.',
    date: 'Até 30/11/2026',
    rewardCoins: 500,
    participants: 48,
    isActive: true,
    timeLeft: { hours: 42, minutes: 18, seconds: 35 },
  },
  {
    id: '2',
    title: 'Hackathon PiCode Vision Lab: Reconhecimento de Gestos',
    category: 'Hackathon',
    description:
      'Treine um modelo de machine learning no Vision Lab e integre ao robô para obedecer a comandos por gestos da mão.',
    date: '15/12/2026',
    rewardCoins: 1000,
    participants: 124,
    isActive: false,
    timeLeft: { hours: 240, minutes: 0, seconds: 0 },
  },
  {
    id: '3',
    title: 'Workshop Ao Vivo: Introdução à Internet das Coisas (IoT)',
    category: 'Workshop',
    description:
      'Aprenda como conectar sua placa a servidores MQTT na nuvem para monitorar sensores em tempo real pela web.',
    date: '05/12/2026',
    rewardCoins: 250,
    participants: 89,
    isActive: false,
    timeLeft: { hours: 120, minutes: 0, seconds: 0 },
  },
];

export const EventsView: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>(EVENTS_DATA);

  // Countdown timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setEvents((prev) =>
        prev.map((e) => {
          if (!e.isActive) return e;
          let { hours, minutes, seconds } = e.timeLeft;
          if (seconds > 0) {
            seconds--;
          } else if (minutes > 0) {
            minutes--;
            seconds = 59;
          } else if (hours > 0) {
            hours--;
            minutes = 59;
            seconds = 59;
          }
          return { ...e, timeLeft: { hours, minutes, seconds } };
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeEvent = events.find((e) => e.isActive) || events[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Eventos e Desafios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Participe de competições, hackathons e oficinas práticas para acelerar suas habilidades
          </p>
        </div>
      </div>

      {/* Hero Active Challenge with Countdown */}
      {activeEvent && (
        <div className="glass-card !rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-primary/15 via-background to-primary/5 border-primary/30 relative overflow-hidden space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs bg-primary text-primary-foreground font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Desafio em Andamento 🔥
              </span>
              <h2 className="text-2xl font-bold text-foreground mt-2">{activeEvent.title}</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                {activeEvent.description}
              </p>
            </div>

            {/* Countdown Box */}
            <div className="glass-card !rounded-2xl p-4 flex flex-col items-center justify-center min-w-[200px] border-primary/40 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold mb-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Tempo Restante</span>
              </div>
              <div className="flex items-center gap-2 font-mono font-bold text-xl text-primary">
                <div className="bg-primary/10 px-2.5 py-1.5 rounded-lg border border-primary/20">
                  {String(activeEvent.timeLeft.hours).padStart(2, '0')}h
                </div>
                <span>:</span>
                <div className="bg-primary/10 px-2.5 py-1.5 rounded-lg border border-primary/20">
                  {String(activeEvent.timeLeft.minutes).padStart(2, '0')}m
                </div>
                <span>:</span>
                <div className="bg-primary/10 px-2.5 py-1.5 rounded-lg border border-primary/20">
                  {String(activeEvent.timeLeft.seconds).padStart(2, '0')}s
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/40">
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-foreground">+{activeEvent.rewardCoins} PiCoins</span> de prêmio
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                <span>{activeEvent.participants} participantes inscritos</span>
              </div>
            </div>

            <button
              onClick={() => toast.success('Você entrou no desafio! Boa sorte na missão!')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-md group"
            >
              <span>Iniciar Desafio</span>
              <Rocket className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Upcoming Events Grid */}
      <div>
        <h3 className="text-base font-bold text-foreground mb-4">Próximos Eventos e Workshops</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events
            .filter((e) => !e.isActive)
            .map((ev) => (
              <div
                key={ev.id}
                className="glass-card !rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-accent/60 text-muted-foreground">
                      {ev.category}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {ev.date}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-foreground">{ev.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{ev.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/40 text-xs">
                  <span className="text-amber-500 font-bold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> +{ev.rewardCoins} PiCoins
                  </span>

                  <button
                    onClick={() => toast.info('Inscrição confirmada para o evento!')}
                    className="px-4 py-2 rounded-xl border border-border/60 hover:border-primary text-foreground font-semibold hover:bg-accent transition-colors"
                  >
                    Garantir Vaga
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </motion.div>
  );
};

export default EventsView;
