import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export default function LocaleSwitcher({ className = '' }) {
  const { i18n } = useTranslation();

  const currentLanguage = useMemo(() => {
    const language = i18n.resolvedLanguage || i18n.language || 'vi';
    return language.startsWith('en') ? 'en' : 'vi';
  }, [i18n.language, i18n.resolvedLanguage]);

  const handleLanguageChange = (event) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <select
      value={currentLanguage}
      onChange={handleLanguageChange}
      className={`block w-full md:w-48 pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`.trim()}
      aria-label="Language selector"
    >
      <option value="vi">🇻🇳 Tiếng Việt</option>
      <option value="en">🇬🇧 English</option>
    </select>
  );
}
