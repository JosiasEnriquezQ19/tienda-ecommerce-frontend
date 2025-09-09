const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Helper: create an OpenAI client for a provider
function makeClientForProvider(provider = 'openai') {
  provider = (provider || 'openai').toLowerCase();
  // Accept different spellings the user may provide
  const isDeep = ['deepseek', 'deepsek', 'deep-seek', 'deepsel', 'deep-sek'].includes(provider);
  if (isDeep) {
    // Accept either DEEPSEEK_* or DEEPSEK_* env var names
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_APIKEY || process.env.DEEPSEK_API_KEY || process.env.DEEPSEK_APIKEY;
    const baseURL = process.env.DEEPSEEK_BASE_URL || process.env.DEEPSEK_BASE_URL || process.env.DEEPSEEK_BASEURL || process.env.DEEPSEK_BASEURL || 'https://api.deepseek.com';
    if (!apiKey) return { error: 'DEEPSEEK/DEEPSEK API key not set on server (set DEEPSEEK_API_KEY or DEEPSEK_API_KEY)' };
    return { client: new OpenAI({ apiKey, baseURL }) };
  }

  // default: OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: 'OPENAI_API_KEY not set on server' };
  return { client: new OpenAI({ apiKey }) };
}

// Proxy route: POST /openai with body { message, provider?, model?, max_tokens? }
app.post('/openai', async (req, res) => {
  const provider = req.body.provider || req.query.provider || 'openai';
  const message = req.body.message || req.body.prompt || '';
  if (!message) return res.status(400).json({ error: 'missing message' });

  const { client, error } = makeClientForProvider(provider);
  if (error) return res.status(500).json({ error });

  const model = req.body.model || req.query.model || (provider && provider.toLowerCase().includes('deep') ? 'deepseek-chat' : 'gpt-3.5-turbo');
  const max_tokens = req.body.max_tokens || req.body.maxTokens || 600;
  try {
    // Use the OpenAI SDK's chat completions
    const payload = {
      model,
      messages: [{ role: 'user', content: message }],
      max_tokens
    };

    const response = await client.chat.completions.create(payload);
    const data = response;
    const reply = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || null;
    return res.json({ reply, raw: data });
  } catch (err) {
    console.error('openai proxy error', err?.message || err, err);
    const errMsg = err?.message || String(err);
    return res.status(500).json({ error: errMsg });
  }
});

// simple health check
app.get('/health', (req, res) => res.json({ ok: true, provider: 'openai-proxy' }));

app.listen(PORT, () => console.log(`OpenAI/DeepSeek proxy listening on ${PORT}`));
