import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { Html5Qrcode, Html5QrcodeSupportedFormats, CameraDevice } from 'html5-qrcode';
import { QrCodeScanner, FlipCameraAndroid, Stop } from '@mui/icons-material';
import { qrApi } from '../../api/qr.api';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const QRScanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cameraId, setCameraId] = useState<string>(''); // Будет установлен при загрузке списка камер
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError: showNotificationError } = useNotification();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'qr-reader';

  useEffect(() => {
    // Проверяем доступность API камеры
    const checkCameraAvailability = () => {
      // Проверяем, доступен ли navigator.mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        let errorMsg = 'Доступ к камере недоступен. ';
        
        if (!isHTTPS) {
          errorMsg += 'Для работы сканера QR-кодов необходим HTTPS. ';
          errorMsg += 'Пожалуйста, используйте https://178.67.157.66:8444 для доступа к сайту. ';
          errorMsg += 'При первом подключении браузер покажет предупреждение о сертификате - нажмите "Дополнительно" → "Перейти на сайт".';
        } else {
          errorMsg += 'Ваш браузер не поддерживает доступ к камере или API недоступен. ';
          errorMsg += 'Попробуйте использовать современный браузер (Chrome, Firefox, Safari).';
        }
        setError(errorMsg);
        return false;
      }
      return true;
    };

    // Запрашиваем разрешение на камеру при открытии страницы сканера
    const requestCameraPermission = async () => {
      // Сначала проверяем доступность API
      if (!checkCameraAvailability()) {
        return;
      }

      try {
        // Запрашиваем разрешение на камеру
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Освобождаем поток сразу после получения разрешения
        stream.getTracks().forEach(track => track.stop());
        
        // Теперь получаем список камер с разрешением
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          setAvailableCameras(cameras);
          // Используем первую камеру по умолчанию
          setCameraId(cameras[0].id);
          setError(''); // Очищаем ошибку при успехе
        } else {
          console.warn('No cameras found');
          setError('Камеры не найдены. Убедитесь, что камера подключена и доступна.');
        }
      } catch (err: any) {
        console.error('Error requesting camera permission:', err);
        let errorMsg = 'Не удалось получить доступ к камере. ';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMsg += 'Разрешите доступ к камере в настройках браузера. ';
          errorMsg += 'Нажмите на иконку замка в адресной строке и включите доступ к камере.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMsg += 'Камера не найдена. Убедитесь, что камера подключена и доступна.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMsg += 'Камера занята другим приложением. Закройте другие приложения, использующие камеру.';
        } else {
          errorMsg += err.message || 'Не удалось получить доступ к камере.';
        }
        setError(errorMsg);
        
        // Пытаемся получить список камер без разрешения (может быть пустым)
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            setAvailableCameras(cameras);
            setCameraId(cameras[0].id);
          }
        } catch (e) {
          console.error('Error getting cameras without permission:', e);
        }
      }
    };

    requestCameraPermission();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
      }
    };
  }, []);

  const handleScan = async (decodedText: string, decodedResult?: any) => {
    if (!decodedText) return;

    // Остановить сканирование после успешного распознавания
    setScanning(false);
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
    }

    try {
      // Попытка распарсить как JSON (для QR-точек системы)
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
      } catch {
        // Если не JSON, попробуем обработать как обычный текст или URL
        setSuccessMessage(`Сканировано: ${decodedText}`);
        showSuccess(`QR-код успешно отсканирован: ${decodedText}`);
        return;
      }

      if (qrData.type === 'QR_POINT') {
        // Проверить существование QR-точки
        const qrPoint = await qrApi.getQRPointByHash(qrData.hash);

        // Обработать сканирование через API смен (только для сотрудников)
        if (user?.role === 'EMPLOYEE' || user?.role === 'ADMIN') {
          try {
            const { shiftsApi } = await import('../../api/shifts.api');
            const shift = await shiftsApi.processQRScan({ qrHash: qrData.hash });

            setError('');
            const action =
              shift.timeIn && !shift.timeOut
                ? 'Вход'
                : shift.timeOut
                ? 'Выход'
                : 'Вход';
            setSuccessMessage(
              `${action} зафиксирован на точке "${qrPoint.name}" в ${new Date().toLocaleTimeString()}`
            );
            showSuccess(`${action} зафиксирован: ${new Date().toLocaleTimeString()}`);

            // Перейти на дашборд сотрудника через 2 секунды
            setTimeout(() => {
              navigate('/employee/dashboard');
            }, 2000);
          } catch (shiftError: any) {
            // Если ошибка обработки смены, показать информацию о QR-точке
            setSuccessMessage(
              `QR-точка распознана: ${qrPoint.name} (${qrPoint.type})`
            );
            showSuccess(`QR-точка: ${qrPoint.name}`);
          }
        } else {
          // Для менеджеров просто показать информацию о QR-точке
          setSuccessMessage(
            `QR-точка распознана: ${qrPoint.name} (${qrPoint.type})`
          );
          showSuccess(`QR-точка: ${qrPoint.name}`);
        }
      } else {
        setSuccessMessage(`Неизвестный тип QR-кода: ${qrData.type || 'N/A'}`);
        showNotificationError('Неизвестный тип QR-кода');
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || 'Ошибка обработки QR-кода: ' + err.message;
      setError(errorMsg);
      showNotificationError(errorMsg);
      // Дать возможность сканировать снова
      setTimeout(() => {
        setError('');
        startScanning();
      }, 3000);
    }
  };

  const startScanning = async () => {
    try {
      setError('');
      setSuccessMessage('');
      
      // Проверяем доступность API камеры
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        let errorMsg = 'Доступ к камере недоступен. ';
        
        if (!isHTTPS) {
          errorMsg += 'Для работы сканера QR-кодов необходим HTTPS. ';
          errorMsg += 'Используйте https://178.67.157.66:8444 для доступа к сайту.';
        } else {
          errorMsg += 'Ваш браузер не поддерживает доступ к камере.';
        }
        setError(errorMsg);
        showNotificationError(errorMsg);
        return;
      }
      
      // Проверяем доступность камеры перед началом сканирования
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Если получили доступ, сразу освобождаем поток
        stream.getTracks().forEach(track => track.stop());
      } catch (cameraError: any) {
        let errorMsg = 'Ошибка доступа к камере. ';
        if (cameraError.name === 'NotAllowedError' || cameraError.name === 'PermissionDeniedError') {
          errorMsg += 'Разрешите доступ к камере в настройках браузера. ';
          errorMsg += 'Нажмите на иконку замка в адресной строке и включите доступ к камере.';
        } else if (cameraError.name === 'NotFoundError' || cameraError.name === 'DevicesNotFoundError') {
          errorMsg += 'Камера не найдена. Убедитесь, что камера подключена и доступна.';
        } else if (cameraError.name === 'NotReadableError' || cameraError.name === 'TrackStartError') {
          errorMsg += 'Камера занята другим приложением. Закройте другие приложения, использующие камеру.';
        } else {
          errorMsg += cameraError.message || 'Не удалось получить доступ к камере.';
        }
        setError(errorMsg);
        showNotificationError(errorMsg);
        return;
      }
      
      // Устанавливаем scanning в true, чтобы элемент был отрендерен в DOM
      setScanning(true);
      
      // Небольшая задержка, чтобы элемент точно был в DOM
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Проверяем, что элемент существует перед инициализацией
      const element = document.getElementById(scannerId);
      if (!element) {
        setScanning(false);
        setError('Элемент сканера не найден. Попробуйте обновить страницу.');
        showNotificationError('Элемент сканера не найден. Попробуйте обновить страницу.');
        return;
      }
      
      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      // Адаптивный размер qrbox в зависимости от размера экрана
      const getQrBoxSize = () => {
        const width = window.innerWidth;
        if (width < 600) {
          return { width: 200, height: 200 }; // Мобильные устройства
        } else if (width < 960) {
          return { width: 250, height: 250 }; // Планшеты
        } else {
          return { width: 300, height: 300 }; // Десктоп
        }
      };

      const config = {
        fps: 10,
        qrbox: getQrBoxSize(),
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
        ],
      };

      let cameraConfig;
      // Используем только реальные камеры из списка
      if (availableCameras.length > 0) {
        // Проверяем, что выбранная камера есть в списке
        const selectedCamera = availableCameras.find(cam => cam.id === cameraId);
        if (selectedCamera) {
          // Используем реальную камеру по ID
          cameraConfig = { deviceId: { exact: cameraId } };
        } else {
          // Если выбранной камеры нет в списке, используем первую доступную
          cameraConfig = { deviceId: { exact: availableCameras[0].id } };
          setCameraId(availableCameras[0].id);
        }
      } else {
        // Если нет доступных камер, выбрасываем ошибку
        setScanning(false);
        throw new Error('Нет доступных камер. Разрешите доступ к камере в настройках браузера.');
      }

      await scanner.start(cameraConfig, config, handleScan, (errorMessage) => {
        // Игнорировать ошибки сканирования (они постоянно появляются при поиске QR-кода)
      });
    } catch (err: any) {
      let errorMessage = 'Ошибка камеры. ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Разрешите доступ к камере в настройках браузера. ';
        errorMessage += 'Нажмите на иконку замка в адресной строке и включите доступ к камере.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += 'Камера не найдена. Убедитесь, что камера подключена.';
      } else {
        errorMessage += err.message || 'Убедитесь, что разрешен доступ к камере.';
      }
      setError(errorMessage);
      showNotificationError(errorMessage);
      console.error('QR Scanner error:', err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setScanning(false);
    setSuccessMessage('');
  };

  const switchCamera = () => {
    if (scanning && availableCameras.length > 1) {
      stopScanning().then(() => {
        // Переключаемся на следующую камеру в списке
        const currentIndex = availableCameras.findIndex(cam => cam.id === cameraId);
        const nextIndex = (currentIndex + 1) % availableCameras.length;
        setCameraId(availableCameras[nextIndex].id);
        setTimeout(() => startScanning(), 300);
      });
    } else if (availableCameras.length > 1) {
      // Переключаемся на следующую камеру в списке
      const currentIndex = availableCameras.findIndex(cam => cam.id === cameraId);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      setCameraId(availableCameras[nextIndex].id);
    }
  };

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        px: { xs: 0.5, sm: 2 },
        pb: { xs: 2, sm: 3 }
      }}
    >
      <Paper sx={{ 
        p: { xs: 1.5, sm: 3 }, 
        mt: { xs: 1, sm: 4 },
        mx: { xs: 0.5, sm: 0 }
      }}>
        <Typography 
          variant="h5" 
          gutterBottom 
          align="center"
          sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
        >
          Сканер QR-кода
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }} 
            onClose={() => setError('')}
            action={
              (error.includes('Разрешите доступ') || error.includes('HTTPS')) && navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? (
                <Button
                  size="small"
                  onClick={() => {
                    // Попытка запросить разрешение снова
                    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                      navigator.mediaDevices.getUserMedia({ video: true })
                        .then((stream) => {
                          stream.getTracks().forEach(track => track.stop());
                          setError('');
                          startScanning();
                        })
                        .catch(() => {
                          setError('Не удалось получить доступ к камере. Включите камеру в настройках браузера.');
                        });
                    }
                  }}
                >
                  Запросить доступ
                </Button>
              ) : null
            }
          >
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {!scanning && (
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Камера</InputLabel>
              <Select
                value={cameraId}
                label="Камера"
                onChange={(e) => setCameraId(e.target.value)}
                disabled={availableCameras.length === 0}
              >
                {availableCameras.map((camera) => (
                  <MenuItem key={camera.id} value={camera.id}>
                    {camera.label || `Камера ${camera.id.substring(0, 8)}`}
                  </MenuItem>
                ))}
              </Select>
              {availableCameras.length === 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Разрешите доступ к камере для отображения списка доступных камер
                </Typography>
              )}
            </FormControl>

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<QrCodeScanner />}
              onClick={startScanning}
              sx={{
                py: { xs: 1.5, sm: 2 },
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Начать сканирование
            </Button>
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Box sx={{ 
            position: 'relative', 
            width: '100%', 
            minHeight: { xs: '250px', sm: '300px', md: '400px' }, 
            mb: 2, 
            display: scanning ? 'block' : 'none',
            overflow: 'hidden'
          }}>
            <div id={scannerId} style={{ width: '100%', height: '100%' }}></div>
          </Box>
          {scanning ? (
            <Box>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 2 } 
              }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  startIcon={<Stop />}
                  onClick={stopScanning}
                  sx={{
                    py: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  Остановить
                </Button>
                {availableCameras.length > 1 && (
                  <Button
                    variant="outlined"
                    startIcon={<FlipCameraAndroid />}
                    onClick={switchCamera}
                    sx={{
                      width: { xs: '100%', sm: 'auto' },
                      py: { xs: 1.5, sm: 2 },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      minWidth: { xs: 'auto', sm: '200px' }
                    }}
                  >
                    Переключить камеру
                  </Button>
                )}
              </Box>
            </Box>
          ) : (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                  Наведите камеру на QR-код для сканирования
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Chip label="QR-коды точек" size="small" />
                  <Chip label="QR-коды смен" size="small" />
                  <Chip label="Текстовые QR-коды" size="small" />
                  <Chip label="URL" size="small" />
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default QRScanner;

