import React, { useState, useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { processQueue } from '../../utils/offlineQueue';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
      // Process queued actions when coming back online
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setShowOffline(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Snackbar
      open={showOffline}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert severity="warning" onClose={() => setShowOffline(false)}>
        Нет подключения к интернету. Данные будут сохранены локально.
      </Alert>
    </Snackbar>
  );
};

export default OfflineIndicator;

