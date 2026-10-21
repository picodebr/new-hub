export const logTypes = <const>[
  'error',
  'warn',
  'log',
  'command',
  'send',
  'info',
];

export type LogType = typeof logTypes[number];

export const logTypeCategoryName: Record<LogType, string> = {
  log: 'Logs',
  warn: 'Warns',
  error: 'Errors',
  command: 'Commands',
  send: 'Sent',
  info: 'Info',
};

export interface ILog {
  id: number;
  type: LogType;
  content: string;
  timestamp: Date;
}

export type ILogCountByType = Record<LogType, number>;
