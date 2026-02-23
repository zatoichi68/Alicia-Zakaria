import http from 'http';
import crypto from 'crypto';
import { WebSocketServer } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || '';
const VOICE_SECRET = process.env.VOICE_PROXY_SECRET || '';

const server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200);
    res.end('ok');
    return;
  }
  res.writeHead(404);
  res.end('not found');
});

// Set timeouts for long-lived WebSocket connections
server.keepAliveTimeout = 120000; // 2 minutes
server.headersTimeout = 125000; // slightly more than keepAliveTimeout

const wss = new WebSocketServer({ server });

// Heartbeat to keep connections alive
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('Terminating inactive client');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

const getClientIp = (req) => {
  const xfwd = req.headers['x-forwarded-for'];
  return (typeof xfwd === 'string' ? xfwd.split(',')[0].trim() : req.socket.remoteAddress) || 'unknown';
};

const verifyToken = (token) => {
  if (!VOICE_SECRET) return true;
  if (!token) return false;
  const [ts, sig] = token.split('.');
  if (!ts || !sig) return false;
  const expected = crypto.createHmac('sha256', VOICE_SECRET).update(ts).digest('hex');
  return expected === sig;
};

const buildSystemInstruction = ({ persona, memory, language }) => {
  const lang = language === 'en' ? 'en' : 'fr';

  const sharedFr = `
    Ton : Québécois authentique, chaleureux.
    Politesse : Utilise TOUJOURS le vouvoiement ("vous").
    Règle : Finis toujours tes phrases par UNE question simple.

    HUMOUR (Blagues à raconter si l'utilisateur le demande) :
    1. Que dit une tasse dans un ascenseur ? "Je veux monter !" (Jeu de mots avec "Je veux mon thé").
    2. Que demande un chat qui entre dans une pharmacie ? "Un sirop pour ma-toux !" (Jeu de mots avec "matou").

    RECHERCHE GOOGLE :
    - Tu as accès à l'outil de recherche Google (google_search).
    - Utilise-le SYSTÉMATIQUEMENT pour toute question sur l'actualité, la météo, les résultats sportifs ou des informations factuelles récentes.

    PILIER DE RÉMINISCENCE :
    - Ton objectif est d'encourager l'aîné à partager ses souvenirs et ses expériences passées.
    - Sois empathique, naturel et réconfortant.
    - Propose des activités engageantes basées sur le passé de l'utilisateur (musique d'époque, nouvelles locales du Québec).
    - Adapte tes questions en fonction du vécu de l'aîné pour qu'il se sente véritablement écouté.

    PROCÉDURE DE FIN DE CONVERSATION (CRITIQUE) :
    - DÉTECTION : Si l'utilisateur exprime une intention CLAIRE et EXPLICITE de partir (ex: "Au revoir", "À la prochaine", "Bye bye", "Je dois y aller").
    - ATTENTION : Les mots "Salut", "Bonjour", "Allô" et "Coucou" sont des salutations de DÉBUT de conversation. NE TERMINE JAMAIS la conversation sur ces mots.
    - RÈGLE D'OR D'INITIATIVE : Tu ne dois JAMAIS initier la fin de la conversation. Cela doit toujours venir de l'utilisateur.
    - ACTION 1 (INDISSOCIABLE) : Dis un au revoir TRÈS chaleureux, québécois et personnalisé de vive voix (Audio). Tu DOIS parler pendant au moins 3 à 4 secondes pour que l'utilisateur t'entende bien.
    - ACTION 2 (SIMULTANÉE) : Appelle l'outil 'fin_de_conversation' avec un résumé complet.
    - RÈGLE D'OR : Ne termine jamais une session sans un au revoir vocal clair. L'audio est la priorité.

    RÈGLES CRITIQUES DE MODALITÉ :
    - RÉPONDS UNIQUEMENT EN FRANÇAIS QUÉBÉCOIS.
    - TA RÉPONSE DOIT ÊTRE AUDIO.

    Mémoire : ${memory || 'Première conversation.'}
  `;

  const sharedEn = `
    Tone: Warm, caring, and natural Canadian English.
    Politeness: Use respectful, clear language suitable for seniors.
    Rule: Keep answers short and easy to follow, and usually end with one simple question.

    HUMOR (if the user asks for a joke):
    1. What kind of tea is hard to swallow? Reality.
    2. Why did the scarecrow win an award? Because he was outstanding in his field.

    GOOGLE SEARCH:
    - You have access to google_search.
    - Use it systematically for recent facts: news, weather, sports, and current events.

    REMINISCENCE PRIORITY:
    - Encourage the senior to share memories and life experiences.
    - Be empathetic, natural, and comforting.
    - Suggest engaging activities based on their past (era music, local news, familiar routines).
    - Adapt questions to their lived experience so they feel truly heard.

    CONVERSATION END PROCEDURE (CRITICAL):
    - DETECTION: End only if the user clearly says they want to leave (e.g., "Goodbye", "See you", "I have to go").
    - WARNING: "Hi", "Hello", "Hey" are conversation starters. Never end on these words.
    - INITIATIVE RULE: Never initiate ending the session. The user must decide.
    - ACTION 1 (MANDATORY): Say a very warm personalized goodbye in audio, for at least 3-4 seconds.
    - ACTION 2 (SIMULTANEOUS): Call the tool 'fin_de_conversation' with a complete summary.
    - GOLDEN RULE: Never end without a clear spoken goodbye. Audio comes first.

    CRITICAL MODALITY RULES:
    - RESPOND ONLY IN ENGLISH.
    - RESPONSE MUST BE AUDIO.

    Memory: ${memory || 'First conversation.'}
  `;

  if (lang === 'en') {
    if (persona === 'zakaria') {
      return `You are Zakaria, a calm male companion. You love sports, especially hockey, and you are a big fan of the Montreal Canadiens. ${sharedEn}`;
    }
    return `You are Alicia, a warm female companion. You enjoy TV shows and gentle conversation, and you bring calm energy. ${sharedEn}`;
  }

  if (persona === 'zakaria') {
    return `Tu es Zakaria, compagnon masculin calme. Tu adores le sport, particulièrement le hockey et tu es un grand fan des Canadiens de Montréal. ${sharedFr}`;
  }
  return `Tu es Alicia, compagne féminine chaleureuse. Tu es passionnée par les émissions de télévision, tant québécoises que françaises. ${sharedFr}`;
};

wss.on('connection', (ws, req) => {
  const ip = getClientIp(req);
  console.log('[' + ip + '] WebSocket Connected');

  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');

  if (!verifyToken(token)) {
    ws.close(1008, 'Invalid token');
    return;
  }

  let session = null;

  async function safeSend(payload, context = '') {
    if (!session) return;

    // 1. Try specialized SDK methods if available
    try {
      if (payload.toolResponse && typeof session.sendToolResponse === 'function') {
        await session.sendToolResponse(payload.toolResponse);
        console.log('[' + context + '] Sent using session.sendToolResponse');
        return true;
      }
      if (payload.realtimeInput && typeof session.sendRealtimeInput === 'function') {
        await session.sendRealtimeInput(payload.realtimeInput);
        console.log('[' + context + '] Sent using session.sendRealtimeInput');
        return true;
      }
    } catch (e) {
      console.error('[' + context + '] Specialized method failed:', e.message);
    }

    // 2. Try generic send methods
    const methods = ['send', 'sendContent', 'sendMessage'];
    for (const m of methods) {
      if (typeof session[m] === 'function') {
        try {
          await session[m](payload);
          console.log('[' + context + '] Sent using session.' + m);
          return true;
        } catch (e) {
          console.error('[' + context + '] Failed with session.' + m + ':', e.message);
        }
      }
    }

    // 3. Last resort: direct JSON stringification if it's a raw socket (fallback)
    try {
      if (typeof session.send === 'function') {
        await session.send(JSON.stringify(payload));
        console.log('[' + context + '] Sent using session.send(JSON)');
        return true;
      }
    } catch (e) { }

    return false;
  }

  const sendToClient = (payload) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  };

  ws.on('message', async (data, isBinary) => {
    if (isBinary) {
      if (session) {
        if (session.isShuttingDown) {
          console.warn('RECEIVED AUDIO AFTER SHUTDOWN: ' + data.length + ' bytes. Ignoring.');
          return;
        }
        try {
          if (!session.lastAudioLog || Date.now() - session.lastAudioLog > 2000) {
            console.log('[CLIENT -> PROXY] Audio active (' + data.length + ' bytes)');
            session.lastAudioLog = Date.now();
          }
          session.sendRealtimeInput({
            media: { data: data.toString('base64'), mimeType: 'audio/pcm;rate=16000' }
          });
        } catch (e) {
          console.error('Error sending audio to Gemini:', e.message);
        }
      }
      return;
    }

    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'start') {
        console.log('Starting new session');
        ws.sessionStartedAt = Date.now();
        const client = new GoogleGenAI({ apiKey: API_KEY });
        session = await client.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          config: {
            tools: [
              { googleSearch: {} },
              {
                functionDeclarations: [{
                  name: 'fin_de_conversation',
                  description: 'Enregistre le résumé et termine la session.',
                  parameters: {
                    type: 'OBJECT',
                    properties: { resume: { type: 'STRING', description: 'Résumé de la discussion' } },
                    required: ['resume']
                  }
                },
                {
                  name: 'appeler_proche',
                  description: 'Lance un appel vidéo avec un membre de la famille ou un proche.',
                  parameters: {
                    type: 'OBJECT',
                    properties: { 
                      nom: { type: 'STRING', description: 'Le nom du proche à appeler (ex: Sophie, Pierre, Julie)' } 
                    },
                    required: ['nom']
                  }
                }]
              }
            ],
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: msg.persona === 'zakaria' ? 'Charon' : 'Aoede' } }
            },
            systemInstruction: { parts: [{ text: buildSystemInstruction(msg) }] }
          },
          callbacks: {
            onopen: function () {
              console.log('Session connected (onopen)');
              try {
                if (session) {
                  console.log('Session Keys: ' + Object.keys(session));
                }
              } catch (e) {
                console.error('Error in onopen keys:', e.message);
              }
              sendToClient({ type: 'state', connected: true });
            },
            onmessage: async function (m) {
              console.log('--- GEMINI MESSAGE START ---');
              console.log(JSON.stringify(m).substring(0, 1000));
              console.log('--- GEMINI MESSAGE END ---');
              
              // 1. Handle TOP-LEVEL toolCall
              if (m.toolCall && m.toolCall.functionCalls) {
                for (const f of m.toolCall.functionCalls) {
                  console.log('Top-level Tool Call:', f.name);
                  if (f.name === 'fin_de_conversation') {
                    console.log('DELAYING fin_de_conversation relay by 4s...');
                    setTimeout(() => {
                      sendToClient({ type: 'functionCall', name: f.name, args: f.args });
                    }, 4000);
                  } else {
                    sendToClient({ type: 'functionCall', name: f.name, args: f.args });
                  }

                  safeSend({
                    toolResponse: {
                      functionResponses: [{
                        name: f.name,
                        response: { success: true },
                        id: f.id
                      }]
                    }
                  }, 'topToolResponse');
                }
              }

              // 2. Handle serverContent parts
              const parts = m.serverContent?.modelTurn?.parts || [];
              for (const p of parts) {
                if (p.inlineData) {
                  sendToClient({ type: 'audio', data: p.inlineData.data });
                }
                if (p.functionCall) {
                  console.log('Tool Call:', p.functionCall.name);
                  if (p.functionCall.name === 'fin_de_conversation') {
                    console.log('DELAYING fin_de_conversation relay by 4s...');
                    setTimeout(() => {
                      sendToClient({ type: 'functionCall', name: p.functionCall.name, args: p.functionCall.args });
                    }, 4000);
                  } else {
                    sendToClient({ type: 'functionCall', name: p.functionCall.name, args: p.functionCall.args });
                  }

                  safeSend({
                    toolResponse: {
                      functionResponses: [{
                        name: p.functionCall.name,
                        response: { success: true },
                        id: p.functionCall.id
                      }]
                    }
                  }, 'toolResponse');
                }
              }

              if (m.serverContent?.interrupted) {
                console.log('STOP event received');
                const hasToolCall = !!m.toolCall || !!m.serverContent?.modelTurn?.parts?.find(p => p.functionCall);
                if (!hasToolCall) {
                  sendToClient({ type: 'interrupted' });
                }

                if (session && session.isShuttingDown) {
                  setTimeout(() => {
                    sendToClient({
                      type: 'functionCall',
                      name: 'fin_de_conversation',
                      args: {
                        resume: msg.language === 'en'
                          ? 'Session interrupted during shutdown.'
                          : 'Session interrompue lors de la fermeture.'
                      }
                    });
                  }, 2000);
                }
              }
            },
            onclose: function (e) {
              console.log('Gemini Session closed:', e);
              const reason = e && e.reason ? e.reason : 'Unknown';
              const code = e && e.code ? e.code : 1000;
              console.log('Closure code:', code, 'Reason:', reason);
              sendToClient({ type: 'state', connected: false, code, reason });
            },
            onerror: function (e) {
              console.error('Gemini Session error:', e);
              if (e && e.message) {
                console.error('Error message:', e.message);
              }
              sendToClient({ type: 'error', message: 'Gemini error' });
            }
          }
        });
        session.isShuttingDown = false;
      } else if (msg.type === 'start' && session) {
        // Redundant start or session refresh? Log and ignore normally or restart.
        console.log('Start received but session already active.');
      } else if (msg.type === 'text' && session) {
        if (msg.data.includes('Fais le résumé') || msg.data.toLowerCase().includes('summarize our conversation')) {
          console.log('SHUTDOWN command received. Marking session as shutting down. Ignoring future audio.');
          session.isShuttingDown = true;
        }
        console.log('Sending text to Gemini: ' + msg.data);
        await safeSend({ clientContent: { turns: [{ parts: [{ text: msg.data }], role: 'user' }] } }, 'textMessage');
      }
    } catch (e) {
      console.error('Error in voice socket message:', e.message);
    }
  });

  ws.on('close', () => {
    if (session) try { session.close(); } catch (e) { }
  });
});

server.listen(PORT, () => console.log(`Proxy on ${PORT}`));
