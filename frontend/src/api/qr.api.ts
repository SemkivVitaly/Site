import client from './client';

export interface QRPoint {
  id: string;
  hash: string;
  type: string;
  name: string;
  createdAt: string;
}

export interface GenerateQRPointDto {
  type: string;
  name: string;
}

export interface GenerateQRPointResponse {
  qrPoint: QRPoint;
  qrCodeDataURL: string;
}

export const qrApi = {
  generateQRPoint: async (data: GenerateQRPointDto): Promise<GenerateQRPointResponse> => {
    const response = await client.post<GenerateQRPointResponse>('/qr', data);
    return response.data;
  },

  getAllQRPoints: async (): Promise<QRPoint[]> => {
    const response = await client.get<QRPoint[]>('/qr');
    return response.data;
  },

  getQRPointByHash: async (hash: string): Promise<QRPoint> => {
    const response = await client.get<QRPoint>(`/qr/${hash}`);
    return response.data;
  },

  deleteQRPoint: async (id: string): Promise<void> => {
    await client.delete(`/qr/${id}`);
  },
};

