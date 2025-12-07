import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
} from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';
import { qrApi } from '../../api/qr.api';
import { useNotification } from '../../contexts/NotificationContext';

const QRScanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showSuccess, showError: showNotificationError } = useNotification();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'qr-reader';

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleScan = async (decodedText: string) => {
    if (decodedText) {
      setScanning(false);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
      
      try {
        // Parse QR data
        const qrData = JSON.parse(decodedText);
        
        if (qrData.type === 'QR_POINT') {
          // Verify QR point exists
          const qrPoint = await qrApi.getQRPointByHash(qrData.hash);
          
          // Process QR scan through shifts API
          const { shiftsApi } = await import('../../api/shifts.api');
          const shift = await shiftsApi.processQRScan({ qrHash: qrData.hash });
          
          setError('');
          const action = shift.timeIn && !shift.timeOut ? 'Вход' : shift.timeOut ? 'Выход' : 'Вход';
          showSuccess(`${action} зафиксирован: ${new Date().toLocaleTimeString()}`);
          
          // Navigate to shift control
          setTimeout(() => navigate('/employee/dashboard'), 1000);
        } else {
          setError('Неверный формат QR-кода');
          showNotificationError('Неверный формат QR-кода');
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.error || 'Ошибка обработки QR-кода: ' + err.message;
        setError(errorMsg);
        showNotificationError(errorMsg);
      }
    }
  };

  const startScanning = async () => {
    try {
      setError('');
      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScan,
        (errorMessage) => {
          // Ignore scanning errors
        }
      );
      setScanning(true);
    } catch (err: any) {
      setError('Ошибка камеры. Убедитесь, что разрешен доступ к камере.');
      console.error('QR Scanner error:', err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom align="center">
          Сканер QR-кода
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          {scanning ? (
            <Box>
              <div id={scannerId} style={{ width: '100%', minHeight: '300px' }}></div>
              <Button
                fullWidth
                variant="outlined"
                onClick={stopScanning}
                sx={{ mt: 2 }}
              >
                Отменить
              </Button>
            </Box>
          ) : (
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={startScanning}
            >
              Начать сканирование
            </Button>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" align="center">
          Наведите камеру на QR-код для сканирования
        </Typography>
      </Paper>
    </Container>
  );
};

export default QRScanner;

