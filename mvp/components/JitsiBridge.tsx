import React, { useEffect } from 'react';
import { Video } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const JitsiBridge: React.FC = () => {
  const { t } = useLanguage();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    
    if (room) {
      console.log('Redirection vers Jitsi pour la salle:', room);
      // On utilise window.location.replace pour sortir de la PWA vers le navigateur
      window.location.replace(`https://meet.jit.si/${room}`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <Video className="w-10 h-10" />
      </div>
      <h1 className="text-2xl font-bold mb-2">{t("Connexion à l'appel...", 'Connecting to call...')}</h1>
      <p className="text-slate-400">{t('Préparation de votre salle vidéo sécurisée.', 'Preparing your secure video room.')}</p>
    </div>
  );
};
