import React, { useState, Suspense, lazy } from 'react';
import { Contact } from '../types';
import { Video, Phone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const JitsiCall = lazy(() => import('./JitsiCall').then(m => ({ default: m.JitsiCall })));

const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'Sophie Dubé', relation: 'Fille', imageUrl: 'https://picsum.photos/200', isOnline: true },
  { id: '2', name: 'Pierre Tremblay', relation: 'Fils', imageUrl: 'https://picsum.photos/201', isOnline: false },
  { id: '3', name: 'Julie Gagnon', relation: 'Petite-fille', imageUrl: 'https://picsum.photos/202', isOnline: true },
];

export const Family: React.FC = () => {
  const { t } = useLanguage();
  const [activeCall, setActiveCall] = useState<{ roomName: string; contactName: string } | null>(null);
  const firstName = sessionStorage.getItem('mvp_first_name') || t('Utilisateur', 'User');
  const accessCode = sessionStorage.getItem('mvp_access_code') || '0000';

  const startVideoCall = async (contact: Contact) => {
    // Génération d'un nom de salle permanent basé sur le code d'accès et le nom du contact
    const safeContactName = contact.name.replace(/\s+/g, '_').toLowerCase();
    const roomName = `AliciaZakaria_${accessCode}_${safeContactName}`;
    
    // Déclencher l'appel dans l'UI
    setActiveCall({ roomName, contactName: contact.name });

    // Tentative d'envoi de notification aux proches enregistrés
    try {
      await fetch('/api/notify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode: accessCode,
          title: t('Appel Vidéo entrant', 'Incoming video call'),
          body: t(
            `${firstName} souhaite vous voir sur Alicia & Zakaria.`,
            `${firstName} wants to see you on Alicia & Zakaria.`
          ),
          data: { roomName }
        })
      });
    } catch (e) {
      console.error('Erreur notification:', e);
    }
  };

  if (activeCall) {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-slate-900 flex items-center justify-center text-white">{t('Connexion...', 'Connecting...')}</div>}>
        <JitsiCall 
          roomName={activeCall.roomName} 
          userName={firstName} 
          onClose={() => setActiveCall(null)} 
        />
      </Suspense>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">{t('Mes Proches', 'My Loved Ones')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_CONTACTS.map((contact) => (
          <div key={contact.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-4 transition-colors">
            <div className="relative">
                <img 
                    src={contact.imageUrl} 
                    alt={contact.name} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-slate-100 dark:border-slate-700"
                />
                {contact.isOnline && (
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-slate-900" />
                )}
            </div>
            
            <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{contact.name}</h3>
                <p className="text-lg text-slate-500 dark:text-slate-400">
                  {contact.relation === 'Fille' ? t('Fille', 'Daughter') :
                    contact.relation === 'Fils' ? t('Fils', 'Son') :
                    contact.relation === 'Petite-fille' ? t('Petite-fille', 'Granddaughter') : contact.relation}
                </p>
            </div>

            <div className="flex gap-4 w-full mt-2">
                <button 
                  onClick={() => startVideoCall(contact)}
                  className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 transition-all"
                >
                    <Video className="w-6 h-6" />
                    {t('Vidéo', 'Video')}
                </button>
                <button className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all">
                    <Phone className="w-6 h-6" />
                    {t('Appel', 'Call')}
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
