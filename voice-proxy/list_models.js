import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake');
async function run() {
    try {
        const models = await genAI.listModels();
        console.log('Available Models:');
        models.models.forEach(m => {
            console.log(`- ${m.name}: ${m.displayName} (Live:${m.supportedGenerationMethods.includes('live')})`);
        });
    } catch (e) {
        console.error('Error listing models:', e.message);
    }
}
run();
