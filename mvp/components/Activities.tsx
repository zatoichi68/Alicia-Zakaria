import React from 'react';
import { Newspaper, Music, Trophy, Globe, ArrowRight } from 'lucide-react';
import { Screen } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ActivitiesProps {
  onNavigate: (screen: Screen) => void;
}

export const Activities: React.FC<ActivitiesProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-8 pb-8">
       {/* Search Section - Featured */}
       <button 
         onClick={() => onNavigate(Screen.SEARCH)}
         className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 rounded-3xl p-6 shadow-lg flex items-center gap-6 text-white group active:scale-[0.98] transition-all"
       >
          <div className="bg-white/20 p-4 rounded-2xl">
              <Globe className="w-12 h-12 text-white" />
          </div>
          <div className="flex-1 text-left">
              <h2 className="text-2xl font-bold">{t('Recherche Internet', 'Internet Search')}</h2>
              <p className="text-blue-100 text-lg">{t('Trouvez des informations, des recettes, ou des réponses à vos questions.', 'Find information, recipes, or answers to your questions.')}</p>
          </div>
          <ArrowRight className="w-10 h-10 text-blue-200 group-hover:translate-x-2 transition-transform" />
       </button>

       <section>
           <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
               <Newspaper className="w-8 h-8 text-teal-600 dark:text-teal-400" />
               {t('Nouvelles du Québec', 'Quebec News')}
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                    <img src="https://picsum.photos/800/400?grayscale" alt="News" className="w-full h-48 object-cover" />
                    <div className="p-6">
                        <span className="text-teal-600 dark:text-teal-400 font-bold text-sm uppercase mb-2 block">{t('Culture', 'Culture')}</span>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t("Le Festival d'été de Québec dévoile sa programmation", 'Quebec Summer Festival reveals its lineup')}</h3>
                        <p className="text-slate-500 dark:text-slate-400">{t("De grands artistes attendus sur les plaines d'Abraham cette année...", 'Major artists are expected on the Plains of Abraham this year...')}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                    <img src="https://picsum.photos/800/401?grayscale" alt="News" className="w-full h-48 object-cover" />
                    <div className="p-6">
                        <span className="text-teal-600 dark:text-teal-400 font-bold text-sm uppercase mb-2 block">{t('Société', 'Society')}</span>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('Investissement majeur dans les résidences pour aînés', 'Major investment in senior living residences')}</h3>
                        <p className="text-slate-500 dark:text-slate-400">{t('Le gouvernement annonce de nouvelles mesures pour le bien-être...', 'The government announces new measures for well-being...')}</p>
                    </div>
                </div>
           </div>
       </section>

       <section>
           <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
               <Trophy className="w-8 h-8 text-amber-500 dark:text-amber-400" />
               {t('Jeux Cognitifs', 'Cognitive Games')}
           </h2>
           <div className="grid grid-cols-2 gap-4">
               <button className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl border-2 border-amber-100 dark:border-amber-900/50 text-left hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                   <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100">{t('Mots Croisés', 'Crossword')}</h3>
                   <p className="text-amber-700 dark:text-amber-300">{t('Facile • 10 mins', 'Easy • 10 min')}</p>
               </button>
               <button className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/50 text-left hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                   <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">Sudoku</h3>
                   <p className="text-indigo-700 dark:text-indigo-300">{t('Moyen • 15 mins', 'Medium • 15 min')}</p>
               </button>
           </div>
       </section>
        
       <section>
           <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
               <Music className="w-8 h-8 text-rose-500 dark:text-rose-400" />
               {t('Musique Nostalgie', 'Nostalgia Music')}
           </h2>
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-colors">
               <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                   <Music className="w-8 h-8 text-slate-400 dark:text-slate-500" />
               </div>
               <div className="flex-1">
                   <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('Les grands classiques français', 'Great French classics')}</h3>
                   <p className="text-slate-500 dark:text-slate-400">{t('Édith Piaf, Charles Aznavour...', 'Edith Piaf, Charles Aznavour...')}</p>
               </div>
               <button className="bg-rose-500 text-white px-6 py-2 rounded-full font-bold hover:bg-rose-600 transition-colors">
                   {t('Écouter', 'Listen')}
               </button>
           </div>
       </section>
    </div>
  );
};
