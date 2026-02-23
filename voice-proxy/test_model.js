async function testModel() {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-live' });
    console.log('Model exists in SDK');
  } catch (e) {
    console.error('Model not found');
  }
}
testModel();
