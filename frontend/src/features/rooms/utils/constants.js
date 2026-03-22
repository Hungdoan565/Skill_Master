/**
 * Rooms Constants
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Room status configuration
export const STATUS_CONFIG = {
  active: { label: 'Hoạt động', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  maintenance: { label: 'Bảo trì', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  inactive: { label: 'Ngừng hoạt động', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' }
};

// Room type configuration
export const ROOM_TYPE_CONFIG = {
  standard: { label: 'Phòng học', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  lab: { label: 'Phòng Lab', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  meeting: { label: 'Phòng họp', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  online: { label: 'Online', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' }
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

/**
 * Extract zone/block from room code
 * Examples: "E2-01" → "E", "A3-05" → "A", "LAB1" → "LAB", "P101" → "P"
 */
export const extractZoneFromCode = (code) => {
  if (!code) return 'Khác';

  // Pattern 1: Letter followed by number-number (e.g., "E2-01" → "E")
  const match1 = code.match(/^([A-Z]+)\d+-\d+/i);
  if (match1) return match1[1].toUpperCase();

  // Pattern 2: Letter(s) followed by number (e.g., "LAB1" → "LAB", "P101" → "P")
  const match2 = code.match(/^([A-Z]+)\d+/i);
  if (match2) return match2[1].toUpperCase();

  // Pattern 3: Just letters (e.g., "MTG" → "MTG")
  const match3 = code.match(/^([A-Z]+)/i);
  if (match3) return match3[1].toUpperCase();

  return 'Khác';
};

/**
 * Group rooms by zone and sort them
 */
export const groupAndSortRoomsByZone = (rooms) => {
  // Group by zone
  const grouped = rooms.reduce((acc, room) => {
    const zone = extractZoneFromCode(room.code);
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(room);
    return acc;
  }, {});

  // Sort rooms within each zone by code
  Object.keys(grouped).forEach(zone => {
    grouped[zone].sort((a, b) => {
      // Natural sort for codes like E2-01, E2-02, E2-10, E3-01
      return (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  });

  return grouped;
};

/**
 * Get all unique zones from rooms list
 */
export const getUniqueZones = (rooms) => {
  const zones = rooms.map(room => extractZoneFromCode(room.code));
  return [...new Set(zones)].sort();
};

/**
 * Calculate stats for a center (zones, rooms, total capacity)
 */
export const getCenterStats = (rooms) => {
  const zones = getUniqueZones(rooms);
  const totalCapacity = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0);

  return {
    zones: zones.length,
    rooms: rooms.length,
    capacity: totalCapacity,
    activeRooms: rooms.filter(r => r.status === 'active').length,
    maintenanceRooms: rooms.filter(r => r.status === 'maintenance').length
  };
};

/**
 * Group rooms by center, then by zone
 */
export const groupRoomsByCenterAndZone = (rooms, centers) => {
  const result = {};

  centers.forEach(center => {
    const centerRooms = rooms.filter(r => r.center_id === center.id);
    const groupedByZone = groupAndSortRoomsByZone(centerRooms);

    result[center.id] = {
      center,
      zones: groupedByZone,
      stats: getCenterStats(centerRooms)
    };
  });

  return result;
};
