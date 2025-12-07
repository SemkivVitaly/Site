// Общие типы для frontend

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum MachineStatus {
  WORKING = 'WORKING',
  REPAIR = 'REPAIR',
  MAINTENANCE = 'MAINTENANCE',
  REQUIRES_ATTENTION = 'REQUIRES_ATTENTION',
}

export enum OrderStatus {
  NEW = 'NEW',
  IN_QUEUE = 'IN_QUEUE',
  IN_PROGRESS = 'IN_PROGRESS',
  PARTIALLY_READY = 'PARTIALLY_READY',
  READY = 'READY',
  ISSUED = 'ISSUED',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentType {
  MACHINE_BREAKDOWN = 'MACHINE_BREAKDOWN',
  TASK_QUESTION = 'TASK_QUESTION',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}

export enum QRPointType {
  ENTRANCE = 'ENTRANCE',
  EXIT = 'EXIT',
  BREAK_AREA = 'BREAK_AREA',
  LUNCH = 'LUNCH',
}

