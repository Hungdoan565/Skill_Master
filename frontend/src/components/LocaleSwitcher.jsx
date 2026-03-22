import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LocaleSwitcher({ className = '' }) {
  const { i18n } = useTranslation();

  const currentLanguage = useMemo(() => {
    const language = i18n.resolvedLanguage || i18n.language || 'vi';
    return language.startsWith('en') ? 'en' : 'vi';
  }, [i18n.language, i18n.resolvedLanguage]);

  const handleLanguageChange = (value) => {
    i18n.changeLanguage(value);
  };

  return (
    <div className={className}>
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-full md:w-48" aria-label="Language selector">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
          <SelectItem value="en">🇬🇧 English</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
