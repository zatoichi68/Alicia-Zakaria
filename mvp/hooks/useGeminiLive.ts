import { useState, useRef, useEffect, useCallback } from 'react';
import { decode, decodeAudioData, createPcmBlob, floatTo16BitPCM } from '../utils/audio';

interface UseGeminiLiveProps {
  onConnectionStateChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
  persona?: 'alicia' | 'zakaria';
  language?: 'fr' | 'en';
  accessCode?: string;
  memoryConsent?: boolean;
  onCallProche?: (nom: string) => void;
}

type ServerMessage =
  | { type: 'state'; connected: boolean }
  | { type: 'audio'; data: string }
  | { type: 'interrupted' }
  | { type: 'functionCall'; name: string; args: Record<string, unknown> }
  | { type: 'error'; message: string };

const normalizeWsUrl = (value: string) => {
  if (value.startsWith('wss://') || value.startsWith('ws://')) return value;
  if (value.startsWith('https://')) return value.replace('https://', 'wss://');
  if (value.startsWith('http://')) return value.replace('http://', 'ws://');
  return value;
};

const appendQuery = (url: string, params: Record<string, string>) => {
  const sep = url.includes('?') ? '&' : '?';
  const query = new URLSearchParams(params).toString();
  return `${url}${sep}${query}`;
};

const getWsUrl = (token: string) => {
  const configured = import.meta.env.VITE_VOICE_PROXY_URL as string | undefined;
  if (configured && configured.trim()) {
    return appendQuery(normalizeWsUrl(configured.trim()), { token });
  }
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return appendQuery(`${protocol}://${window.location.host}/voice`, { token });
};

export const useGeminiLive = ({ onConnectionStateChange, onError, persona = 'alicia', language = 'fr', accessCode, memoryConsent, onCallProche }: UseGeminiLiveProps) => {
  const [isDataStreaming, setIsDataStreaming] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const isStreamingRef = useRef(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const onConnectionStateChangeRef = useRef(onConnectionStateChange);
  const onErrorRef = useRef(onError);
  const onCallProcheRef = useRef(onCallProche);

  useEffect(() => {
    onConnectionStateChangeRef.current = onConnectionStateChange;
    onErrorRef.current = onError;
    onCallProcheRef.current = onCallProche;
  }, [onConnectionStateChange, onError, onCallProche]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextIn = useRef<AudioContext | null>(null);
  const audioContextOut = useRef<AudioContext | null>(null);
  const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const sources = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTime = useRef(0);

  const toolCallReceivedRef = useRef(false);
  const cleanupTimeoutRef = useRef<number | null>(null);
  const sessionClosingTimeoutRef = useRef<number | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);

  const saveMemoryFallback = useCallback(async () => {
    if (!accessCode || !memoryConsent) return;
    const normalizedAccessCode = String(accessCode).trim();
    const firstName = sessionStorage.getItem('mvp_first_name') || '';
    if (!normalizedAccessCode) return;

    console.log('💾 Fallback: Saving default memory entry...');
    try {
      await fetch('/api/memory/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode: normalizedAccessCode,
          summary: language === 'en' ? 'Conversation ended by the user.' : 'Conversation terminée par l\'utilisateur.',
          profileName: firstName,
          persona: persona
        }),
      });
      console.log('✅ Fallback save completed');
    } catch (err) {
      console.error('❌ Fallback save error:', err);
    }
  }, [accessCode, memoryConsent, persona, language]);

  const cleanupResources = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (scriptProcessor.current) {
      scriptProcessor.current.disconnect();
      scriptProcessor.current = null;
    }
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((t) => t.stop());
      mediaStream.current = null;
    }
    sources.current.forEach((s) => {
      try {
        s.stop();
        s.disconnect();
      } catch {
        // ignore
      }
    });
    sources.current.clear();

    if (audioContextIn.current && audioContextIn.current.state !== 'closed') {
      audioContextIn.current.close().catch(() => { });
      audioContextIn.current = null;
    }
    if (audioContextOut.current && audioContextOut.current.state !== 'closed') {
      audioContextOut.current.close().catch(() => { });
      audioContextOut.current = null;
    }

    onConnectionStateChangeRef.current?.(false);
  }, []);

  const stopSession = useCallback(async (graceful = false) => {
    // If graceful, ask AI to generate summary before closing
    if (graceful && wsRef.current && wsRef.current.readyState === wsRef.current.OPEN && isStreamingRef.current) {
      console.log('🛑 Requesting graceful shutdown...');

      // Stop sending audio immediately to prevent interruption
      isStreamingRef.current = false;

      // AGGRESSIVE MUTE: Disable tracks locally
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach(t => t.enabled = false);
      }
      // AGGRESSIVE MUTE: Disconnect processor to stop processing
      if (scriptProcessor.current) {
        try { scriptProcessor.current.disconnect(); } catch (e) { }
      }

      toolCallReceivedRef.current = false;
      const shutdownCmd = language === 'en'
        ? 'I have to go. Summarize our conversation and end the session.'
        : 'Je dois y aller. Fais le résumé et termine la conversation.';
      wsRef.current.send(JSON.stringify({ type: 'text', data: shutdownCmd }));

      // Give AI time to respond with fin_de_conversation tool call
      await new Promise(resolve => setTimeout(resolve, 8000));

      // If tool was not called, save a fallback entry
      if (!toolCallReceivedRef.current) {
        console.log('⚠️ Tool call not received after 4s, using fallback save');
        await saveMemoryFallback();
      }
    } else if (!toolCallReceivedRef.current && isStreamingRef.current) {
      // If we are stopping forcefully but were streaming and no tool was received yet
      console.log('⚠️ Force stop while streaming, attempting fallback save');
      await saveMemoryFallback();
    }

    isStreamingRef.current = false;
    setIsDataStreaming(false);
    setIsConnecting(false);

    if (wsRef.current && wsRef.current.readyState === wsRef.current.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
    }

    // Clear any existing timeout
    if (cleanupTimeoutRef.current) {
      window.clearTimeout(cleanupTimeoutRef.current);
    }

    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // Give 1 second for the stop message to reach proxy and any final buffers to clear
    cleanupTimeoutRef.current = window.setTimeout(() => {
      cleanupResources();
      cleanupTimeoutRef.current = null;
    }, 1000) as unknown as number;
  }, [saveMemoryFallback, cleanupResources, language]);

  const forceStopUI = useCallback(() => {
    setIsDataStreaming(false);
    isStreamingRef.current = false;
    onConnectionStateChangeRef.current?.(false);
  }, []);

  const updateVolume = useCallback(() => {
    if (analyser.current && isStreamingRef.current) {
      const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
      analyser.current.getByteTimeDomainData(dataArray);
      let sumSquares = 0.0;
      for (const amplitude of dataArray) {
        const norm = amplitude / 128.0 - 1.0;
        sumSquares += norm * norm;
      }
      setVolumeLevel(Math.sqrt(sumSquares / dataArray.length));
    } else {
      setVolumeLevel(0);
    }
    animationFrameRef.current = requestAnimationFrame(updateVolume);
  }, []);

  const sendText = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === wsRef.current.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', data: text }));
    }
  }, []);

  const handleServerMessage = useCallback(async (msg: ServerMessage) => {
    if (msg.type === 'state') {
      if (!msg.connected) {
        console.warn('📡 WebSocket Disconnected:', { code: (msg as any).code, reason: (msg as any).reason });
      }
      setIsConnecting(false);
      setIsDataStreaming(msg.connected);
      isStreamingRef.current = msg.connected;
      onConnectionStateChangeRef.current?.(msg.connected);
      return;
    }

    if (msg.type === 'error') {
      onErrorRef.current?.(msg.message);
      return;
    }

    if (msg.type === 'interrupted') {
      sources.current.forEach((s) => {
        try {
          s.stop();
          s.disconnect();
        } catch {
          // ignore
        }
      });
      sources.current.clear();
      nextStartTime.current = 0;
      return;
    }

    if (msg.type === 'audio' && audioContextOut.current) {
      try {
        nextStartTime.current = Math.max(nextStartTime.current, audioContextOut.current.currentTime);
        const audioBuffer = await decodeAudioData(
          decode(msg.data),
          audioContextOut.current,
          24000,
          1,
        );
        const source = audioContextOut.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextOut.current.destination);
        source.addEventListener('ended', () => sources.current.delete(source));
        source.start(nextStartTime.current);
        nextStartTime.current += audioBuffer.duration;
        sources.current.add(source);
      } catch {
        // ignore
      }
      return;
    }

    if (msg.type === 'functionCall') {
      if (msg.name === 'appeler_proche') {
        const nom = (msg.args as any)?.nom;
        if (nom) onCallProcheRef.current?.(nom);
        return;
      }
      
      if (msg.name === 'sauvegarder_et_quitter' || msg.name === 'fin_de_conversation') {
      console.log('🔧 Tool Call Received: ' + msg.name, msg.args);
      toolCallReceivedRef.current = true; // Mark that we received the tool call
      // Always save to Firestore
      const res = (msg.args as any)?.resume;
      if (res && accessCode && memoryConsent) {
        console.log('💾 Attempting to save memory to Firestore...');
        const normalizedAccessCode = String(accessCode).trim();
        const firstName = sessionStorage.getItem('mvp_first_name') || '';
        if (normalizedAccessCode) {
          fetch('/api/memory/set', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accessCode: normalizedAccessCode,
              summary: res,
              profileName: firstName,
              persona: persona
            }),
          })
            .then(response => {
              console.log('✅ Save response status:', response.status);
              if (!response.ok) console.error('❌ Save failed');
            })
            .catch(err => console.error('❌ Save error:', err));
        }
      } else {
        console.warn('⚠️ Memory not saved: Missing code or consent', { accessCode, memoryConsent });
      }

      // Only close everything if it's a natural conversation end
      // Give more time for the AI to say goodbye after the tool response
      if (isRefreshingRef.current) {
        window.dispatchEvent(new CustomEvent('session-refreshing'));
      } else {
        window.dispatchEvent(new CustomEvent('session-closing'));
      }
      
      if (sessionClosingTimeoutRef.current) window.clearTimeout(sessionClosingTimeoutRef.current);
      sessionClosingTimeoutRef.current = window.setTimeout(() => {
        const wasRefreshing = isRefreshingRef.current;
        stopSession();
        sessionClosingTimeoutRef.current = null;
        
        // If it was a refresh, restart automatically after cleanup
        if (wasRefreshing) {
          setTimeout(() => {
            if (isStreamingRef.current || isConnecting) return;
            startSession();
          }, 1000);
        }
      }, 6000) as unknown as number;
    }
    }
  }, [stopSession, accessCode, memoryConsent, persona]);

  const startSession = useCallback(async () => {
    if (isStreamingRef.current || isConnecting) return;

    isRefreshingRef.current = false; // Reset refresh flag on new session

    // If there is a pending cleanup, cancel it and clean up NOW
    if (cleanupTimeoutRef.current) {
      window.clearTimeout(cleanupTimeoutRef.current);
      cleanupResources();
      cleanupTimeoutRef.current = null;
    }

    setIsConnecting(true);
    toolCallReceivedRef.current = false; // Reset for new session
    nextStartTime.current = 0; // Reset audio scheduling clock

    // Clear any pending shutdown timers
    if (sessionClosingTimeoutRef.current) {
      window.clearTimeout(sessionClosingTimeoutRef.current);
      sessionClosingTimeoutRef.current = null;
    }

    try {
      let memory = '';
      let profileName = '';
      const normalizedAccessCode = String(accessCode || '').trim();
      if (memoryConsent) {
        if (!normalizedAccessCode) {
          throw new Error(language === 'en' ? 'Access code required to load memory.' : "Code d'accès requis pour charger la mémoire.");
        }
        try {
          const memoryRes = await fetch('/api/memory/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessCode: normalizedAccessCode }),
          });
          if (memoryRes.ok) {
            const memoryData = await memoryRes.json();
            profileName = String(memoryData.profileName || '');
            const entries = Array.isArray(memoryData.entries) ? memoryData.entries : [];
            const lines = entries
              .filter((e) => e && typeof e.summary === 'string' && e.summary.trim())
              .map((e) => {
                const date = e.createdAt ? new Date(e.createdAt).toLocaleDateString(language === 'en' ? 'en-CA' : 'fr-CA') : '';
                const prefix = date ? `[${date}] ` : '';
                return `- ${prefix}${String(e.summary).trim()}`;
              });
            if (lines.length) {
              memory = language === 'en'
                ? `Conversation history (recent):\n${lines.join('\n')}`
                : `Historique des conversations (récent):\n${lines.join('\n')}`;
            }
          }
        } catch {
          // continue without memory
        }
      }

      const currentFirstName = sessionStorage.getItem('mvp_first_name') || '';
      const identityInfo = language === 'en'
        ? `User first name: ${currentFirstName || profileName || 'User'}.`
        : `Prénom de l'utilisateur: ${currentFirstName || profileName || 'Utilisateur'}.`;
      memory = `${identityInfo}\n${memory}`.trim();

      console.log('📡 Initializing Voice Session...', {
        persona,
        accessCode: normalizedAccessCode,
        hasMemory: !!memory,
        memoryLength: memory.length
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextIn.current = new AudioCtx({ sampleRate: 16000 });
      audioContextOut.current = new AudioCtx({ sampleRate: 24000 });

      await audioContextIn.current.resume();
      await audioContextOut.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      mediaStream.current = stream;

      const tokenRes = await fetch('/api/voice-token', { method: 'GET' });
      if (!tokenRes.ok) {
        throw new Error(language === 'en' ? 'Unable to secure the session.' : 'Impossible de sécuriser la session.');
      }
      const tokenData = await tokenRes.json();
      const token = String(tokenData.token || '');
      if (!token) {
        throw new Error(language === 'en' ? 'Invalid token.' : 'Token invalide.');
      }

      const wsUrl = getWsUrl(token);
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = async (event) => {
        console.log('📩 Received WebSocket message:', event.data.toString().substring(0, 100));
        try {
          const msg = JSON.parse(event.data) as ServerMessage;
          await handleServerMessage(msg);
        } catch (err) {
          console.error('❌ Failed to parse message:', err);
        }
      };

      ws.onopen = () => {
        console.log('✅ WebSocket opened, sending start message...');
        ws.send(JSON.stringify({ type: 'start', persona, language, memory }));

        // Refresh session after 9 minutes (540,000ms) to avoid 10m limit
        if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = window.setTimeout(async () => {
          console.log('🔄 Session limit approaching, refreshing...');
          isRefreshingRef.current = true;
          // Stop current session gracefully (this saves memory)
          await stopSession(true);
        }, 540000) as unknown as number;

        const source = audioContextIn.current!.createMediaStreamSource(stream);

        // Setup Analyser for volume visualization without blocking audio thread
        analyser.current = audioContextIn.current!.createAnalyser();
        analyser.current.fftSize = 256;
        source.connect(analyser.current);

        scriptProcessor.current = audioContextIn.current!.createScriptProcessor(512, 1, 1);

        scriptProcessor.current.onaudioprocess = (e) => {
          if (!isStreamingRef.current || ws.readyState !== ws.OPEN) return;
          const inputData = e.inputBuffer.getChannelData(0);
          // Send raw binary PCM data instead of Base64 JSON for maximum performance
          const pcmData = floatTo16BitPCM(inputData);
          ws.send(pcmData);
        };

        source.connect(scriptProcessor.current);
        const silent = audioContextIn.current!.createGain();
        silent.gain.value = 0;
        scriptProcessor.current.connect(silent);
        silent.connect(audioContextIn.current!.destination);

        // Start the UI update loop for volume
        updateVolume();
      };

      ws.onerror = () => {
        onErrorRef.current?.(language === 'en' ? 'Unable to connect. Please try again.' : 'Connexion impossible. Veuillez réessayer.');
      };

      ws.onclose = () => {
        stopSession();
      };
    } catch (e: any) {
      onErrorRef.current?.(e?.message || (language === 'en' ? 'Unable to initialize microphone.' : "Impossible d'initialiser le micro."));
      stopSession();
    }
  }, [handleServerMessage, isConnecting, persona, stopSession, accessCode, memoryConsent, language]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return { isStreaming: isDataStreaming, isConnecting, startSession, stopSession, forceStopUI, sendText, volumeLevel };
};
