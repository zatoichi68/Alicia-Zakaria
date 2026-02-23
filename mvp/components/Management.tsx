import React from 'react';
import {
  BarChart3, 
  Users, 
  Utensils, 
  Calendar, 
  Stethoscope, 
  Plus, 
  TrendingUp,
  Clock,
  Settings as SettingsIcon,
  Search,
  Phone
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Management: React.FC = () => {
  const { t } = useLanguage();
  const stats = [
    { label: t('Utilisateurs Actifs', 'Active Users'), value: '124', change: '+12%', icon: <Users className="w-6 h-6" />, color: 'blue' },
    { label: t('Conversations / Jour', 'Conversations / Day'), value: '458', change: '+5%', icon: <TrendingUp className="w-6 h-6" />, color: 'teal' },
    { label: t('Temps Moyen', 'Average Time'), value: t('18 min', '18 min'), change: '-2%', icon: <Clock className="w-6 h-6" />, color: 'amber' },
    { label: t('Alertes Bien-être', 'Wellness Alerts'), value: '3', change: t('Stable', 'Stable'), icon: <Stethoscope className="w-6 h-6" />, color: 'rose' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-bold text-slate-800 dark:text-white">{t('Portail Gestion', 'Management Portal')}</h2>
          <p className="text-xl text-slate-500 dark:text-slate-400">{t("Résidence Les Jardins d'Automne", 'Les Jardins d\'Automne Residence')}</p>
        </div>
        <button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95">
          <Plus className="w-5 h-5" />
          {t('Nouvelle Publication', 'New Post')}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/30 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                {stat.icon}
              </div>
              <span className={`text-sm font-bold ${stat.change.startsWith('+') ? 'text-emerald-500' : stat.change === 'Stable' ? 'text-slate-400' : 'text-rose-500'}`}>
                {stat.change}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</span>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Updates */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Edit Sections */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Utensils className="w-5 h-5 text-teal-600" />
                {t('Mise à jour du Menu', 'Menu Update')}
              </h3>
              <button className="text-teal-600 font-bold hover:underline">{t('Historique', 'History')}</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">{t('Dîner (Principal)', 'Lunch (Main)')}</label>
                  <input type="text" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-teal-500 outline-none transition-all dark:text-white" defaultValue="Filet de morue aux herbes" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">{t('Souper (Principal)', 'Dinner (Main)')}</label>
                  <input type="text" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-teal-500 outline-none transition-all dark:text-white" defaultValue="Poulet chasseur" />
                </div>
              </div>
              <button className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                {t('Enregistrer les menus de la semaine', 'Save weekly menus')}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Calendar className="w-5 h-5 text-blue-600" />
                {t('Activités à venir', 'Upcoming activities')}
              </h3>
              <button className="text-blue-600 font-bold hover:underline">{t('Gérer le calendrier', 'Manage calendar')}</button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { time: '14:00', name: 'Bingo musical', location: 'Grande Salle' },
                { time: '16:00', name: 'Atelier peinture', location: 'Studio' },
                { time: '19:00', name: "Cinéma : La Passion d'Augustine", location: 'Théâtre' },
              ].map((act, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-blue-600">{act.time}</span>
                    <div>
                      <span className="block font-bold text-slate-800 dark:text-white">{act.name}</span>
                      <span className="text-sm text-slate-500">{act.location}</span>
                    </div>
                  </div>
                  <SettingsIcon className="w-5 h-5 text-slate-300 cursor-pointer" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Personnel & Info */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
              <Stethoscope className="w-5 h-5 text-rose-500" />
              {t('Personnel de service', 'On-duty staff')}
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                <div className="w-12 h-12 bg-rose-200 rounded-full flex items-center justify-center font-bold text-rose-700">JS</div>
                <div>
                  <span className="block font-bold text-slate-800 dark:text-white">Julie Savard</span>
                  <span className="text-sm text-rose-600 font-bold">{t('Infirmière de garde', 'On-duty nurse')}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-transparent">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-700">PL</div>
                <div>
                  <span className="block font-bold text-slate-800 dark:text-white">Pierre-Luc Fortin</span>
                  <span className="text-sm text-slate-500">{t('Récréologue', 'Recreation specialist')}</span>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
              {t('Modifier l\'horaire', 'Edit schedule')}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
              <Phone className="w-5 h-5 text-indigo-500" />
              {t('Ligne Téléphonique', 'Phone Line')}
            </h3>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
              <span className="block text-sm font-bold text-indigo-600 uppercase mb-1">{t('Numéro Pilote', 'Pilot number')}</span>
              <p className="text-2xl font-mono font-bold text-slate-800 dark:text-white">1-800-ALICIA-1</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-amber-600 font-medium">{t('En cours de configuration (Twilio)', 'Setup in progress (Twilio)')}</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500 leading-relaxed">
              {t(
                'Permettra aux résidents sans tablette de discuter avec AlicIA et ZakarIA via n\'importe quel téléphone.',
                'Will allow residents without tablets to talk with AlicIA and ZakarIA via any phone.'
              )}
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <h3 className="text-xl font-bold mb-2">{t('Conseil IA du jour', 'AI tip of the day')}</h3>
            <div className="space-y-4 mb-4">
              <p className="opacity-90 leading-relaxed border-l-4 border-white/30 pl-4">
                "L'utilisation de Zakaria a augmenté de 40% chez les hommes de l'aile B ce matin suite à la victoire des Canadiens."
              </p>
              <p className="opacity-90 leading-relaxed border-l-4 border-rose-400 pl-4">
                "Analyse des sentiments : Plusieurs résidents signalent un manque de variété dans le menu. Attention : le potage est souvent rapporté comme étant tiède."
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold bg-white/20 w-fit px-3 py-1 rounded-full cursor-pointer hover:bg-white/30 transition-colors">
              <BarChart3 className="w-4 h-4" />
              {t('Voir le rapport complet', 'See full report')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
