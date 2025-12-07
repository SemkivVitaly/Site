import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import { Download, Delete } from '@mui/icons-material';
import { qrApi, QRPoint, GenerateQRPointDto } from '../../api/qr.api';
import { QRPointType } from '../../types';
import { translateQRPointType } from '../../utils/translations';

const QRGenerator: React.FC = () => {
  const [qrPoints, setQrPoints] = useState<QRPoint[]>([]);
  const [formData, setFormData] = useState<GenerateQRPointDto>({
    type: QRPointType.ENTRANCE,
    name: 'Вход/Выход',
  });
  const [generatedQR, setGeneratedQR] = useState<{ qrPoint: QRPoint; qrCodeDataURL: string } | null>(null);

  useEffect(() => {
    loadQRPoints();
  }, []);

  const loadQRPoints = async () => {
    try {
      const points = await qrApi.getAllQRPoints();
      setQrPoints(points);
    } catch (error) {
      console.error('Failed to load QR points:', error);
    }
  };

  const handleGenerate = async () => {
    try {
      const result = await qrApi.generateQRPoint(formData);
      setGeneratedQR(result);
      loadQRPoints();
    } catch (error) {
      console.error('Failed to generate QR:', error);
    }
  };

  const handleDownload = (dataURL: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить эту QR-точку?')) {
      try {
        await qrApi.deleteQRPoint(id);
        loadQRPoints();
      } catch (error) {
        console.error('Failed to delete QR point:', error);
      }
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Генерация QR-кодов
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Создать новую QR-точку
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Тип точки</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value={QRPointType.ENTRANCE}>Вход/Выход</MenuItem>
                <MenuItem value={QRPointType.EXIT}>Выход</MenuItem>
                <MenuItem value={QRPointType.BREAK_AREA}>Зона отдыха</MenuItem>
                <MenuItem value={QRPointType.LUNCH}>Обед</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Название"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleGenerate}>
              Сгенерировать QR-код
            </Button>
          </Grid>
        </Grid>

        {generatedQR && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              QR-код создан: {generatedQR.qrPoint.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <img
                src={generatedQR.qrCodeDataURL}
                alt="QR Code"
                style={{ maxWidth: 200 }}
              />
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() =>
                  handleDownload(
                    generatedQR.qrCodeDataURL,
                    `qr-${generatedQR.qrPoint.name}-${generatedQR.qrPoint.hash}.png`
                  )
                }
              >
                Скачать
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      <Typography variant="h6" gutterBottom>
        Существующие QR-точки
      </Typography>
      <Grid container spacing={2}>
        {qrPoints.map((point) => (
          <Grid item xs={12} sm={6} md={4} key={point.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box>
                    <Typography variant="subtitle1">{point.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Тип: {translateQRPointType(point.type)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Hash: {point.hash.substring(0, 8)}...
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(point.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default QRGenerator;

