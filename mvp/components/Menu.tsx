import React from 'react';
import { Utensils, Coffee, Clock, ChefHat, Settings } from 'lucide-react';
import { Screen } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface MenuProps {
  onNavigate?: (screen: Screen) => void;
}

export const Menu: React.FC<MenuProps> = ({ onNavigate }) => {
  const { language, t } = useLanguage();
  const dailyMenu = {
    date: new Date().toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', { weekday: 'long', day: 'numeric', month: 'long' }),
    diner: {
      entree: "Potage Crécy (carottes et gingembre)",
      principal: "Filet de morue aux herbes, riz sauvage et haricots verts",
      alternative: "Quiche aux épinards et fromage de chèvre",
      dessert: "Croustade aux pommes chaude"
    },
    souper: {
      entree: "Salade César classique",
      principal: "Poulet chasseur, purée de pommes de terre et pois pois",
      alternative: "Omelette aux fines herbes",
      dessert: "Mousse au chocolat noir"
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-3">
          <Utensils className="w-10 h-10 text-teal-600" />
          {t('Menu du Jour', 'Today\'s Menu')}
        </h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 capitalize">{dailyMenu.date}</p>
      </div>

      {/* Dîner */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-teal-600 p-4 flex items-center gap-3 text-white">
          <Clock className="w-6 h-6" />
          <h3 className="text-2xl font-bold">{t('Dîner (11h30 - 13h00)', 'Lunch (11:30 AM - 1:00 PM)')}</h3>
        </div>
        <div className="p-8 space-y-6">
          <MenuSection title={t('Entrée', 'Starter')} content={dailyMenu.diner.entree} />
          <MenuSection title={t('Plat Principal', 'Main Course')} content={dailyMenu.diner.principal} highlight />
          <MenuSection title={t('Option Alternative', 'Alternative Option')} content={dailyMenu.diner.alternative} italic />
          <MenuSection title={t('Dessert', 'Dessert')} content={dailyMenu.diner.dessert} />
        </div>
      </section>

      {/* Souper */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-blue-600 p-4 flex items-center gap-3 text-white">
          <Clock className="w-6 h-6" />
          <h3 className="text-2xl font-bold">{t('Souper (17h00 - 18h30)', 'Dinner (5:00 PM - 6:30 PM)')}</h3>
        </div>
        <div className="p-8 space-y-6">
          <MenuSection title={t('Entrée', 'Starter')} content={dailyMenu.souper.entree} />
          <MenuSection title={t('Plat Principal', 'Main Course')} content={dailyMenu.souper.principal} highlight />
          <MenuSection title={t('Option Alternative', 'Alternative Option')} content={dailyMenu.souper.alternative} italic />
          <MenuSection title={t('Dessert', 'Dessert')} content={dailyMenu.souper.dessert} />
        </div>
      </section>

      <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-100 dark:border-amber-900/50 p-6 rounded-2xl flex items-start gap-4">
        <ChefHat className="w-8 h-8 text-amber-600 shrink-0" />
        <p className="text-amber-800 dark:text-amber-200 text-lg italic">
          {t(
            '"Bon appétit ! N\'oubliez pas de réserver votre place pour le brunch de dimanche prochain."',
            '"Enjoy your meal! Don\'t forget to reserve your spot for next Sunday\'s brunch."'
          )}
        </p>
      </div>

      {onNavigate && (
        <div className="flex justify-center pt-8 opacity-20 hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onNavigate(Screen.MANAGEMENT)}
            className="flex items-center gap-2 text-slate-400 hover:text-teal-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-widest">{t('Portail Gestion (Mockup)', 'Management Portal (Mockup)')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

const MenuSection: React.FC<{ title: string, content: string, highlight?: boolean, italic?: boolean }> = ({ 
  title, content, highlight, italic 
}) => (
  <div className="space-y-1">
    <span className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{title}</span>
    <p className={`text-2xl ${highlight ? 'text-teal-700 dark:text-teal-400 font-bold' : 'text-slate-800 dark:text-slate-200'} ${italic ? 'italic text-slate-600 dark:text-slate-400' : ''}`}>
      {content}
    </p>
  </div>
);
