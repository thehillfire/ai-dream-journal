require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Dream Analysis Endpoint
app.post('/api/analyze-dream', async (req, res) => {
  try {
    const { dreamText } = req.body;
    
    if (!dreamText) {
      return res.status(400).json({ error: 'Dream text is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Analyze this dream and provide insights:\n\n"${dreamText}"\n\nProvide:\n1. Emotional insights (detect emotions)\n2. Symbol recognition (identify recurring symbols)\n3. Theme detection (discover patterns)\n4. Narrative analysis (understand story structure)\n5. Lucidity indicators (elements that trigger lucid dreaming)\n\nFormat as JSON with keys: emotions, symbols, themes, narrative, lucidityIndicators`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();
    
    // Try to parse as JSON, fallback to text if fails
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      analysis = { rawAnalysis: analysisText };
    }
    
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Dream analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze dream' });
  }
});

// Image Generation Endpoint
app.post('/api/generate-image', async (req, res) => {
  try {
    const { dreamDescription } = req.body;
    
    if (!dreamDescription) {
      return res.status(400).json({ error: 'Dream description is required' });
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a surreal, dreamlike artwork based on this dream: ${dreamDescription}`,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data[0].url;
    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// Pattern Recognition Endpoint
app.post('/api/recognize-patterns', async (req, res) => {
  try {
    const { dreams } = req.body;
    
    if (!dreams || !Array.isArray(dreams)) {
      return res.status(400).json({ error: 'Dreams array is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const dreamsText = dreams.map((d, i) => `Dream ${i + 1}: ${d.text}`).join('\n\n');
    const prompt = `Analyze these dreams for patterns:\n\n${dreamsText}\n\nProvide:\n1. Recurring elements (people, places, objects)\n2. Emotional timeline (track emotions across dreams)\n3. Dream categories (nightmares, lucid, recurring, etc.)\n4. Sleep quality correlation\n5. Trigger identification\n\nFormat as JSON.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const patternsText = response.text();
    
    let patterns;
    try {
      patterns = JSON.parse(patternsText);
    } catch {
      patterns = { rawPatterns: patternsText };
    }
    
    res.json({ success: true, patterns });
  } catch (error) {
    console.error('Pattern recognition error:', error);
    res.status(500).json({ error: 'Failed to recognize patterns' });
  }
});

// Speech-to-Text Endpoint (Whisper)
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioData } = req.body;
    
    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioData, 'base64');
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioBuffer,
      model: "whisper-1",
    });

    res.json({ success: true, text: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`AI Dream Journal server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
