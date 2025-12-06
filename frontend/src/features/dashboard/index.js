/**
 * Dashboard Feature Module - Barrel Export
 * 
 * Module quản lý trang Dashboard admin
 * 
 * Structure:
 * - components/: UI components (StatCards, Charts, Lists)
 * - hooks/: Custom hooks (useDashboard)
 * - pages/: Page components
 * - utils/: Constants và formatters
 */

// Page export (default)
export { DashboardPage } from './pages';
export { DashboardPage as default } from './pages';

// Components exports
export {
  PrimaryStatCard,
  SecondaryStatCard,
  ModernStatCard,
  SimpleAreaChart,
  SimplePieChart,
  ChartCard,
  HorizontalBarChart,
  CircularProgress,
  CircularProgressWithLabel,
  MultiCircularProgress,
  StudentItem,
  QuickAction,
  RecentStudentsList,
  QuickActionsCard,
  StatsSection,
  ChartsSection,
  DashboardHeader,
  GettingStartedCard,
  LiveActivityStream,
  StatusBadges,
  StatusBadge,
  RoleBadge,
  PriorityBadge,
  ConnectionStatus,
  OnlineIndicator,
  // Enhanced widgets
  PaymentOverviewCard,
  TodayScheduleCard,
  ErrorAlert,
  CenterSelector
} from './components';

// Hooks exports
export { useDashboard } from './hooks';

// Utils exports
export {
  API_URL,
  ACCENT_CLASSES,
  CHART_COLORS,
  getGreeting,
  getCurrentDate,
  formatYAxis,
  formatTrend
} from './utils';
