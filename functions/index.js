import { onRequest } from 'firebase-functions/v2/https';
import crypto from 'crypto';
import 'dotenv/config';

// Lazy load heavy modules to prevent deployment timeouts
let adminModule = null;
let genAIModule = null;
let db = null;

const getAdmin = async () => {
  if (!adminModule) {
    const mod = await import('firebase-admin');
    adminModule = mod.default || mod;
    if (!adminModule.apps.length) {
      adminModule.initializeApp();
    }
  }
  return adminModule;
};

const getDb = async () => {
  if (!db) {
    const admin = await getAdmin();
    db = admin.firestore();
  }
  return db;
};

const getGenAI = async () => {
  if (!genAIModule) {
    const { GoogleGenAI } = await import('@google/genai');
    genAIModule = GoogleGenAI;
  }
  return genAIModule;
};

const getApiKey = () => {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    ''
  );
};

const getVoiceSecret = () => {
  return process.env.VOICE_PROXY_SECRET || '';
};

const signToken = (secret, payload) => {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

const normalizeAccessCode = (value) => {
  return String(value || '').trim();
};

const MEMORY_RETENTION_MONTHS = 6;

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

export const api = onRequest(async (req, res) => {
  const path = req.path || '';
  const isVoiceToken = path === '/voice-token' || path.endsWith('/voice-token');
  const isSearch = path === '/search' || path.endsWith('/search');
  const isMemoryGet = path === '/memory/get' || path.endsWith('/memory/get');
  const isMemorySet = path === '/memory/set' || path.endsWith('/memory/set');
  const isMemoryDelete = path === '/memory/delete' || path.endsWith('/memory/delete');
  const isGetCall = path === '/memory/get_call' || path.endsWith('/memory/get_call');
  const isNotifySend = path === '/notify/send' || path.endsWith('/notify/send');
  const isFamilyRegister = path === '/family/register' || path.endsWith('/family/register');

  if (isVoiceToken) {
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    const secret = getVoiceSecret();
    if (!secret) {
      res.status(500).json({ error: 'Missing server voice secret' });
      return;
    }
    const ts = Date.now().toString();
    const sig = signToken(secret, ts);
    res.status(200).json({ token: `${ts}.${sig}`, expiresInMs: 5 * 60 * 1000 });
    return;
  }

  if (isMemoryGet || isMemorySet || isMemoryDelete) {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const accessCode = normalizeAccessCode(req.body?.accessCode);
      if (!accessCode) {
        console.warn('Memory operation failed: Missing access code');
        res.status(400).json({ error: 'Missing access code' });
        return;
      }

      const firestore = await getDb();
      const docRef = firestore.collection('memories').doc(accessCode);

      if (isMemoryGet) {
        console.log(`Fetching memory for: ${accessCode}`);
        const snap = await docRef.get();
        if (!snap.exists) {
          res.status(200).json({ entries: [], profileName: '' });
          return;
        }
        const data = snap.data() || {};
        const convSnap = await docRef
          .collection('conversations')
          .orderBy('createdAt', 'desc')
          .limit(20)
          .get();
        const entries = convSnap.docs
          .map((doc) => {
            const c = doc.data() || {};
            const createdAt = c.createdAt?.toDate ? c.createdAt.toDate().toISOString() : '';
            return { summary: c.summary || '', createdAt, persona: c.persona || 'Alicia' };
          })
          .reverse();
        res.status(200).json({ entries, profileName: data.profileName || '' });
        return;
      }

      if (isMemoryDelete) {
        console.log(`Deleting memory for: ${accessCode}`);
        const batchDelete = async () => {
          const snap = await docRef.collection('conversations').limit(500).get();
          if (snap.empty) return 0;
          const batch = firestore.batch();
          snap.docs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
          return snap.size;
        };

        let deleted = 0;
        while (true) {
          const count = await batchDelete();
          deleted += count;
          if (count < 500) break;
        }

        await docRef.delete();
        res.status(200).json({ ok: true, deleted });
        return;
      }

      // isMemorySet
      const summary = String(req.body?.summary || '').trim();
      if (!summary) {
        res.status(400).json({ error: 'Missing summary' });
        return;
      }
      if (summary.length > 4000) {
        res.status(400).json({ error: 'Summary too long' });
        return;
      }

      const profileName = String(req.body?.profileName || '').trim();
      const personaRaw = String(req.body?.persona || '').toLowerCase();
      const compagnonName = personaRaw === 'zakaria' ? 'Zakaria' : 'Alicia';

      console.log(`💾 Saving memory for ${accessCode}. Profile: ${profileName}. Persona: ${compagnonName}`);

      const { Timestamp, FieldValue } = await import('firebase-admin/firestore');
      const expiresAt = Timestamp.fromDate(addMonths(new Date(), MEMORY_RETENTION_MONTHS));
      const createdAt = FieldValue.serverTimestamp();

      const batch = firestore.batch();
      const convRef = docRef.collection('conversations').doc();
      
      batch.set(convRef, {
        summary,
        persona: compagnonName,
        createdAt,
        expiresAt,
        purpose: 'conversation_summary',
        schemaVersion: 1,
      });

      batch.set(docRef, {
        updatedAt: FieldValue.serverTimestamp(),
        purpose: 'conversation_memory',
        schemaVersion: 1,
        ...(profileName ? { profileName } : {}),
      }, { merge: true });

      await batch.commit();
      console.log(`✅ Memory saved successfully for ${accessCode}`);
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('❌ Memory operation error:', err);
      res.status(500).json({ error: 'Internal memory error', details: err.message });
    }
    return;
  }

  if (isGetCall) {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    try {
      const { token } = req.body || {};
      if (!token) {
        res.status(400).json({ error: 'Missing token' });
        return;
      }
      const firestore = await getDb();
      const callSnap = await firestore.collection('incoming_calls').doc(token).get();
      
      if (!callSnap.exists) {
        res.status(200).json({ roomName: null });
        return;
      }

      const data = callSnap.data();
      const callTime = new Date(data.timestamp).getTime();
      const now = Date.now();

      // On n'autorise que les appels émis il y a moins de 2 minutes
      if (now - callTime < 120000) {
        res.status(200).json({ roomName: data.roomName });
      } else {
        res.status(200).json({ roomName: null });
      }
    } catch (err) {
      console.error('❌ Get call error:', err);
      res.status(500).json({ error: 'Failed to fetch call' });
    }
    return;
  }

  if (isFamilyRegister) {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    try {
      const { accessCode, token, familyName } = req.body || {};
      if (!accessCode || !token) {
        res.status(400).json({ error: 'Missing accessCode or token' });
        return;
      }
      const firestore = await getDb();
      const familyRef = firestore.collection('memories').doc(normalizeAccessCode(accessCode)).collection('family').doc(token);
      await familyRef.set({
        token,
        name: familyName || 'Proche',
        updatedAt: new Date().toISOString()
      });
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('❌ Family register error:', err);
      res.status(500).json({ error: 'Failed to register family device' });
    }
    return;
  }

  if (isNotifySend) {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { token, accessCode, title, body, data } = req.body || {};
      const admin = await getAdmin();
      let targetTokens = [];

      if (token) {
        targetTokens = [token];
      } else if (accessCode) {
        const firestore = await getDb();
        const familySnap = await firestore.collection('memories').doc(normalizeAccessCode(accessCode)).collection('family').get();
        // Filtrage strict : trim et suppression des doublons
        const rawTokens = familySnap.docs.map(doc => String(doc.data().token || "").trim()).filter(Boolean);
        targetTokens = [...new Set(rawTokens)];
      }

      if (targetTokens.length === 0) {
        res.status(200).json({ ok: true, sentCount: 0, note: 'No tokens found' });
        return;
      }

      const results = await Promise.all(targetTokens.map(async (t) => {
        try {
          const jitsiUrl = `https://meet.jit.si/${data?.roomName}`;
          
          // Sauvegarder l'intention d'appel dans Firestore pour ce token
          const firestore = await getDb();
          await firestore.collection('incoming_calls').doc(t).set({
            roomName: String(data?.roomName || ""),
            timestamp: new Date().toISOString()
          });

          // Envoyer un message hybride optimisé pour CallKit (iOS Native)
          return await admin.messaging().send({
            token: t,
            notification: {
              title: title || "Appel entrant",
              body: body || "Cliquez pour rejoindre la conversation"
            },
            data: {
              roomName: String(data?.roomName || ""),
              type: "VIDEO_CALL",
              handle: "Alicia & Zakaria" // Nom affiché par CallKit
            },
            android: { 
              priority: "high",
              notification: {
                clickAction: "OPEN_ACTIVITY_CALL"
              }
            },
            apns: { 
              headers: {
                'apns-priority': '10', // Priorité maximale pour réveiller le device
                'apns-push-type': 'alert'
              },
              payload: { 
                aps: { 
                  contentAvailable: true, // Réveille l'app en arrière-plan
                  badge: 1,
                  sound: "default",
                  mutableContent: true // Permet à l'app de traiter le message avant affichage
                } 
              } 
            }
          });
        } catch (e) {
          console.error(`Failed to send to token ${t}:`, e.message);
          return null;
        }
      }));

      const successCount = results.filter(Boolean).length;
      res.status(200).json({ ok: true, sentCount: successCount });
    } catch (err) {
      console.error('❌ FCM Error:', err);
      res.status(500).json({ error: 'Failed to send notification' });
    }
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isSearch) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    res.status(500).json({ error: 'Missing server API key' });
    return;
  }

  const { query } = req.body || {};
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Invalid query' });
    return;
  }

  try {
    const GoogleGenAI = await getGenAI();
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = result.text || "Je n'ai pas trouvé de réponse, désolé.";
    const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = (chunks || [])
      .map((c) => c?.web)
      .filter(Boolean)
      .map((w) => ({ uri: w.uri, title: w.title }));

    res.status(200).json({ text, sources });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});
