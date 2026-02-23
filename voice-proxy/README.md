# Voice Proxy (Cloud Run)

This service provides a secure WebSocket proxy for Gemini Live voice chat.

## Deploy

```bash
gcloud run deploy voice-proxy \
  --source /Users/steverioux/Documents/Alicia-Zakaria/voice-proxy \
  --region us-central1 \
  --set-env-vars GEMINI_API_KEY=YOUR_KEY,VOICE_PROXY_SECRET=YOUR_SHARED_SECRET \
  --allow-unauthenticated
```

## Health Check

```bash
curl https://voice-proxy-<project>.us-central1.run.app/healthz
```

## WebSocket Test

This proxy requires a short-lived token from the Firebase Function:

```bash
curl https://alicia-zakaria.web.app/api/voice-token
```

Then pass the token to the WebSocket URL as a query param:

```bash
node --input-type=module -e "import { WebSocket } from 'ws';
const token='PASTE_TOKEN_HERE';
const ws=new WebSocket('wss://voice-proxy-<project>.us-central1.run.app/voice?token='+encodeURIComponent(token));
ws.on('open',()=>{console.log('open'); ws.send(JSON.stringify({type:'start', persona:'alicia', memory:''})); setTimeout(()=>{ws.send(JSON.stringify({type:'stop'})); ws.close();},2000);});
ws.on('message',(d)=>console.log('msg', d.toString()));
ws.on('close',()=>console.log('closed'));
ws.on('error',(e)=>console.error('error', e.message));
"
```
