import { toast as sonnerToast } from 'sonner';

export interface ToastErrorOptions {
  title?: string;
  description?: string;
  status?: string;
  variant?: string;
  [key: string]: any;
}

export const showErrorToClient = (
  error: any,
  toast?: ((data: ToastErrorOptions) => void) | any
) => {
  const message: string =
    error?.response?.data?.response?.message ||
    error?.response?.data?.validation?.body?.message ||
    error?.response?.data?.message ||
    error?.response?.message ||
    error?.message ||
    'Ocorreu um erro';

  if (typeof toast === 'function') {
    toast({
      status: 'error',
      title: String(message) || 'Erro',
      description: String(message) || 'Erro',
      variant: 'destructive',
    });
  } else {
    sonnerToast.error(String(message) || 'Erro inesperado');
  }
};
