import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

interface Notification {
  type: string;
  incident?: {
    id: string;
    title: string;
    type: string;
    [key: string]: any;
  };
  task?: {
    id: string;
    operation: string;
    order?: any;
    machine?: any;
    priority?: string;
  };
  message: string;
}

export const useNotifications = () => {
  const { token, user } = useAuth();
  const { showInfo, showSuccess } = useNotification();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on(`notification:${user.id}`, (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      
      // Show notification to user
      if (notification.type === 'TASK_ASSIGNED') {
        showInfo(notification.message);
        // Navigate to tasks page when clicked
        setTimeout(() => {
          navigate('/employee/tasks');
        }, 2000);
      } else if (notification.type === 'INCIDENT_CREATED' && notification.incident) {
        showInfo(notification.message, () => {
          openIncidentDialog(notification.incident!.id);
        });
      } else {
        showInfo(notification.message);
      }
    });

    newSocket.on('incident:assigned', (data) => {
      const notification = {
        type: 'INCIDENT_ASSIGNED',
        message: `${data.resolverName} взял инцидент в работу`,
      };
      setNotifications((prev) => [notification, ...prev]);
      showInfo(notification.message);
    });

    newSocket.on('incident:resolved', (data) => {
      const notification = {
        type: 'INCIDENT_RESOLVED',
        message: 'Инцидент разрешен',
      };
      setNotifications((prev) => [notification, ...prev]);
      showSuccess(notification.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, user, navigate, showInfo, showSuccess]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const openIncidentDialog = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setIncidentDialogOpen(true);
  };

  const closeIncidentDialog = () => {
    setIncidentDialogOpen(false);
    setSelectedIncidentId(null);
  };

  return { 
    notifications, 
    clearNotifications, 
    socket,
    incidentDialogOpen,
    selectedIncidentId,
    openIncidentDialog,
    closeIncidentDialog,
  };
};

