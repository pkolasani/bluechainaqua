const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 6000;
const MAX_TOTAL_CHARS = 24000;

const SYSTEM_PROMPT = `You are Blue Chain Aqua AI, the dedicated AI assistant for Blue Chain Aqua, an Aquaculture & Fisheries Consultancy in India.

STRICT SCOPE: Answer aquaculture and fisheries questions, including fish farming, shrimp farming, hatcheries, biofloc, RAS, ponds, water quality, feed, disease prevention, stocking, harvesting, processing, cold chain, fisheries infrastructure, fisher welfare, government schemes, project finance, DPRs and Blue Chain Aqua services.

If a request is genuinely unrelated to aquaculture or fisheries, politely explain that you only handle aquaculture and fisheries topics.

Keep answers practical and clear for farmers and project owners. Do not claim to be a government authority. For project-specific technical, veterinary, chemical, legal, financial or regulatory decisions, provide general information and recommend a qualified professional where appropriate.

Blue Chain Aqua services include farmer onboarding, site/water assessment, scheme identification, DPR and documentation, submission/follow-up, sanction/disbursement coordination, implementation support, pond preparation, hatchery, grow-out farming, harvesting, processing/value addition, market/supply-chain planning and blue-economy projects.`;

function getClientOrigin(req) {
  return req.headers.origin || req.headers.referer || '';
}

function isAllowedOrigin(req) {
  const value = getClientOrigin(req);
  if (!value) return true; // Direct requests are still protected by server validation.
  try {
    const url = new URL(value);
    return url.hostname === 'bluechainaqua.in' || url.hostname === 'www.bluechainaqua.in' || url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch (_) {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY is not configured');
    return res.status(500).json({ error: 'AI service is not configured.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || !Array.isArray(body.messages)) {
      return res.status(400).json({ error: 'Invalid chat request.' });
    }

    if (body.messages.length > MAX_MESSAGES) {
      return res.status(413).json({ error: 'Conversation is too large.' });
    }

    let totalChars = 0;
    const safeMessages = [];
    for (const message of body.messages) {
      if (!message || !['user', 'assistant'].includes(message.role)) continue;
      const content = String(message.content || '').trim();
      if (!content || content.length > MAX_MESSAGE_CHARS) {
        return res.status(400).json({ error: 'Message is invalid or too long.' });
      }
      totalChars += content.length;
      if (totalChars > MAX_TOTAL_CHARS) {
        return res.status(413).json({ error: 'Conversation is too large.' });
      }
      safeMessages.push({ role: message.role, content });
    }

    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...safeMessages],
        temperature: 0.3,
        max_completion_tokens: 900
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Groq chat error:', response.status, data);
      return res.status(response.status).json({ error: data?.error?.message || 'Groq request failed.' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(400).json({ error: 'Invalid or failed AI request.' });
  }
}
