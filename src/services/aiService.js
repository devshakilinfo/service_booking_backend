const db = require('../config/db');

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_TIMEOUT_MS = 15000;
const MAX_RECOMMENDATIONS = 2;

const KEYWORD_RULES = [
  {
    pattern: /\b(clean|cleaning|house|maid|dust|sofa|carpet)\b/,
    match: (s) => s.category === 'Cleaning',
    reply: 'For cleaning, these are our best-rated options. Professionals bring eco-friendly supplies.',
  },
  {
    pattern: /\b(ac|a\/c|air ?condition(er|ing)?|cooling)\b/,
    match: (s) => /\bac\b|air/i.test(s.name),
    reply: 'For air conditioning problems, a certified technician can inspect refrigerant, coils and fans.',
  },
  {
    pattern: /\b(pipe|plumb|plumbing|plumber|leak|leaking|tap|faucet|drain)\b/,
    match: (s) => /plumb/i.test(s.name),
    reply: 'For leaks or drainage problems, our plumbing service provides a quick diagnosis and fix.',
  },
  {
    pattern: /\b(beauty|hair|facial|salon|spa|makeup|parlour|parlor)\b/,
    match: (s) => s.category === 'Beauty',
    reply: 'Here are our at-home beauty services with certified stylists.',
  },
  {
    pattern: /\b(health|physio|nurse|nursing|elderly|therapy)\b/,
    match: (s) => s.category === 'Health',
    reply: 'Here are our at-home health and care services.',
  },
  {
    pattern: /\b(electric|electrical|wiring|switch|light|cctv|smart)\b/,
    match: (s) => s.category === 'Electric',
    reply: 'Here are our certified electrical and smart-home services.',
  },
  {
    pattern: /\b(paint|painting|wall)\b/,
    match: (s) => s.category === 'Painting',
    reply: 'Here are our painting services.',
  },
];

class AIService {
  async processQuery(userMessage) {
    const services = await this._loadServices();
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        return await this._callGeminiAPI(userMessage, services, apiKey);
      } catch (err) {
        console.warn('Gemini API call failed, using keyword fallback:', err.message);
      }
    }

    return this._generateFallbackResponse(userMessage, services);
  }

  async _loadServices() {
    const result = await db.query('SELECT * FROM services WHERE is_active = TRUE ORDER BY rating DESC');
    return result.rows.map((row) => ({
      _id: row.id.toString(),
      id: row.id.toString(),
      name: row.name,
      description: row.description,
      category: row.category,
      price: parseFloat(row.price),
      duration: row.duration,
      image: row.image,
      rating: parseFloat(row.rating),
      reviewsCount: row.reviews_count,
      highlights: row.highlights || [],
    }));
  }

  async _callGeminiAPI(userMessage, services, apiKey) {
    const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

    const catalog = services
      .map(
        (s) =>
          `- id: ${s.id} | ${s.name} | category: ${s.category} | price: $${s.price} | duration: ${s.duration} | rating: ${s.rating} | ${s.description}`
      )
      .join('\n');

    const prompt = `You are the AI assistant of ServiceHub, a home services booking app.
Only answer questions related to ServiceHub services, pricing, durations and booking.
If the question is unrelated, politely say you can only help with ServiceHub services.
Only recommend services from this catalog and never invent services or prices:
${catalog}

Respond with JSON of the form {"reply": string, "recommendedServiceIds": string[]}.
"reply" must be 2-4 friendly sentences. "recommendedServiceIds" holds at most ${MAX_RECOMMENDATIONS} ids from the catalog, or is empty when no recommendation fits.

User question: ${JSON.stringify(userMessage)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 400,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini HTTP ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error('Gemini returned an empty response');
    }

    const { reply, ids } = this._parseGeminiJson(rawText);
    const byId = new Map(services.map((s) => [s.id, s]));
    let recommended = ids.map((id) => byId.get(String(id))).filter(Boolean);

    if (recommended.length === 0) {
      const lowerReply = reply.toLowerCase();
      recommended = services.filter((s) => lowerReply.includes(s.name.toLowerCase()));
    }

    return {
      reply,
      recommendedServices: recommended.slice(0, MAX_RECOMMENDATIONS),
      source: model,
    };
  }

  _parseGeminiJson(rawText) {
    try {
      const cleaned = rawText.replace(/^```(?:json)?\s*|\s*```$/g, '');
      const parsed = JSON.parse(cleaned);
      return {
        reply: String(parsed.reply || '').trim() || rawText,
        ids: Array.isArray(parsed.recommendedServiceIds) ? parsed.recommendedServiceIds : [],
      };
    } catch (_) {
      return { reply: rawText.trim(), ids: [] };
    }
  }

  _generateFallbackResponse(userMessage, services) {
    const text = String(userMessage || '').toLowerCase();

    if (/\b(cheap|cheapest|budget|affordable|price|cost)\b/.test(text)) {
      const cheapest = [...services].sort((a, b) => a.price - b.price).slice(0, MAX_RECOMMENDATIONS);
      return {
        reply: cheapest.length
          ? `Our most affordable option is ${cheapest[0].name} at $${cheapest[0].price}.`
          : 'No services are available right now.',
        recommendedServices: cheapest,
        source: 'fallback-keyword-engine',
      };
    }

    for (const rule of KEYWORD_RULES) {
      if (rule.pattern.test(text)) {
        const matched = services.filter(rule.match);
        if (matched.length > 0) {
          return {
            reply: rule.reply,
            recommendedServices: matched.slice(0, MAX_RECOMMENDATIONS),
            source: 'fallback-keyword-engine',
          };
        }
      }
    }

    return {
      reply:
        'I can help with cleaning, repairs, beauty, health, electrical and painting services. Tell me what you need and I will suggest a match.',
      recommendedServices: [],
      source: 'fallback-keyword-engine',
    };
  }
}

module.exports = new AIService();
