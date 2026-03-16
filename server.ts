import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// --- In-Memory Database ---
// In a real app, this would be a database like PostgreSQL, MongoDB, or Redis.
const apiKeys = new Set<string>(['dev-key-123']);
const services = [
  { 
    id: 'echo', 
    name: 'Echo Service', 
    description: 'Returns the exact JSON payload you send. Useful for testing.', 
    endpoint: '/gateway/echo', 
    method: 'POST' 
  },
  { 
    id: 'random', 
    name: 'Random Generator', 
    description: 'Generates a random UUID and a random number.', 
    endpoint: '/gateway/random', 
    method: 'GET' 
  },
  { 
    id: 'ai', 
    name: 'AI Text Gen', 
    description: 'Generates text using Gemini 3.1 Flash.', 
    endpoint: '/gateway/ai', 
    method: 'POST' 
  }
];

// --- Management APIs (Frontend) ---
app.get('/api/services', (req, res) => {
  res.json(services);
});

app.get('/api/keys', (req, res) => {
  res.json(Array.from(apiKeys));
});

app.post('/api/keys', (req, res) => {
  const newKey = `sk_${uuidv4().replace(/-/g, '')}`;
  apiKeys.add(newKey);
  res.json({ key: newKey });
});

app.delete('/api/keys/:key', (req, res) => {
  const key = req.params.key;
  if (apiKeys.has(key)) {
    apiKeys.delete(key);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Key not found' });
  }
});

// --- Gateway Middleware ---
const requireApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (!apiKey || !apiKeys.has(apiKey as string)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
  }
  next();
};

// --- Gateway Routes ---
app.post('/gateway/echo', requireApiKey, (req, res) => {
  res.json({ 
    message: 'Echo response', 
    data: req.body, 
    timestamp: new Date().toISOString() 
  });
});

app.get('/gateway/random', requireApiKey, (req, res) => {
  res.json({ 
    id: uuidv4(), 
    randomValue: Math.floor(Math.random() * 10000), 
    timestamp: new Date().toISOString() 
  });
});

app.post('/gateway/ai', requireApiKey, async (req, res) => {
  try {
    const prompt = req.body.prompt || 'Say hello';
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    res.json({ result: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Vite Middleware & Static Serving ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
