import { GoogleGenerativeAI } from '@google/generative-ai';
const testModel = async () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-live' });
    console.log('Model object created');
  } catch (e) {
    console.error('Model error:', e.message);
  }
}
testModel();
