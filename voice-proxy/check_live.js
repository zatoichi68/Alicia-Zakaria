import { GoogleGenAI } from '@google/genai';
const API_KEY = process.env.GEMINI_API_KEY;
async function run() {
    const client = new GoogleGenAI({ apiKey: API_KEY });
    try {
        // Le SDK @google/genai n'a pas de méthode simple listModels comme l'ancien SDK
        // On va tester la connexion avec le nom de modèle standard
        console.log("Tentative de connexion avec gemini-2.0-flash...");
    } catch (e) {
        console.error(e.message);
    }
}
run();
