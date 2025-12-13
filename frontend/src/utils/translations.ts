// Утилиты для перевода статусов и приоритетов на русский язык

export const translateTaskStatus = (status: string): string => {
  const translations: Record<string, string> = {
    PENDING: 'Ожидает',
    IN_PROGRESS: 'В работе',
    COMPLETED: 'Завершено',
    CANCELLED: 'Отменено',
  };
  return translations[status] || status;
};

export const translateOrderStatus = (status: string): string => {
  const translations: Record<string, string> = {
    NEW: 'Новый',
    IN_QUEUE: 'В очереди',
    IN_PROGRESS: 'В работе',
    PARTIALLY_READY: 'Частично готов',
    READY: 'Готов',
    ISSUED: 'Выдан',
  };
  return translations[status] || status;
};

export const translatePriority = (priority: string): string => {
  const translations: Record<string, string> = {
    LOW: 'Низкий',
    MEDIUM: 'Средний',
    HIGH: 'Высокий',
    CRITICAL: 'Критический',
  };
  return translations[priority] || priority;
};

export const translateMachineStatus = (status: string): string => {
  const translations: Record<string, string> = {
    WORKING: 'Работает',
    REPAIR: 'Ремонт',
    MAINTENANCE: 'Обслуживание',
    REQUIRES_ATTENTION: 'Требует внимания',
  };
  return translations[status] || status;
};

export const translateIncidentType = (type: string): string => {
  const translations: Record<string, string> = {
    MACHINE_BREAKDOWN: 'Помощь со станком',
    TASK_QUESTION: 'Вопрос по задаче',
  };
  return translations[type] || type;
};

export const translateIncidentStatus = (status: string): string => {
  const translations: Record<string, string> = {
    OPEN: 'Открыт',
    IN_PROGRESS: 'В работе',
    RESOLVED: 'Решен',
  };
  return translations[status] || status;
};

export const translateQRPointType = (type: string): string => {
  const translations: Record<string, string> = {
    ENTRANCE: 'Вход/Выход',
    EXIT: 'Выход',
    BREAK_AREA: 'Зона отдыха',
    LUNCH: 'Обед',
  };
  return translations[type] || type;
};

