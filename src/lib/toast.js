import { toast } from 'react-toastify';

const baseOptions = {
  position: 'bottom-right',
  autoClose: 4000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true
};

export const notifySuccess = (message) => toast.success(message, baseOptions);

export const notifyError = (message) => toast.error(message, baseOptions);

export const notifyInfo = (message) => toast.info(message, baseOptions);
