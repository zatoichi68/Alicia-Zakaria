import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { Family } from './components/Family';
import { Activities } from './components/Activities';
import { SearchAssistant } from './components/SearchAssistant';
import { Menu } from './components/Menu';
import { Management } from './components/Management';
import { Screen, Persona } from './types';
import Lock from 'lucide-react/dist/esm/icons/lock';
import { useLanguage } from './context/LanguageContext';
import { requestNotificationPermission } from './utils/notifications';

// Lazy loading components to avoid initialization issues
const VoiceChat = lazy(() => import('./components/VoiceChat').then(m => ({ default: m.VoiceChat })));
const JitsiCall = lazy(() => import('./components/JitsiCall').then(m => ({ default: m.JitsiCall })));
const FamilyPortal = lazy(() => import('./components/FamilyPortal').then(m => ({ default: m.FamilyPortal })));
const JitsiBridge = lazy(() => import('./components/JitsiBridge').then(m => ({ default: m.JitsiBridge })));

function App() {
  const { language, t } = useLanguage();
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'famille') return Screen.FAMILY_PORTAL;
    if (params.get('mode') === 'family') return Screen.FAMILY_PORTAL;
    if (params.get('mode') === 'jitsi') return Screen.JITSI_BRIDGE;
    return Screen.HOME;
  });
  const [currentPersona, setCurrentPersona] = useState<Persona>('alicia');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => sessionStorage.getItem('mvp_authorized') === 'true');
  const [accessCode, setAccessCode] = useState<string>(() => sessionStorage.getItem('mvp_access_code') || '');
  const [firstName, setFirstName] = useState<string>(() => sessionStorage.getItem('mvp_first_name') || '');
  const [error, setError] = useState<string>('');
  const [memoryConsent, setMemoryConsent] = useState<boolean>(() => sessionStorage.getItem('mvp_memory_consent') === 'true');
  const [activeVideoCall, setActiveVideoCall] = useState<{ roomName: string; contactName: string } | null>(null);

  // Derive public screen status from state
  const isPublicScreen = currentScreen === Screen.FAMILY_PORTAL || currentScreen === Screen.JITSI_BRIDGE;

  // Sync screen with URL params + PERSISTENT FIRESTORE CHECK (iOS Fix)
  useEffect(() => {
    const checkForCalls = async () => {
      // 1. D'abord, vérifier l'URL (si iOS l'a gardée)
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'jitsi' && params.get('room')) {
        window.location.replace(`https://meet.jit.si/${params.get('room')}`);
        return;
      }

      // 2. Si URL vide, vérifier Firestore avec notre Token
      try {
        const token = await requestNotificationPermission();
        if (token) {
          // On vérifie s'il y a un appel récent (< 2 min) pour nous
          // On passe par l'API pour éviter d'importer tout Firebase client ici
          const res = await fetch('/api/memory/get_call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.roomName) {
              console.log('Firestore Signal: Redirection vers', data.roomName);
              window.location.replace(`https://meet.jit.si/${data.roomName}`);
            }
          }
        }
      } catch (e) {
        console.warn('Call check failed:', e);
      }
    };

    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      
      // Détection par Hash (#join=) - LE PLUS FIABLE SUR IOS
      const hash = window.location.hash;
      if (hash.startsWith('#join=')) {
        const room = hash.replace('#join=', '');
        if (room) {
          console.log('Hash-Link: Redirection vers', room);
          window.location.replace(`https://meet.jit.si/${room}`);
          return;
        }
      }

      if (mode === 'jitsi') setCurrentScreen(Screen.JITSI_BRIDGE);
      else if (mode === 'famille' || mode === 'family') setCurrentScreen(Screen.FAMILY_PORTAL);
    };

    checkForCalls();
    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    navigator.serviceWorker?.addEventListener('message', (e) => {
      if (e.data?.type === 'NAVIGATE_JITSI') window.location.replace(`https://meet.jit.si/${e.data.roomName}`);
    });

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim() === '12345') {
      if (!firstName.trim()) {
        setError(t('Veuillez entrer votre prénom', 'Please enter your first name'));
        return;
      }
      const combinedId = `${accessCode.trim()}_${firstName.trim()}`;
      setIsAuthorized(true);
      sessionStorage.setItem('mvp_authorized', 'true');
      sessionStorage.setItem('mvp_access_code', accessCode.trim());
      sessionStorage.setItem('mvp_first_name', firstName.trim());
      sessionStorage.setItem('mvp_combined_id', combinedId);
      sessionStorage.setItem('mvp_memory_consent', memoryConsent ? 'true' : 'false');
      setError('');
    } else {
      setError(t('Code d\'accès incorrect', 'Incorrect access code'));
    }
  };

  const handleChatClose = useCallback(() => {
    setCurrentScreen(Screen.HOME);
  }, []);

  // 1. DÉTECTION PRIORITAIRE DES ÉCRANS PUBLICS (Bypass total)
  if (currentScreen === Screen.JITSI_BRIDGE) {
    return (
      <Suspense fallback={null}>
        <JitsiBridge />
      </Suspense>
    );
  }

  if (currentScreen === Screen.FAMILY_PORTAL) {
    return (
      <Suspense fallback={
        <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <FamilyPortal />
      </Suspense>
    );
  }

  const renderScreen = () => {
    const combinedId = sessionStorage.getItem('mvp_combined_id') || '';

    if (activeVideoCall) {
      return (
        <JitsiCall 
          roomName={activeVideoCall.roomName} 
          userName={firstName} 
          onClose={() => setActiveVideoCall(null)} 
        />
      );
    }

    switch (currentScreen) {
      case Screen.HOME:
        return <Home onNavigate={setCurrentScreen} persona={currentPersona} onSetPersona={setCurrentPersona} firstName={firstName} />;
      case Screen.FAMILY:
        return <Family />;
      case Screen.ACTIVITIES:
        return <Activities onNavigate={setCurrentScreen} />;
      case Screen.SEARCH:
        return <SearchAssistant />;
      case Screen.MENU:
        return <Menu onNavigate={setCurrentScreen} />;
      case Screen.MANAGEMENT:
        return <Management />;
      case Screen.CHAT:
        return (
          <VoiceChat 
            onClose={handleChatClose} 
            persona={currentPersona} 
            accessCode={combinedId} 
            memoryConsent={memoryConsent}
            onStartCall={(room, name) => setActiveVideoCall({ roomName: room, contactName: name })}
          />
        );
      default:
        return <Home onNavigate={setCurrentScreen} persona={currentPersona} onSetPersona={setCurrentPersona} firstName={firstName} />;
    }
  };

  // 2. VÉRIFICATION D'AUTORISATION (Uniquement pour le mode résident)
  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="bg-teal-100 dark:bg-teal-900/30 p-4 rounded-full">
              <Lock className="w-12 h-12 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{t('Bienvenue', 'Welcome')}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg">{t('Entrez vos informations pour commencer.', 'Enter your details to begin.')}</p>
            </div>

            <form onSubmit={handleAccessSubmit} className="w-full space-y-4">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder={t('Votre code', 'Your code')}
                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xl text-center focus:border-teal-500 outline-none transition-all dark:text-white"
              />
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t('Votre prénom', 'Your first name')}
                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xl text-center focus:border-teal-500 outline-none transition-all dark:text-white"
              />
              <label className="flex items-start gap-3 text-left text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={memoryConsent}
                  onChange={(e) => setMemoryConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>
                  {t(
                    'J’autorise la sauvegarde d’un résumé de chaque conversation pour personnaliser l’expérience pendant 6 mois.',
                    'I allow saving a summary of each conversation to personalize the experience for 6 months.'
                  )}
                </span>
              </label>
              {error && <p className="text-red-500 font-medium">{error}</p>}
              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl text-xl transition-all shadow-lg active:scale-95"
              >
                {t('Entrer', 'Enter')}
              </button>
            </form>

            <div className="w-full pt-6 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  const room = params.get('room');
                  if (room) window.location.replace(`https://meet.jit.si/${room}`);
                  else window.location.href = `/app/?mode=${language === 'fr' ? 'famille' : 'family'}&lang=${language}`;
                }}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                {t('Accès Espace Famille', 'Family Portal Access')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentScreen={currentScreen} 
      onNavigate={setCurrentScreen}
    >
      <Suspense fallback={
        <div className="h-full flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        {renderScreen()}
      </Suspense>
    </Layout>
  );
}

export default App;
