<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1-UGY2SRRTrk7ZmQ04ZVtgSVACuOsNKX6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure voice proxy URL in [.env.local](.env.local):
   `VITE_VOICE_PROXY_URL=wss://voice-proxy-<project>.us-central1.run.app/voice`
3. (Optional) Health check the voice proxy:
   `curl https://voice-proxy-<project>.us-central1.run.app/healthz`
4. Ensure backend keys are set for search + voice token:
   `functions/.env` should include `GEMINI_API_KEY` and `VOICE_PROXY_SECRET`
5. Run the app:
   `npm run dev`

## Backlog

- Add Firebase Auth (ID token) gating for the voice proxy to block anonymous access.
- Enable Firestore TTL on `memories.expiresAt` to enforce retention.
