import { useTranslation } from 'react-i18next';
import { Moon, Sun, Globe } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { Button } from '../ui/Button';

export function Header() {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useThemeStore();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fa' ? 'en' : 'fa';
    i18n.changeLanguage(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'fa' ? 'rtl' : 'ltr';
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {t('app.name')}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="!px-3"
          title={t('language.fa')}
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium">{i18n.language === 'fa' ? 'EN' : 'فا'}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="!px-3"
          title={t('theme.toggle')}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
