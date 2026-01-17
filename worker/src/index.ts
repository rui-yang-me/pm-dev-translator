import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getSystemPrompt } from './prompts';

type Bindings = {
  DEEPSEEK_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

app.get('/', (c) => {
  return c.json({ message: 'PM-Dev Translator API', status: 'ok' });
});

app.post('/api/translate', async (c) => {
  const body = await c.req.json<{
    content: string;
    direction: 'pm-to-dev' | 'dev-to-pm';
  }>();

  const { content, direction } = body;

  if (!content || !direction) {
    return c.json({ error: 'Missing content or direction' }, 400);
  }

  if (direction !== 'pm-to-dev' && direction !== 'dev-to-pm') {
    return c.json({ error: 'Invalid direction' }, 400);
  }

  const apiKey = c.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return c.json({ error: 'API key not configured' }, 500);
  }

  const systemPrompt = getSystemPrompt(direction);

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content },
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return c.json({ error: `DeepSeek API error: ${error}` }, 500);
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
});

export default app;
