import React, { useState } from 'react';
import { Bell, BellOff, ShieldCheck, Copy, Check } from 'lucide-react';
import { requestNotificationPermission } from '../utils/notifications';
import { useLanguage } from '../context/LanguageContext';

export const FamilyPortal: React.FC = () => {
  const { language, t } = useLanguage();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'saving' | 'success'>('idle');
  const [copied, setCopy] = useState(false);
  const [name, setName] = useState('');
  const [residentCode, setResidentCode] = useState('');
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setDebugLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString(language === 'fr' ? 'fr-CA' : 'en-CA')} - ${msg}`]);
  };

  const handleActivate = async () => {
    if (!name.trim() || !residentCode.trim()) {
      addLog(t('⚠️ Nom ou code manquant', '⚠️ Missing name or code'));
      return;
    }

    addLog(t('🚀 Demande de permission...', '🚀 Requesting permission...'));
    setStatus('requesting');

    try {
      const fcmToken = await requestNotificationPermission();

      if (fcmToken) {
        addLog(t('✅ Token reçu !', '✅ Token received!'));
        setToken(fcmToken);
        setStatus('saving');

        addLog(t('📡 Envoi au serveur...', '📡 Sending to server...'));
        const res = await fetch('/api/family/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessCode: residentCode.trim(),
            token: fcmToken,
            familyName: name.trim(),
          }),
        });

        if (res.ok) {
          addLog(t('🎉 Liaison réussie !', '🎉 Link successful!'));
          setStatus('success');
        } else {
          addLog(`❌ API error: ${res.status}`);
          setStatus('denied');
        }
      }
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`);
      console.error('Registration error:', e);
      setStatus('denied');
    }
  };

  const copyToClipboard = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopy(true);
      setTimeout(() => setCopy(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full w-fit mx-auto">
            <ShieldCheck className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{t('Espace Famille', 'Family Portal')}</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t('Activez les notifications pour recevoir les appels vidéo de votre proche.', 'Enable notifications to receive your loved one\'s video calls.')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase">{t('Code d\'accès du Résident', 'Resident access code')}</label>
            <input
              type="text"
              value={residentCode}
              onChange={(e) => setResidentCode(e.target.value)}
              placeholder="ex: 12345"
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-blue-500 outline-none transition-all dark:text-white text-center font-mono text-2xl tracking-widest"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase">{t('Votre Nom', 'Your Name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('ex: Sophie Dubé', 'e.g. Sophie Dubé')}
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-blue-500 outline-none transition-all dark:text-white"
            />
          </div>

          {status !== 'success' ? (
            <button
              onClick={handleActivate}
              disabled={!name.trim() || !residentCode.trim() || status === 'requesting' || status === 'saving'}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl text-xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95"
            >
              {status === 'requesting' ? t('Permission...', 'Permission...') : status === 'saving' ? t('Liaison...', 'Linking...') : (
                <>
                  <Bell className="w-6 h-6" />
                  {t('Lier mon téléphone', 'Link my phone')}
                </>
              )}
            </button>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-800 rounded-2xl p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                <Check className="w-6 h-6" />
                {t('Appareil Lié !', 'Device linked!')}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('Vous recevrez une alerte sur ce téléphone dès que votre proche lancera un appel vidéo.', 'You will receive an alert on this phone as soon as your loved one starts a video call.')}
              </p>
            </div>
          )}
        </div>

        {debugLog.length > 0 && (
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-xs space-y-1">
            {debugLog.map((log, i) => (
              <div key={i} className="text-slate-500">{log}</div>
            ))}
          </div>
        )}

        {token && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-mono text-slate-400 mb-2 truncate">TOKEN: {token}</p>
            <button
              onClick={copyToClipboard}
              className="w-full py-2 text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center justify-center gap-2 hover:underline"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t('Copié !', 'Copied!') : t('Copier mon Token pour test', 'Copy my token for testing')}
            </button>
          </div>
        )}

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 flex gap-3 items-start">
          <BellOff className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
          <p className="text-sm text-amber-800 dark:text-amber-200 italic">
            {t('Note: Gardez cet onglet ouvert ou ajoutez le site à votre écran d\'accueil pour une meilleure réception.', 'Note: Keep this tab open or add the site to your home screen for better delivery.')}
          </p>
        </div>
      </div>
    </div>
  );
};

