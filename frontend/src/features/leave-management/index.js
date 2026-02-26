import { lazy } from 'react';

export const LeaveManagementPage = lazy(() =>
  import('./pages/LeaveManagementPage').then((module) => ({ default: module.LeaveManagementPage }))
);
