import { Font } from '@react-pdf/renderer';
import QRCode from 'qrcode';

// ============================================================
// FONT REGISTRATION — Lazy loaded from Google Fonts CDN
// ============================================================

const GOOGLE_FONTS_BASE = 'https://fonts.gstatic.com/s';

// Classic Gold template fonts
Font.register({
  family: 'Cormorant Garamond',
  fonts: [
    { src: `${GOOGLE_FONTS_BASE}/cormorantgaramond/v16/co3YmX5slCNuHLi8bLeY9MK7whWMhyjYrEtFmSq7.ttf`, fontWeight: 400 },
    { src: `${GOOGLE_FONTS_BASE}/cormorantgaramond/v16/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtKky2F7i4.ttf`, fontWeight: 600 },
    { src: `${GOOGLE_FONTS_BASE}/cormorantgaramond/v16/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqU9Nky2F7i4.ttf`, fontWeight: 700 },
  ],
});

Font.register({
  family: 'Great Vibes',
  src: `${GOOGLE_FONTS_BASE}/greatvibes/v18/RWmMoKWR9v4ksMfaWd_JN9XFiaQ.ttf`,
});

// Modern Blue template fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: `${GOOGLE_FONTS_BASE}/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf`, fontWeight: 400 },
    { src: `${GOOGLE_FONTS_BASE}/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hjQ.ttf`, fontWeight: 600 },
    { src: `${GOOGLE_FONTS_BASE}/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.ttf`, fontWeight: 700 },
  ],
});

Font.register({
  family: 'Poppins',
  fonts: [
    { src: `${GOOGLE_FONTS_BASE}/poppins/v22/pxiEyp8kv8JHgFVrFJA.ttf`, fontWeight: 400 },
    { src: `${GOOGLE_FONTS_BASE}/poppins/v22/pxiByp8kv8JHgFVrLEj6V1s.ttf`, fontWeight: 600 },
    { src: `${GOOGLE_FONTS_BASE}/poppins/v22/pxiByp8kv8JHgFVrLCz7V1s.ttf`, fontWeight: 700 },
  ],
});

// Professional Purple template fonts
Font.register({
  family: 'JetBrains Mono',
  fonts: [
    { src: `${GOOGLE_FONTS_BASE}/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.ttf`, fontWeight: 400 },
    { src: `${GOOGLE_FONTS_BASE}/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjFVyDhw.ttf`, fontWeight: 700 },
  ],
});

// Elegant Warm template fonts
Font.register({
  family: 'Lora',
  fonts: [
    { src: `${GOOGLE_FONTS_BASE}/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787weuyJGmKxemMeZ.ttf`, fontWeight: 400 },
    { src: `${GOOGLE_FONTS_BASE}/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787z5vCJGmKxemMeZ.ttf`, fontWeight: 600 },
    { src: `${GOOGLE_FONTS_BASE}/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787zAvCJGmKxemMeZ.ttf`, fontWeight: 700 },
  ],
});

Font.register({
  family: 'Satisfy',
  src: `${GOOGLE_FONTS_BASE}/satisfy/v21/rP2Hp2yn6lkG50LOAZMSo3-v.ttf`,
});

// Fallback — disable hyphenation for Vietnamese text
Font.registerHyphenationCallback((word) => [word]);

// ============================================================
// QR CODE GENERATION — Returns data URL for React-PDF <Image>
// ============================================================

/**
 * Generate QR code as data URL for embedding in React-PDF
 * @param {string} url - The URL to encode (verification link)
 * @param {object} options - QR code options
 * @returns {Promise<string>} - Data URL (PNG base64)
 */
export async function generateQRDataURL(url, options = {}) {
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: options.width || 120,
      margin: options.margin || 1,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (error) {
    console.warn('QR code generation failed:', error);
    return null;
  }
}

/**
 * Build the public verification URL for a certificate
 * @param {string} certificateNumber - The certificate number (e.g., SM-202602-0001)
 * @returns {string} - Full verification URL
 */
export function getVerificationURL(certificateNumber) {
  const baseUrl = window.location.origin;
  return `${baseUrl}/verify-certificate/${certificateNumber}`;
}

// ============================================================
// DATE FORMATTING — For certificate display
// ============================================================

/**
 * Format date for certificate (English format)
 * @param {string|Date} date
 * @returns {string} - e.g., "February 26, 2026"
 */
export function formatCertificateDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date for certificate (Vietnamese format)
 * @param {string|Date} date
 * @returns {string} - e.g., "Ngày 26 tháng 02 năm 2026"
 */
export function formatCertificateDateVN(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `Ngày ${day} tháng ${month} năm ${year}`;
}

// ============================================================
// GRADE HELPERS
// ============================================================

const GRADE_MAP = {
  'Xuất sắc': 'DISTINCTION',
  'Giỏi': 'MERIT',
  'Khá': 'CREDIT',
  'Đạt': 'PASS',
};

/**
 * Get English grade equivalent
 * @param {string} vietnameseGrade
 * @returns {{ vi: string, en: string }}
 */
export function getGradeInfo(vietnameseGrade) {
  return {
    vi: vietnameseGrade,
    en: GRADE_MAP[vietnameseGrade] || vietnameseGrade,
  };
}
