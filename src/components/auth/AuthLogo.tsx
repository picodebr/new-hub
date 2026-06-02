import { Rocket } from 'lucide-react';

const AuthLogo = () => (
  <div className="flex items-center justify-center gap-2 mb-4">
    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
      <Rocket className="w-6 h-6 text-primary-foreground" />
    </div>
    <span className="text-xl font-bold text-foreground tracking-tight">PiCode Education</span>
  </div>
);

export default AuthLogo;
