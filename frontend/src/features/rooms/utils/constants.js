/**
 * Rooms Constants
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Room status configuration
export const STATUS_CONFIG = {
  active: { label: 'Hoạt động', className: 'bg-green-100 text-green-700' },
  maintenance: { label: 'Bảo trì', className: 'bg-yellow-100 text-yellow-700' },
  inactive: { label: 'Ngừng hoạt động', className: 'bg-gray-100 text-gray-600' }
};

// Room type configuration
export const ROOM_TYPE_CONFIG = {
  standard: { label: 'Phòng học', className: 'bg-blue-100 text-blue-700' },
  lab: { label: 'Phòng Lab', className: 'bg-purple-100 text-purple-700' },
  meeting: { label: 'Phòng họp', className: 'bg-orange-100 text-orange-700' },
  online: { label: 'Online', className: 'bg-cyan-100 text-cyan-700' }
};

// Room type options for forms
export const ROOM_TYPE_OPTIONS = [
  { value: 'standard', label: 'Phòng học' },
  { value: 'lab', label: 'Phòng Lab' },
  { value: 'meeting', label: 'Phòng họp' },
  { value: 'online', label: 'Online' },
];

// Status options for forms
export const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'maintenance', label: 'Đang bảo trì' },
  { value: 'inactive', label: 'Ngừng hoạt động' },
];

// Equipment labels
export const EQUIPMENT_LABELS = {
  projector: 'Máy chiếu',
  computers: 'Máy tính',
  air_conditioner: 'Điều hòa',
  video_conference: 'Video Conference',
  whiteboard: 'Bảng trắng'
};

// Equipment list
export const EQUIPMENT_LIST = Object.keys(EQUIPMENT_LABELS);

// Default form data
export const DEFAULT_ROOM_FORM = {
  name: '',
  code: '',
  capacity: 20,
  room_type: 'standard',
  equipment: [],
  center_id: '',
  notes: '',
  status: 'active'
};
