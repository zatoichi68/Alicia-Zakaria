import React, { useEffect, useState } from 'react';
import { Mic, MicOff, X, Activity } from 'lucide-react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { Screen, Persona } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface VoiceChatProps {
  onClose: () => void;
  persona: Persona;
  accessCode: string;
  memoryConsent: boolean;
  onStartCall?: (roomName: string, contactName: string) => void;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({ onClose, persona, accessCode, memoryConsent, onStartCall }) => {
  const { language, t } = useLanguage();
  const [isClosing, setIsClosing] = React.useState(false);
  const isClosingRef = React.useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [textMode, setTextMode] = useState(false);
  const [textQuery, setTextQuery] = useState('');
  const [textResponse, setTextResponse] = useState('');
  const [textLoading, setTextLoading] = useState(false);
  const [manualStopped, setManualStopped] = useState(false);
  const closingTimerRef = React.useRef<number | null>(null);
  const onCallProcheRef = React.useRef<(nom: string) => void>(undefined);

  const handleError = React.useCallback((err: string) => {
    setErrorMessage(err);
  }, []);

  const handleConnectionChange = React.useCallback((connected: boolean) => {
    if (connected) {
      isClosingRef.current = false;
      setIsClosing(false);
      setErrorMessage(null);
      setTextMode(false);
      setManualStopped(false);
    } else if (!isClosingRef.current) {
      setIsClosing(false);
    }
  }, []);

  const { isStreaming, isConnecting, startSession, stopSession, forceStopUI, sendText, volumeLevel } = useGeminiLive({
    onError: handleError,
    onConnectionStateChange: handleConnectionChange,
    persona,
    language,
    accessCode,
    memoryConsent,
    onCallProche: (nom) => onCallProcheRef.current?.(nom)
  });

  useEffect(() => {
    onCallProcheRef.current = (nom: string) => {
      console.log('📞 IA requested call for:', nom);
      const safeContactName = nom.replace(/\s+/g, '_').toLowerCase();
      const roomName = `AliciaZakaria_${accessCode}_${safeContactName}`;
      stopSession();
      onStartCall?.(roomName, nom);
    };
  }, [accessCode, stopSession, onStartCall]);

  const handleManualStop = async () => {
    if (isStreaming && !isClosing) {
      // 1. Show closing state immediately
      isClosingRef.current = true;
      setIsClosing(true);

      if (closingTimerRef.current) {
        window.clearTimeout(closingTimerRef.current);
      }

      // 2. Use the hook's graceful stop logic (it sends ARRÊT TECHNIQUE and handles fallback save)
      await stopSession(true);

      // 3. Cleanup local state
      setManualStopped(true);
      setIsClosing(false);
      isClosingRef.current = false;
      setInfoMessage(t('Session terminée.', 'Session ended.'));
    } else if (!isStreaming) {
      stopSession();
      setManualStopped(true);
    }
  };

  // Intercept the close to show status
  // We need to modify the hook to call a callback when the tool is triggered
  // But let's check for a simpler way: listen for a custom event

  useEffect(() => {
    const handleClosing = () => {
      isClosingRef.current = true;
      setIsClosing(true);
      setManualStopped(true);
      
      if (closingTimerRef.current) {
        window.clearTimeout(closingTimerRef.current);
      }
      closingTimerRef.current = window.setTimeout(() => {
        setIsClosing(false);
        setInfoMessage('Session terminée.');
        isClosingRef.current = false;
      }, 2500);
    };

    const handleRefreshing = () => {
      setInfoMessage(t('Optimisation de la connexion...', 'Optimizing connection...'));
      if (closingTimerRef.current) {
        window.clearTimeout(closingTimerRef.current);
      }
      closingTimerRef.current = window.setTimeout(() => {
        setInfoMessage(null);
      }, 2500);
    };

    window.addEventListener('session-closing', handleClosing);
    window.addEventListener('session-refreshing', handleRefreshing);

    // Auto-start session on mount (user already initiated navigation)
    startSession();
    return () => {
      stopSession(); // Cleanup on unmount
      window.removeEventListener('session-closing', handleClosing);
      window.removeEventListener('session-refreshing', handleRefreshing);
      if (closingTimerRef.current) {
        window.clearTimeout(closingTimerRef.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textQuery.trim()) return;
    setTextLoading(true);
    setTextResponse('');
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textQuery })
      });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setTextResponse(data.text || t("Je n'ai pas trouvé de réponse, désolé.", "I couldn't find an answer, sorry."));
    } catch (err) {
      setTextResponse(t('Une erreur est survenue lors de la recherche. Veuillez réessayer.', 'An error occurred during search. Please try again.'));
    } finally {
      setTextLoading(false);
    }
  };

  const isAlicia = persona === 'alicia';

  const badgeClass = isAlicia
    ? "bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200"
    : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";

  const ringClass = isAlicia ? "bg-teal-400" : "bg-blue-400";

  const avatarGradient = isAlicia
    ? "bg-gradient-to-br from-teal-400 to-emerald-500"
    : "bg-gradient-to-br from-blue-400 to-indigo-500";

  const buttonPrimary = isAlicia
    ? "bg-teal-600 dark:bg-teal-700 text-white hover:bg-teal-700 dark:hover:bg-teal-600"
    : "bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600";

  const handleMemoryDelete = async () => {
    const normalizedAccessCode = accessCode.trim();
    if (!normalizedAccessCode) return;
    setInfoMessage(null);
    try {
      const res = await fetch('/api/memory/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: normalizedAccessCode }),
      });
      if (!res.ok) throw new Error('delete failed');
      setInfoMessage(t('Mémoire effacée.', 'Memory cleared.'));
    } catch {
      setInfoMessage(t("Impossible d'effacer la mémoire.", 'Unable to clear memory.'));
    }
  };

  const statusMessage = isClosing
    ? t('Fermeture de la session...', 'Closing session...')
    : (isStreaming
      ? t('Parlez-moi de votre journée, ou demandez-moi une histoire.', 'Tell me about your day, or ask for a story.')
      : (isConnecting
        ? t('Connexion en cours...', 'Connecting...')
        : (manualStopped ? t('Session en pause.', 'Session paused.') : t('Initialisation en cours...', 'Initializing...'))));

  return (
    <div className="h-full flex flex-col items-center justify-between py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="w-full flex justify-between items-center px-4">
        <div className={`${badgeClass} px-4 py-2 rounded-full font-medium text-lg transition-colors`}>
          {t('En ligne avec', 'Online with')} {isAlicia ? 'Alicia' : 'Zakaria'}
        </div>
        <button
          onClick={onClose}
          className="bg-red-100 dark:bg-red-900/50 p-4 rounded-full text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      {/* Visualizer / Avatar */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full">
        {errorMessage && (
          <div className="w-full px-4">
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-amber-900 dark:text-amber-100">
              <p className="font-bold mb-2">{t('Microphone indisponible', 'Microphone unavailable')}</p>
              <p className="text-sm mb-4">{errorMessage}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => startSession()}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors"
                >
                  {t('Réessayer', 'Retry')}
                </button>
                <button
                  onClick={() => setTextMode(true)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('Mode texte', 'Text mode')}
                </button>
              </div>
            </div>
          </div>
        )}

        {infoMessage && (
          <div className="w-full px-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-emerald-900 dark:text-emerald-100 flex justify-between items-center">
              <p className="text-sm">{infoMessage}</p>
              <button onClick={() => setInfoMessage(null)} className="text-emerald-500 hover:text-emerald-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {textMode && (
          <div className="w-full px-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('Mode texte', 'Text mode')}</h3>
              <form onSubmit={handleTextSubmit} className="flex gap-3">
                <input
                  type="text"
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  placeholder={t('Écrivez votre message...', 'Write your message...')}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-lg text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={textLoading || !textQuery.trim()}
                  className="bg-blue-600 dark:bg-blue-700 text-white px-5 rounded-xl font-bold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
                >
                  {t('Envoyer', 'Send')}
                </button>
              </form>
              {textLoading && <p className="text-slate-500">{t('Recherche en cours...', 'Searching...')}</p>}
              {textResponse && <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{textResponse}</p>}
            </div>
          </div>
        )}

        <div className="relative">
          {/* Pulsing rings based on volume */}
          <div
            className={`absolute inset-0 ${ringClass} rounded-full opacity-20 transition-all duration-75`}
            style={{ transform: `scale(${1 + volumeLevel * 3})` }}
          />
          <div
            className={`absolute inset-0 ${ringClass} rounded-full opacity-20 transition-all duration-100 delay-75`}
            style={{ transform: `scale(${1 + volumeLevel * 4})` }}
          />

          <div className={`w-64 h-64 ${avatarGradient} rounded-full flex items-center justify-center shadow-xl relative z-10 border-8 border-white dark:border-slate-800 transition-colors`}>
            {isStreaming ? (
              <Activity className="w-24 h-24 text-white animate-pulse" />
            ) : (
              <div className="text-white text-6xl font-bold">{isAlicia ? 'A' : 'Z'}</div>
            )}
          </div>
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
            {isClosing ? t('À la prochaine !', 'See you soon!') : (isStreaming ? t('Je vous écoute...', 'I am listening...') : t('En attente...', 'Waiting...'))}
          </h2>
          <p className="text-xl text-slate-500 dark:text-slate-400">{statusMessage}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full px-4 pb-8">
        <div className="flex flex-col items-center gap-6">
          <div className="flex justify-center gap-6 flex-wrap">
            {isStreaming && (
              <button
                onClick={handleManualStop}
                disabled={isClosing}
                className="flex items-center gap-4 px-12 py-6 rounded-full text-2xl font-bold shadow-lg transition-all transform active:scale-95 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                <MicOff className="w-8 h-8" />
                {isClosing ? t('Fermeture...', 'Closing...') : t('Arrêter', 'Stop')}
              </button>
            )}
            {!isStreaming && manualStopped && (
              <button
                onClick={() => {
                  setErrorMessage(null);
                  setInfoMessage(null); // Clear session end message
                  setManualStopped(false);
                  startSession();
                }}
                className={`flex items-center gap-4 px-12 py-6 rounded-full text-2xl font-bold shadow-lg transition-all transform active:scale-95 ${buttonPrimary}`}
              >
                <Mic className="w-8 h-8" />
                {t('Reprendre', 'Resume')}
              </button>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleMemoryDelete}
              className="flex items-center gap-3 px-6 py-4 rounded-full text-lg font-bold shadow-sm transition-all transform active:scale-95 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {t('Effacer la mémoire', 'Clear memory')}
            </button>

            {isClosing && (
              <button
                onClick={() => {
                  stopSession();
                  setManualStopped(true);
                  setIsClosing(false);
                }}
                className="text-slate-400 hover:text-red-500 text-sm font-medium underline"
              >
                {t('Forcer l\'arrêt (sans sauvegarde)', 'Force stop (without saving)')}
              </button>
            )}
          </div>
        </div>
        {!memoryConsent && (
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {t('La mémoire est désactivée. Activez-la depuis l’écran d’accès si vous le souhaitez.', 'Memory is disabled. Enable it from the access screen if you want.')}
          </p>
        )}
      </div>
    </div>
  );
};
