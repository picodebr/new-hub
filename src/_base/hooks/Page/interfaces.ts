import { IHubUser } from '@/_base/interfaces/user';
import { Router } from 'next/router';

export interface IPageProps {
  user?: IHubUser;
  selectedPage?: string;
  pageTitle?: string;
  headerLabel?: string;
  showBackButton?: boolean;
  hideHeaderOnMobile?: boolean;
  fullScreenOnMobile?: boolean;
  backButtonPath?: string;
  isOpen: boolean;
  stopTour: () => void;
  setUser: (user: IHubUser) => void;
  fullScreen?: boolean;
  router?: Router;
}
