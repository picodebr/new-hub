export const appStatus = <const>[
  'starting',

  /* connection */
  'waiting_to_connect', // mobile app only
  'connection_failed', // desktop app only

  /* compilation */
  'ready_to_compile',
  'compiling',
  'compiled',
  'compilation_failed',

  /* upload */
  'ready_to_upload', // desktop app only
  'wait_reset_click',
  'uploading',
  'uploaded',
  'upload_failed',
  'reset_fail',
];

export type AppStatus = (typeof appStatus)[number];
