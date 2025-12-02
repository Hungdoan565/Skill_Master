/**
 * Rooms Feature Module - Barrel Export
 * 
 * Module quản lý phòng học
 * 
 * Structure:
 * - components/: UI components (Cards, Badges, Grid, Modal)
 * - hooks/: Custom hooks (useRooms, useCenters, useRoomForm)
 * - pages/: Page components
 * - utils/: Constants
 */

// Page export (default)
export { RoomsPage } from './pages';
export { RoomsPage as default } from './pages';

// Components exports
export {
  StatusBadge,
  RoomTypeBadge,
  EquipmentTags,
  EquipmentSelector,
  RoomStatsCards,
  RoomCard,
  RoomsGrid,
  RoomFilters,
  RoomFormModal,
} from './components';

// Hooks exports
export { useRooms, useCenters, useRoomForm } from './hooks';

// Utils exports
export {
  API_URL,
  STATUS_CONFIG,
  ROOM_TYPE_CONFIG,
  ROOM_TYPE_OPTIONS,
  STATUS_OPTIONS,
  EQUIPMENT_LABELS,
  EQUIPMENT_LIST,
  DEFAULT_ROOM_FORM,
} from './utils';
