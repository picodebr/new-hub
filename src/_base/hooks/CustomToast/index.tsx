import { toast } from 'sonner';

export interface UseToastOptions {
  title?: string;
  description?: string;
  status?: 'info' | 'warning' | 'success' | 'error';
  duration?: number;
  isClosable?: boolean;
}

export const useCustomToast = () => {
  return (options: UseToastOptions = {}) => {
    const title = options.title || options.description || '';
    const desc = options.title ? options.description : undefined;

    switch (options.status) {
      case 'error':
        toast.error(title, { description: desc });
        break;
      case 'success':
        toast.success(title, { description: desc });
        break;
      case 'warning':
        toast.warning(title, { description: desc });
        break;
      default:
        toast.info(title, { description: desc });
        break;
    }
  };
};
