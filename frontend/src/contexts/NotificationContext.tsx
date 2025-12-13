import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor, Button } from '@mui/material';

interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor, onClick?: () => void) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string, onClick?: () => void) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');
  const [onClick, setOnClick] = useState<(() => void) | undefined>(undefined);

  const showNotification = (msg: string, sev: AlertColor = 'info', clickHandler?: () => void) => {
    setMessage(msg);
    setSeverity(sev);
    setOnClick(() => clickHandler);
    setOpen(true);
  };

  const showError = (msg: string) => showNotification(msg, 'error');
  const showSuccess = (msg: string) => showNotification(msg, 'success');
  const showWarning = (msg: string) => showNotification(msg, 'warning');
  const showInfo = (msg: string, clickHandler?: () => void) => showNotification(msg, 'info', clickHandler);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showError,
        showSuccess,
        showWarning,
        showInfo,
      }}
    >
      {children}
      <Snackbar
        open={open}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          sx={{ width: '100%' }}
          action={
            onClick ? (
              <Button color="inherit" size="small" onClick={() => { onClick(); handleClose(); }}>
                Открыть
              </Button>
            ) : undefined
          }
        >
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

