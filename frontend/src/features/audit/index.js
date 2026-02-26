import { lazy } from 'react';

export const AuditLogPage = lazy(() =>
  import('./pages/AuditLogPage').then((module) => ({ default: module.AuditLogPage }))
);
