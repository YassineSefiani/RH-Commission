import { toast as baseToast } from 'sonner';

export const toast = {
  success: (message: string) => {
    baseToast.success(message, {
      style: {
        backgroundColor: '#16a34a',
        color: '#fff',
      },
    });
  },
  error: (message: string) => {
    baseToast.error(message, {
      style: {
        backgroundColor: '#dc2626',
        color: '#fff',
      },
    });
  },
};

export default toast;