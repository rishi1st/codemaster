// components/Common/Toast.jsx
import React from 'react';
import { useToast } from '../../contexts/ToastContext';

const Toast = () => {
  const { toast } = useToast();

  if (!toast) return null;

  const toastClasses = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info'
  };

  return (
    <div className="toast toast-top toast-end z-50">
      <div className={`alert ${toastClasses[toast.type] || 'alert-info'} shadow-lg`}>
        <div>
          <span>{toast.message}</span>
        </div>
      </div>
    </div>
  );
};

export default Toast;