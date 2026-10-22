import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

const VIDEO_URL =
  'https://picode-public.s3.amazonaws.com/hub-videos/Apresenta%C3%A7%C3%A3o+professores+com+intro+.mp4';

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

    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black/90 shadow-inner">
      <video
        src={VIDEO_URL}
        controls
        preload="metadata"
        className="h-full w-full object-contain"
        playsInline
      >
        Seu navegador não suporta reprodução de vídeo.
      </video>
    </div>
  </motion.div>
);

export default WelcomeVideo;
