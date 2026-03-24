import { ATTENDANCE_STATUS_LABELS } from './constants';

const MOJIBAKE_PATTERN = /Ã|Â|Ä|Æ|áº|á»/;

const KNOWN_TEXT_REPLACEMENTS = {
  'Äáº¡t': 'Đạt',
  'Äáº­u': 'Đậu',
  'KhÃ´ng Äáº¡t': 'Không đạt',
  'CÃ³ máº·t': 'Có mặt',
  'CÃƒÂ³ mÃ¡ÂºÂ·t': 'Có mặt',
  'CÃ³ phÃ©p': 'Có phép',
  'CÃƒÂ³ phÃƒÂ©p': 'Có phép',
  'Trá»': 'Trễ',
  'TrÃ¡Â»â€¦': 'Trễ',
  'Váº¯ng': 'Vắng',
  'VÃ¡ÂºÂ¯ng': 'Vắng',
};

const PASS_RATE_LABELS = {
  pass: 'Đạt',
  passed: 'Đạt',
  'đạt': 'Đạt',
  'đậu': 'Đạt',
  fail: 'Không đạt',
  failed: 'Không đạt',
  'không đạt': 'Không đạt',
  'rớt': 'Không đạt',
  'trượt': 'Không đạt',
};

const ATTENDANCE_LABEL_ALIASES = {
  'có mặt': ATTENDANCE_STATUS_LABELS.present,
  'vắng': ATTENDANCE_STATUS_LABELS.absent,
  'trễ': ATTENDANCE_STATUS_LABELS.late,
  'có phép': ATTENDANCE_STATUS_LABELS.excused,
};

function repairMojibake(value) {
  if (typeof value !== 'string' || !MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  if (KNOWN_TEXT_REPLACEMENTS[value]) {
    return KNOWN_TEXT_REPLACEMENTS[value];
  }

  try {
    const bytes = Uint8Array.from([...value].map((char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8').decode(bytes);

    if (!decoded || decoded.includes('�')) {
      return value;
    }

    return decoded;
  } catch {
    return value;
  }
}

function normalizeLabelText(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return repairMojibake(value).trim().replace(/\s+/g, ' ');
}

export function normalizePassRateLabel(value) {
  const normalized = normalizeLabelText(value);

  if (typeof normalized !== 'string' || normalized.length === 0) {
    return normalized;
  }

  return PASS_RATE_LABELS[normalized.toLowerCase()] ?? normalized;
}

export function normalizeAttendanceStatusLabel(value) {
  const normalized = normalizeLabelText(value);

  if (typeof normalized !== 'string' || normalized.length === 0) {
    return normalized;
  }

  return ATTENDANCE_STATUS_LABELS[normalized] ?? ATTENDANCE_LABEL_ALIASES[normalized.toLowerCase()] ?? normalized;
}

export function normalizeChartData(entries, normalizeName) {
  if (!Array.isArray(entries)) {
    return [];
  }

  if (typeof normalizeName !== 'function') {
    return entries.slice();
  }

  return entries.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      return entry;
    }

    const normalizedName = normalizeName(entry.name);

    if (normalizedName === entry.name) {
      return entry;
    }

    return {
      ...entry,
      name: normalizedName,
    };
  });
}
