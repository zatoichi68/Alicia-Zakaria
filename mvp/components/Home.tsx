import React from 'react';
import { Mic, Heart, Sun, User } from 'lucide-react';
import { Screen, Persona } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HomeProps {
  onNavigate: (screen: Screen) => void;
  persona: Persona;
  onSetPersona: (p: Persona) => void;
  firstName: string;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, persona, onSetPersona, firstName }) => {
  const { t } = useLanguage();
  const handleSelectPersona = (p: Persona) => {
    onSetPersona(p);
    onNavigate(Screen.CHAT);
  };

  return (
    <div className="h-full max-w-4xl mx-auto flex flex-col">
      {/* Mobile Version - Only Alicia and Zakaria (Hidden on md and up) */}
      <div className="flex flex-col md:hidden h-full gap-4 py-2">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center">
          {t('Avec qui voulez-vous parler ?', 'Who would you like to talk to?')}
        </h2>
        <div className="flex-1 flex flex-col gap-4">
          <button
            onClick={() => handleSelectPersona('alicia')}
            className="flex-1 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-[32px] shadow-lg p-6 flex flex-col items-center justify-center gap-3 text-white active:scale-95 transition-all"
          >
            <User className="w-16 h-16" />
            <div className="text-center">
              <span className="block text-3xl font-black">Alicia</span>
              <span className="text-lg opacity-90">{t('Compagne chaleureuse', 'Warm companion')}</span>
            </div>
          </button>
          <button
            onClick={() => handleSelectPersona('zakaria')}
            className="flex-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[32px] shadow-lg p-6 flex flex-col items-center justify-center gap-3 text-white active:scale-95 transition-all"
          >
            <User className="w-16 h-16" />
            <div className="text-center">
              <span className="block text-3xl font-black">Zakaria</span>
              <span className="text-lg opacity-90">{t('Compagnon bienveillant', 'Kind companion')}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Desktop/Tablet Version (Hidden on mobile) */}
      <div className="hidden md:flex flex-col space-y-8 h-full">
        {/* Welcome Message */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-start gap-6 transition-colors">
          <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-2xl shrink-0">
            <Sun className="w-12 h-12 text-orange-500 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {t(`Bonjour, ${firstName} !`, `Hello, ${firstName}!`)}
            </h2>
            <p className="text-xl text-slate-500 dark:text-slate-400">
              {t("J'espère que vous avez bien dormi. Avec qui voulez-vous parler ?", 'I hope you slept well. Who would you like to talk to?')}
            </p>
          </div>
        </div>

        {/* Persona Selection */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onSetPersona('alicia')}
            className={`p-4 rounded-2xl flex items-center gap-4 transition-all ${persona === 'alicia'
                ? 'bg-teal-100 dark:bg-teal-900 border-2 border-teal-500'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 opacity-60'
              }`}
          >
            <div className="bg-teal-200 dark:bg-teal-800 p-3 rounded-full">
              <User className="w-8 h-8 text-teal-800 dark:text-teal-200" />
            </div>
            <div className="text-left">
              <span className="block text-xl font-bold text-slate-800 dark:text-slate-100">Alicia</span>
              <span className="text-sm text-slate-500">{t('Compagne chaleureuse', 'Warm companion')}</span>
            </div>
          </button>

          <button
            onClick={() => onSetPersona('zakaria')}
            className={`p-4 rounded-2xl flex items-center gap-4 transition-all ${persona === 'zakaria'
                ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 opacity-60'
              }`}
          >
            <div className="bg-blue-200 dark:bg-blue-800 p-3 rounded-full">
              <User className="w-8 h-8 text-blue-800 dark:text-blue-200" />
            </div>
            <div className="text-left">
              <span className="block text-xl font-bold text-slate-800 dark:text-slate-100">Zakaria</span>
              <span className="text-sm text-slate-500">{t('Compagnon bienveillant', 'Kind companion')}</span>
            </div>
          </button>
        </div>

        {/* Primary Action - Talk */}
        <button
          onClick={() => onNavigate(Screen.CHAT)}
          className={`
            flex-1 rounded-3xl shadow-lg p-8 flex flex-col items-center justify-center gap-6 text-white hover:shadow-xl transition-all transform active:scale-[0.98]
            ${persona === 'alicia'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-600 dark:from-teal-600 dark:to-emerald-700'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'}
          `}
        >
          <div className="bg-white/20 p-8 rounded-full">
            <Mic className="w-20 h-20" />
          </div>
          <span className="text-4xl font-bold">
            {t('Parler avec', 'Talk with')} {persona === 'alicia' ? 'Alicia' : 'Zakaria'}
          </span>
          <span className="text-white/80 text-xl">{t('Appuyez ici pour commencer', 'Tap here to start')}</span>
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-6">
          <button
            onClick={() => onNavigate(Screen.FAMILY)}
            className="bg-white dark:bg-slate-900 border-2 border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 flex items-center justify-center gap-3 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Heart className="w-8 h-8 text-rose-500" />
            <span className="text-xl font-bold text-slate-700 dark:text-slate-200">{t('Ma Famille', 'My Family')}</span>
          </button>

          <div className="bg-white dark:bg-slate-900 border-2 border-amber-100 dark:border-amber-900/50 rounded-2xl p-4 flex flex-col justify-center px-6">
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">14:00 - Bingo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
