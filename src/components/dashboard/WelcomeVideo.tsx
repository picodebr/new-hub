import { motion } from 'framer-motion';
import { Rocket, Play } from 'lucide-react';

const WelcomeVideo = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15 }}
    className="glass-card overflow-hidden p-5 md:p-6"
  >
    <div className="mb-4 flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
        <Rocket className="h-[18px] w-[18px] text-primary" />
      </div>
      <span className="text-base font-semibold text-foreground sm:text-lg">Boas-vindas à PiCode</span>
    </div>

    <div className="group relative flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent to-primary/5">
      <div className="absolute inset-0 flex items-center justify-center">
        <Rocket className="h-24 w-24 text-primary/10" />
      </div>
      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/25 transition-transform duration-200 group-hover:scale-110">
        <Play className="ml-0.5 h-6 w-6 text-primary-foreground" />
      </div>
      <span className="absolute bottom-3 left-3 rounded-lg bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
        0:00 / 1:08
      </span>
    </div>
  </motion.div>
);

export default WelcomeVideo;
