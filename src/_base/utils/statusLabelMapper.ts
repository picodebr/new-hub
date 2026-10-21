import { HubStatus } from '../interfaces/shared';

export const statusLabelMapper: Record<HubStatus, string> = {
  finished: 'Finalizado',
  running: 'Em execução',
  stopped: 'Pausado',
};
