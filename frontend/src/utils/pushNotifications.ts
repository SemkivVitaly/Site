// Утилита для Web Push уведомлений
let registration: ServiceWorkerRegistration | null = null;

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    // Не логируем, если уведомления не поддерживаются
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      // Логируем только если разрешение получено
      if (permission === 'granted') {
        console.log('Notification permission granted');
      }
      return permission === 'granted';
    } catch (error) {
      // Логируем только ошибки, не отказы
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Не логируем, если разрешение было ранее отклонено
  return false;
};

export const showPushNotification = async (
  title: string,
  options: NotificationOptions = {}
): Promise<void> => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }

  // Проверяем разрешение
  if (Notification.permission === 'denied') {
    // Не логируем, если разрешение отклонено
    return;
  }

  // Запрашиваем разрешение, если еще не запрошено
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    // Не логируем, если разрешение не получено
    return;
  }

  try {
    // Пытаемся использовать Service Worker для более продвинутых уведомлений
    if ('serviceWorker' in navigator) {
      try {
        // Регистрируем Service Worker, если еще не зарегистрирован
        if (!registration) {
          const reg = await navigator.serviceWorker.ready;
          registration = reg;
        }
        
        if (registration) {
          await registration.showNotification(title, {
            ...options,
            icon: '/logo192.png',
            badge: '/logo192.png',
            requireInteraction: false,
          });
          return;
        }
      } catch (error) {
        // Не логируем ошибки Service Worker, просто используем fallback
      }
    }

    // Fallback на обычные уведомления
    const notification = new Notification(title, {
      ...options,
      icon: '/logo192.png',
    });
    
    // Обработчик клика по уведомлению
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    // Логируем только критические ошибки
    if (error instanceof Error && !error.message.includes('permission')) {
      console.error('Failed to show push notification:', error);
    }
  }
};

