import React from 'react';
import { Screen } from '../types';
import { Home, Users, Gamepad2, Settings, ArrowLeft, Moon, Sun, Utensils } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentScreen, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Top Bar - High Visibility (Hidden on mobile) */}
      <header className="hidden md:flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 items-center justify-between shadow-sm shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-4">
          {currentScreen !== Screen.HOME && (
            <button 
              onClick={() => onNavigate(Screen.HOME)}
              className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
            >
              <ArrowLeft className="w-8 h-8 text-slate-700 dark:text-slate-200" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">AlicIA et ZakarIA</h1>
            <p className="text-teal-600 dark:text-teal-400 font-semibold text-sm tracking-wide uppercase">
              {t('Briser la Solitude Ensemble', 'Breaking Loneliness Together')}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-lg leading-none mt-1">
              {new Date().toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors"
            >
              {language === 'fr' ? 'EN' : 'FR'}
            </button>
            <button 
              onClick={toggleTheme}
              className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
            </button>
            <div className="px-4 py-2 bg-blue-50 dark:bg-slate-800 rounded-lg border border-blue-100 dark:border-slate-700">
                <span className="text-blue-800 dark:text-blue-200 font-semibold text-lg">
                  {language === 'fr' ? 'Québec ⛅ -5°C' : 'Quebec ⛅ -5°C'}
                </span>
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {children}
      </main>

      {/* Bottom Navigation - Large touch targets (Hidden on mobile) */}
      {currentScreen !== Screen.CHAT && (
        <nav className="hidden md:block bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe shrink-0 transition-colors duration-300">
          <div className="flex justify-around items-stretch h-24">
            <NavButton 
              icon={<Home className="w-8 h-8" />} 
              label={t('Accueil', 'Home')}
              isActive={currentScreen === Screen.HOME}
              onClick={() => onNavigate(Screen.HOME)} 
            />
            <NavButton 
              icon={<Users className="w-8 h-8" />} 
              label={t('Famille', 'Family')}
              isActive={currentScreen === Screen.FAMILY}
              onClick={() => onNavigate(Screen.FAMILY)} 
            />
            <NavButton 
              icon={<Gamepad2 className="w-8 h-8" />} 
              label={t('Activités', 'Activities')}
              isActive={currentScreen === Screen.ACTIVITIES}
              onClick={() => onNavigate(Screen.ACTIVITIES)} 
            />
            <NavButton 
              icon={<Utensils className="w-8 h-8" />} 
              label="Menu"
              isActive={currentScreen === Screen.MENU}
              onClick={() => onNavigate(Screen.MENU)} 
            />
          </div>
        </nav>
      )}
    </div>
  );
};

const NavButton: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }> = ({ 
  icon, label, isActive, onClick 
}) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center gap-1 active:bg-slate-50 dark:active:bg-slate-800 transition-colors 
      ${isActive 
        ? 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30' 
        : 'text-slate-500 dark:text-slate-400'}`}
  >
    <div className={`${isActive ? 'scale-110' : ''} transition-transform`}>{icon}</div>
    <span className={`text-lg font-medium ${isActive ? 'font-bold' : ''}`}>{label}</span>
  </button>
);
