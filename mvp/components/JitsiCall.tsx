import React, { useEffect, useRef } from 'react';
import { X, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface JitsiCallProps {
  roomName: string;
  onClose: () => void;
  userName: string;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export const JitsiCall: React.FC<JitsiCallProps> = ({ roomName, onClose, userName }) => {
  const { t } = useLanguage();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    if (!jitsiContainerRef.current) return;

    // Configuration simplifiée pour l'aîné
    const options = {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: userName
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        // Masquer les fonctions complexes
        toolbarButtons: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
          'security'
        ],
        // Priorité au chat et au partage
        defaultRemoteDisplayName: t('Membre de la famille', 'Family member'),
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: ['microphone', 'camera', 'chat', 'hangup'],
        SETTINGS_SECTIONS: ['devices'],
        SHOW_JITSI_WATERMARK: false,
        GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
        DISPLAY_WELCOME_FOOTER: false,
      }
    };

    apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', options);

    apiRef.current.addEventListeners({
      readyToClose: () => {
        onClose();
      },
      videoConferenceTerminated: () => {
        onClose();
      }
    });

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, [roomName, userName, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Header simplifié avec bouton fermer très visible */}
      <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-white font-bold text-xl">{t('Appel Vidéo en cours', 'Video Call in progress')}</span>
        </div>
        <button
          onClick={onClose}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold transition-all active:scale-95 shadow-lg"
        >
          <X className="w-8 h-8" />
          {t('Quitter', 'Leave')}
        </button>
      </div>

      {/* Zone Jitsi */}
      <div className="flex-1 relative bg-black">
        <div ref={jitsiContainerRef} className="absolute inset-0" />
      </div>

      {/* Footer informatif */}
      <div className="bg-slate-800 p-6 flex justify-around items-center border-t border-slate-700">
        <div className="flex flex-col items-center gap-2 text-slate-300">
          <MessageSquare className="w-8 h-8 text-blue-400" />
          <span className="text-sm font-bold uppercase tracking-widest">{t('Le chat est ouvert', 'Chat is open')}</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-slate-300">
          <ImageIcon className="w-8 h-8 text-teal-400" />
          <span className="text-sm font-bold uppercase tracking-widest">{t('Partagez vos photos', 'Share your photos')}</span>
        </div>
      </div>
    </div>
  );
};
